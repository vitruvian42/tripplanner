
import { doc, getDoc, updateDoc, PartialWithFieldValue, collection, query, where, getDocs, setDoc, deleteDoc, type Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Trip, FirestoreTrip, Collaborator } from './types';

export async function getTripById(tripId: string): Promise<Trip | null> {
  const docRef = doc(db, 'trips', tripId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as FirestoreTrip;
    
    // Convert Firestore Timestamp to a serializable string (ISO 8601)
    const trip: Trip = {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    };
    return trip;
  } else {
    return null;
  }
}

export async function updateTrip(tripId: string, data: PartialWithFieldValue<Trip>): Promise<void> {
  const docRef = doc(db, 'trips', tripId);
  await updateDoc(docRef, data);
}



export async function saveUserToFirestore(user: import('firebase/auth').User) {
    const userRef = doc(db, 'users', user.uid);
    // Use setDoc with merge to create or update the user document.
    // This is more robust than checking for existence first.
    await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
    }, { merge: true });
}
