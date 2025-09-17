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
  try {
    // 1. Generate itinerary using GenAI flow
    const itineraryOutput = await generateItinerary(tripData);

    // 2. Select a placeholder image based on a hash of the destination
    // This provides a consistent image for the same destination
    const destinationHash = tripData.destination
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = destinationHash % placeholderImages.length;
    const selectedImage = placeholderImages[imageIndex];
    
    // 3. Save trip to Firestore
    const tripPayload = {
      ...tripData,
      itinerary: itineraryOutput.itinerary,
      ownerId: userId,
      collaborators: [userId],
      createdAt: serverTimestamp(),
      imageId: selectedImage.id, // Save the ID of the image
    };

    const docRef = await addDoc(collection(db, 'trips'), tripPayload);

    // 4. Revalidate dashboard path to show new trip
    revalidatePath('/dashboard');

    return { success: true, tripId: docRef.id };
  } catch (error: any) {
    console.error('Error creating trip:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
