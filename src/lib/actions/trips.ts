'use server';

import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { placeholderImages } from '@/lib/placeholder-images';

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
    // For privacy and to keep logs clean, we can log a snippet.
    console.log('[ACTION] Itinerary snippet:', itineraryOutput.itinerary.substring(0, 100) + '...');

    // 2. Select a placeholder image based on a hash of the destination
    const destinationHash = tripData.destination
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = destinationHash % placeholderImages.length;
    const selectedImage = placeholderImages[imageIndex];
    
    // 3. Save trip to Firestore
    console.log('[ACTION] Attempting to save trip to Firestore...');
    const tripPayload = {
      ...tripData,
      itinerary: itineraryOutput.itinerary,
      ownerId: userId,
      collaborators: [userId],
      createdAt: serverTimestamp(),
      imageId: selectedImage.id,
    };

    const docRef = await addDoc(collection(db, 'trips'), tripPayload);
    console.log('[ACTION] Successfully saved trip to Firestore with ID:', docRef.id);

    // 4. Revalidate dashboard path to show new trip
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
