
import { doc, getDoc, updateDoc, PartialWithFieldValue, collection, query, where, getDocs, setDoc, deleteDoc, type Timestamp } from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from './firebase';
import type { Trip, FirestoreTrip, Collaborator } from './types';

export async function getTripById(tripId: string): Promise<Trip | null> {
  const db = getFirebaseDb();

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
  const db = getFirebaseDb();

  const docRef = doc(db, 'trips', tripId);
  await updateDoc(docRef, data);
}

export async function deleteTrip(tripId: string): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'trips', tripId);
  await deleteDoc(docRef);
}

export async function getCollaboratorDetails(uids: string[]): Promise<Collaborator[]> {
  const db = getFirebaseDb();
  if (!uids || uids.length === 0) return [];
  
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('uid', 'in', uids));
  
  const querySnapshot = await getDocs(q);
  const collaborators: Collaborator[] = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    collaborators.push({
      uid: data.uid,
      name: data.displayName || data.email || 'Anonymous',
      email: data.email,
      photoURL: data.photoURL || null
    });
  });

  return collaborators;
}


export async function saveUserToFirestore(user: import('firebase/auth').User) {
    const db = getFirebaseDb();

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
