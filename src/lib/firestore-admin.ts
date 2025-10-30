import { getFirebaseAdmin } from './firebase-admin';
import type { Trip, FirestoreTrip, Collaborator } from './types';
import { Timestamp } from 'firebase-admin/firestore';

export async function getTripById(tripId: string): Promise<Trip | null> {
  const { db } = getFirebaseAdmin(); // Get db instance here
  const docRef = db.collection('trips').doc(tripId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
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

export async function updateTrip(tripId: string, data: { [key: string]: any }): Promise<void> {
  const { db } = getFirebaseAdmin(); // Get db instance here
  const docRef = db.collection('trips').doc(tripId);
  await docRef.update(data);
}

export async function getCollaboratorDetails(uids: string[]): Promise<Collaborator[]> {
  if (!uids || uids.length === 0) return [];
  
  const { db } = getFirebaseAdmin(); // Get db instance here
  const usersRef = db.collection('users');
  const q = await usersRef.where('uid', 'in', uids).get();
  
  const collaborators: Collaborator[] = [];
  
  q.forEach((doc) => {
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


export async function getTripCollaborators(tripId: string): Promise<Collaborator[]> {
  const { db } = getFirebaseAdmin(); // Get db instance here
  const docRef = db.collection('trips').doc(tripId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data() as FirestoreTrip;
    const collaboratorUids = data.collaborators || [];
    
    // Add the owner's UID to the list to fetch their details as well
    if (data.owner) {
      collaboratorUids.push(data.owner);
    }
    
    return await getCollaboratorDetails(collaboratorUids);
  } else {
    return [];
  }
}