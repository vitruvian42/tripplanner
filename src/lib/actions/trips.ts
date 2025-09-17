'use server';

import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

// Define the type for a single placeholder image
type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

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

    // 2. Select a random placeholder image by reading the JSON file directly
    const jsonPath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');
    const jsonFile = fs.readFileSync(jsonPath, 'utf-8');
    const placeholderData = JSON.parse(jsonFile);
    const placeholderImages: ImagePlaceholder[] = placeholderData.placeholderImages;
    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    
    // 3. Save trip to Firestore
    const tripPayload = {
      ...tripData,
      itinerary: itineraryOutput.itinerary,
      ownerId: userId,
      collaborators: [userId],
      createdAt: serverTimestamp(),
      imageUrl: randomImage.imageUrl,
      imageHint: randomImage.imageHint,
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
