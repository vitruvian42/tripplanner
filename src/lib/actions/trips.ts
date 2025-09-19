
'use server';

import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';
import { enrichItinerary } from '@/ai/flows/ai-enrich-itinerary';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayUnion, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, admin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { placeholderImages } from '@/lib/placeholder-images';
import { randomUUID } from 'crypto';
import type { Expense, Trip } from '@/lib/types';
import { sendTripInviteEmail, sendWelcomeEmail } from '@/lib/email';

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
  console.log('[ACTION] Starting createTripAction for user:', userId);
  try {
    // 1. Generate itinerary using GenAI flow
    console.log('[ACTION] Generating itinerary for:', tripData.destination);
    const itineraryOutput = await generateItinerary(tripData);
    console.log('[ACTION] Successfully generated itinerary.');

    // 2. Enrich the generated itinerary
    console.log('[ACTION] Enriching itinerary for:', tripData.destination);
    const enrichedOutput = await enrichItinerary({ itinerary: itineraryOutput.itinerary });
    console.log('[ACTION] Successfully enriched itinerary.');

    // 3. Select a placeholder image
    const destinationHash = tripData.destination
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = destinationHash % placeholderImages.length;
    const selectedImage = placeholderImages[imageIndex];
    
    // 4. Save trip to Firestore
    console.log('[ACTION] Attempting to save trip to Firestore...');
    const tripPayload = {
      ...tripData,
      itinerary: itineraryOutput.itinerary,
      enrichedItinerary: enrichedOutput.enrichedItinerary, // Store the structured data
      ownerId: userId,
      collaborators: [userId],
      createdAt: serverTimestamp(),
      imageId: selectedImage.id,
      expenses: [],
    };

    const docRef = await addDoc(collection(db, 'trips'), tripPayload);
    console.log('[ACTION] Successfully saved trip to Firestore with ID:', docRef.id);

    // 5. Revalidate dashboard path to show new trip
    revalidatePath('/dashboard');

    return { success: true, tripId: docRef.id };
  } catch (error: any) {
    console.error('!!!!!!!! [ACTION] ERROR in createTripAction !!!!!!!!!!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    return { success: false, error: error.message || 'An unknown error occurred during trip creation.' };
  }
}

interface AddExpenseParams {
    tripId: string;
    expenseData: Omit<Expense, 'id' | 'createdAt'>;
}

export async function addExpenseAction({ tripId, expenseData }: AddExpenseParams): Promise<{ success: boolean; error?: string; }> {
    try {
        const tripRef = doc(db, 'trips', tripId);

        const newExpense: Expense = {
            id: randomUUID(),
            ...expenseData,
            createdAt: new Date().toISOString(),
        };

        await updateDoc(tripRef, {
            expenses: arrayUnion(newExpense)
        });

        revalidatePath(`/trips/${tripId}`);
        return { success: true };

    } catch (error: any) {
        console.error('Error adding expense:', error);
        return { success: false, error: 'Failed to add expense.' };
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
    try {
        const auth = admin.auth();
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
                const userDocRef = doc(db, 'users', inviteeId);
                await setDoc(userDocRef, {
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
        const tripRef = doc(db, "trips", tripId);
        await updateDoc(tripRef, {
            collaborators: arrayUnion(inviteeId)
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
