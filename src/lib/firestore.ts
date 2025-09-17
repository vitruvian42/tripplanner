import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Trip } from './types';

export async function getTripById(tripId: string): Promise<Trip | null> {
  const docRef = doc(db, 'trips', tripId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Trip;
  } else {
    return null;
  }
}
