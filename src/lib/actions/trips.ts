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
  console.log('Starting createTripAction for user:', userId);
  try {
    // 1. Generate itinerary using GenAI flow
    console.log('Generating itinerary for:', tripData.destination);
    const itineraryOutput = await generateItinerary(tripData);
    console.log('Successfully generated itinerary.');
    // console.log('Itinerary content:', itineraryOutput.itinerary); // Uncomment for verbose logging

    // 2. Select a placeholder image based on a hash of the destination
    // This provides a consistent image for the same destination
    const destinationHash = tripData.destination
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = destinationHash % placeholderImages.length;
    const selectedImage = placeholderImages[imageIndex];
    
    // 3. Save trip to Firestore
    console.log('Attempting to save trip to Firestore...');
    const tripPayload = {
      ...tripData,
      itinerary: itineraryOutput.itinerary,
      ownerId: userId,
      collaborators: [userId],
      createdAt: serverTimestamp(),
      imageId: selectedImage.id, // Save the ID of the image
    };

    const docRef = await addDoc(collection(db, 'trips'), tripPayload);
    console.log('Successfully saved trip to Firestore with ID:', docRef.id);

    // 4. Revalidate dashboard path to show new trip
    revalidatePath('/dashboard');

    return { success: true, tripId: docRef.id };
  } catch (error: any) {
    console.error('!!!!!!!! ERROR in createTripAction !!!!!!!!!!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    // Check for specific Firebase auth errors which are common
    if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        console.error('Firestore permission error. This is likely due to incorrect API keys or Firestore security rules.');
        return { success: false, error: 'Authentication error with the database. Please check your configuration.' };
    }

    return { success: false, error: error.message || 'An unknown error occurred during trip creation.' };
  }
}
