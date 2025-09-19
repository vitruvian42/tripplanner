
'use server';

import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';
import { enrichItinerary } from '@/ai/flows/ai-enrich-itinerary';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayUnion, where, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { placeholderImages } from '@/lib/placeholder-images';
import { randomUUID } from 'crypto';
import type { Expense, Collaborator } from '@/lib/types';
import { auth } from 'firebase-admin';

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
    inviteeEmail: string;
}

export async function shareTripAction({ tripId, inviteeEmail }: ShareTripParams): Promise<{ success: boolean; error?: string; }> {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", inviteeEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: "User with that email does not exist." };
        }

        const inviteeDoc = querySnapshot.docs[0];
        const inviteeId = inviteeDoc.id;

        const tripRef = doc(db, "trips", tripId);
        await updateDoc(tripRef, {
            collaborators: arrayUnion(inviteeId)
        });
        
        revalidatePath(`/trips/${tripId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error sharing trip:', error);
        return { success: false, error: "Failed to share trip." };
    }
}
