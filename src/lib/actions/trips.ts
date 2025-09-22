
'use server';

import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';


import { revalidatePath } from 'next/cache';
import { placeholderImages } from '@/lib/placeholder-images';
import { randomUUID } from 'crypto';
import type { Expense, Trip } from '@/lib/types';
import { sendTripInviteEmail, sendWelcomeEmail } from '@/lib/email';
import { getFirebaseAdmin } from '@/lib/firebase-admin'; // Added this line
import { FieldValue } from 'firebase-admin/firestore';

// NOTE: We are now using the Firebase Admin SDK for all Firestore operations.
// We no longer import from 'firebase/firestore'.

interface CreateTripParams {
  tripData: {
    destination: string;
    startDate: string;
    endDate: string;
    interests: string;
    budget: string;
  };
  userId: string;
}

export async function createTripAction({ tripData, userId }: CreateTripParams): Promise<{ success: boolean; tripId?: string; error?: string; }> {
  const { db, auth } = getFirebaseAdmin();

  console.log('[ACTION] Starting createTripAction for user:', userId);

  if (!process.env.GEMINI_API_KEY) {
    console.error('[ACTION] ERROR: GEMINI_API_KEY is not set.');
    return { success: false, error: 'The AI service is not configured. Please set the GEMINI_API_KEY in your environment variables.' };
  }

  let tripPayload; // Define here to access in catch block
  try {
    // 1. Generate itinerary using GenAI flow
    console.log('[ACTION] Generating itinerary for:', tripData.destination);
    const generatedEnrichedItinerary = await generateItinerary(tripData);
    console.log('[ACTION] Successfully generated enriched itinerary.');

    // 2. Select a placeholder image (or use image from generated itinerary if available)
    const destinationHash = tripData.destination
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = destinationHash % placeholderImages.length;
    const selectedImage = placeholderImages[imageIndex];
    
    // 3. Save trip to Firestore
    console.log('[ACTION] Attempting to save trip to Firestore...');
    tripPayload = {
      ...tripData,
      itinerary: JSON.stringify(generatedEnrichedItinerary), // Store the raw JSON string for backward compatibility if needed
      enrichedItinerary: generatedEnrichedItinerary, // Store the structured data
      ownerId: userId,
      collaborators: [userId],
      createdAt: FieldValue.serverTimestamp(), // Admin SDK syntax
      imageId: generatedEnrichedItinerary.hotel?.imageUrl || generatedEnrichedItinerary.days[0]?.activities[0]?.imageUrl || selectedImage.id, // Use generated image or fallback
      expenses: [],
    };

    const docRef = await db.collection('trips').add(tripPayload); // Admin SDK syntax
    console.log('[ACTION] Successfully saved trip to Firestore with ID:', docRef.id);

    // 5. Revalidate dashboard path to show new trip
    revalidatePath('/dashboard');

    return { success: true, tripId: docRef.id };
  } catch (error: any) {
    console.error('!!!!!!!! [ACTION] ERROR in createTripAction !!!!!!!!!!');
    if (tripPayload) {
      // Use JSON.stringify to avoid issues with circular references or complex objects in logs
      console.error('Failed to save the following trip payload:', JSON.stringify(tripPayload, null, 2));
    } else {
      console.error('Trip payload was not generated before the error.');
    }
    console.error('Error Code:', error.code || 'N/A');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    const errorMessage = error.code ? `[${error.code}] ${error.message}` : error.message;
    return { success: false, error: errorMessage || 'An unknown error occurred during trip creation.' };
  }
}

interface AddExpenseParams {
    tripId: string;
    expenseData: Omit<Expense, 'id' | 'createdAt'>;
}

export async function addExpenseAction({ tripId, expenseData }: AddExpenseParams): Promise<{ success: boolean; error?: string; }> {
    const { db } = getFirebaseAdmin();
    try {
        const tripRef = db.collection('trips').doc(tripId); // Admin SDK syntax

        const newExpense: Expense = {
            id: randomUUID(),
            ...expenseData,
            createdAt: new Date().toISOString(),
        };

        await tripRef.update({ // Admin SDK syntax
            expenses: FieldValue.arrayUnion(newExpense) // Admin SDK syntax
        });

        revalidatePath(`/trips/${tripId}`);
        return { success: true };

    } catch (error: any) {
        console.error('Error adding expense:', error);
        return { success: false, error: 'Failed to add expense.' };
    }
}

export async function deleteTripAction(tripId: string): Promise<{ success: boolean; error?: string; }> {
  const { db } = getFirebaseAdmin();
  try {
    await db.collection('trips').doc(tripId).delete(); // Call the firestore function

    revalidatePath('/dashboard'); // Revalidate dashboard to remove the deleted trip
    revalidatePath(`/trips/${tripId}`); // Revalidate the specific trip page (will likely lead to notFound)

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    return { success: false, error: 'Failed to delete trip.' };
  }
}


interface ShareTripParams {
    tripId: string;
    trip: Trip;
    invitee: {
        name: string;
        email: string;
        mobile: string;
    };
}

export async function shareTripAction({ tripId, trip, invitee }: ShareTripParams): Promise<{ success: boolean; error?: string; }> {
    const { db, auth } = getFirebaseAdmin();
    try {
        let inviteeId: string;
        let isNewUser = false;

        try {
            const userRecord = await auth.getUserByEmail(invitee.email);
            inviteeId = userRecord.uid;
            console.log(`[ACTION] Found existing user: ${inviteeId}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                isNewUser = true;
                console.log('[ACTION] User not found, creating placeholder user...');

                // Create user in Firebase Auth
                const newUserRecord = await auth.createUser({
                    email: invitee.email,
                    displayName: invitee.name,
                    phoneNumber: invitee.mobile,
                    emailVerified: false, // User will verify when they sign up properly
                    // A secure, random password for the placeholder account
                    password: `placeholder_${randomUUID()}`,
                });
                inviteeId = newUserRecord.uid;
                console.log(`[ACTION] Created new placeholder user: ${inviteeId}`);

                // Create user document in Firestore
                const userDocRef = db.collection('users').doc(inviteeId); // Admin SDK syntax
                await userDocRef.set({ // Admin SDK syntax
                    uid: inviteeId,
                    email: invitee.email,
                    displayName: invitee.name,
                    photoURL: null, // No photo yet
                });
                console.log(`[ACTION] Created Firestore document for new user.`);

            } else {
                throw error; // Rethrow other auth errors
            }
        }

        // Add user to the trip's collaborators
        const tripRef = db.collection('trips').doc(tripId); // Admin SDK syntax
        await tripRef.update({ // Admin SDK syntax
            collaborators: FieldValue.arrayUnion(inviteeId) // Admin SDK syntax
        });
        console.log(`[ACTION] Added ${inviteeId} to trip collaborators.`);

        // Send emails
        if (isNewUser) {
            await sendWelcomeEmail({ name: invitee.name, email: invitee.email });
        }
        await sendTripInviteEmail({
            name: invitee.name,
            email: invitee.email,
            trip: trip
        });
        
        revalidatePath(`/trips/${tripId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error sharing trip:', error);
        return { success: false, error: "Failed to share trip. " + error.message };
    }
}
