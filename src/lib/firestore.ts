import { doc, getDoc, updateDoc, PartialWithFieldValue } from 'firebase/firestore';
import { db } from './firebase';
import type { Trip } from './types';

export async function getTripById(tripId: string): Promise<Trip | null> {
  const docRef = doc(db, 'trips', tripId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    // We cast here, assuming the data matches the Trip structure.
    // The enrichedItinerary might be missing from older documents.
    return { id: docSnap.id, ...docSnap.data() } as Trip;
  } else {
    return null;
  }
}

export async function updateTrip(tripId: string, data: PartialWithFieldValue<Trip>): Promise<void> {
  const docRef = doc(db, 'trips', tripId);
  await updateDoc(docRef, data);
}
