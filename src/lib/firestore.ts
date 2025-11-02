import { doc, getDoc, updateDoc, PartialWithFieldValue, collection, query, where, getDocs, setDoc, deleteDoc, orderBy, limit, type Timestamp } from 'firebase/firestore';
import { getFirestoreDb, getFirebaseAuth } from './firebase';
import type { Trip, FirestoreTrip, Collaborator, Booking, FirestoreBooking, Notification, FirestoreNotification } from './types';

export async function getTripById(tripId: string, retries: number = 3): Promise<Trip | null> {
  const db = getFirestoreDb();
  const docRef = doc(db, 'trips', tripId);
  
  console.log(`[FIRESTORE] getTripById called for tripId: ${tripId}`);
  
  // Get current user from Firebase Auth to log who's making the request
  try {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log(`[FIRESTORE] Current user making request - UID: ${currentUser.uid}, Email: ${currentUser.email}`);
    } else {
      console.log(`[FIRESTORE] ⚠️ No authenticated user found when fetching trip`);
    }
  } catch (error) {
    console.log(`[FIRESTORE] Could not get auth context:`, error);
  }
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[FIRESTORE] Attempt ${attempt + 1} to fetch trip ${tripId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreTrip;
        console.log(`[FIRESTORE] ✅ Trip document exists:`, {
          tripId: docSnap.id,
          ownerId: data.ownerId,
          ownerIdType: typeof data.ownerId,
          collaborators: data.collaborators,
          collaboratorsType: Array.isArray(data.collaborators) ? 'array' : typeof data.collaborators,
        });
        
        // Convert Firestore Timestamp to a serializable string (ISO 8601)
        const trip: Trip = {
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        };
        return trip;
      } else {
        console.log(`[FIRESTORE] ⚠️ Trip document does not exist: ${tripId}`);
        // If document doesn't exist and we have retries left, wait a bit and retry
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        return null;
      }
    } catch (error: any) {
      console.error(`[FIRESTORE] ❌ Error fetching trip ${tripId} (attempt ${attempt + 1}):`, {
        code: error?.code,
        message: error?.message,
        error: error,
      });
      
      // Handle permission errors - retry if it might be a timing issue
      if (error?.code === 'permission-denied' && attempt < retries - 1) {
        console.log(`[FIRESTORE] Permission denied on attempt ${attempt + 1}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      // Re-throw if it's not a permission error or we're out of retries
      throw error;
    }
  }
  
  return null;
}

export async function updateTrip(tripId: string, data: PartialWithFieldValue<Trip>): Promise<void> {
  console.log(`[FIRESTORE] updateTrip called for tripId: ${tripId}`);
  try {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log(`[FIRESTORE] Current user updating trip - UID: ${currentUser.uid}, Email: ${currentUser.email}`);
    } else {
      console.log(`[FIRESTORE] ⚠️ No authenticated user found when updating trip`);
    }
  } catch (error) {
    console.log(`[FIRESTORE] Could not get auth context:`, error);
  }
  
  const db = getFirestoreDb();
  const docRef = doc(db, 'trips', tripId);
  console.log(`[FIRESTORE] Attempting to update trip ${tripId} with data:`, Object.keys(data));
  await updateDoc(docRef, data);
  console.log(`[FIRESTORE] ✅ Successfully updated trip ${tripId}`);
}

export async function getCollaboratorDetails(uids: string[]): Promise<Collaborator[]> {
  console.log(`[FIRESTORE] getCollaboratorDetails called with UIDs:`, uids);
  if (!uids || uids.length === 0) {
    console.log(`[FIRESTORE] No UIDs provided, returning empty array`);
    return [];
  }
  
  try {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log(`[FIRESTORE] Current user querying collaborators - UID: ${currentUser.uid}, Email: ${currentUser.email}`);
    } else {
      console.log(`[FIRESTORE] ⚠️ No authenticated user found when querying collaborators`);
    }
  } catch (error) {
    console.log(`[FIRESTORE] Could not get auth context:`, error);
  }
  
  const db = getFirestoreDb();
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('uid', 'in', uids));
  console.log(`[FIRESTORE] Querying users collection with where('uid', 'in', [${uids.join(', ')}])`);
  
  try {
    const querySnapshot = await getDocs(q);
    console.log(`[FIRESTORE] ✅ Query returned ${querySnapshot.size} user documents`);
    
    const collaborators: Collaborator[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`[FIRESTORE] Processing user document ${doc.id}:`, {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
      });
      collaborators.push({
        uid: data.uid,
        name: data.displayName || data.email || 'Anonymous',
        email: data.email,
        photoURL: data.photoURL || null
      });
    });

    console.log(`[FIRESTORE] ✅ Returning ${collaborators.length} collaborators`);
    return collaborators;
  } catch (error: any) {
    console.error(`[FIRESTORE] ❌ Error querying collaborators:`, error);
    console.error(`[FIRESTORE] Error code:`, error?.code);
    console.error(`[FIRESTORE] Error message:`, error?.message);
    throw error;
  }
}

export async function saveUserToFirestore(user: import('firebase/auth').User) {
    const db = getFirestoreDb();
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

export async function getBookingByTripAndUser(tripId: string, userId: string): Promise<Booking | null> {
  console.log(`[FIRESTORE] getBookingByTripAndUser called for tripId: ${tripId}, userId: ${userId}`);
  
  try {
    const db = getFirestoreDb();
    const bookingsRef = collection(db, 'bookings');
    
    // Query for booking with matching tripId and userId
    const q = query(
      bookingsRef,
      where('tripId', '==', tripId),
      where('userId', '==', userId)
    );
    
    console.log(`[FIRESTORE] Querying bookings collection for tripId: ${tripId}, userId: ${userId}`);
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`[FIRESTORE] No booking found for tripId: ${tripId}, userId: ${userId}`);
      return null;
    }
    
    // Get the first booking (should only be one per user per trip)
    const bookingDoc = querySnapshot.docs[0];
    const data = bookingDoc.data() as FirestoreBooking;
    
    // Convert Firestore timestamp to ISO string
    const bookingDate = (data.bookingDate as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString();
    
    const booking: Booking = {
      id: bookingDoc.id,
      ...data,
      bookingDate
    };
    
    console.log(`[FIRESTORE] ✅ Found booking with ID: ${booking.id}`);
    return booking;
  } catch (error: any) {
    console.error(`[FIRESTORE] ❌ Error querying booking:`, error);
    console.error(`[FIRESTORE] Error code:`, error?.code);
    console.error(`[FIRESTORE] Error message:`, error?.message);
    return null;
  }
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  console.log(`[FIRESTORE] getUnreadNotifications called for userId: ${userId}`);
  
  try {
    const db = getFirestoreDb();
    const notificationsRef = collection(db, 'notifications');
    
    // Query for unread notifications for this user, ordered by creation date (newest first)
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50) // Limit to 50 most recent unread notifications
    );
    
    console.log(`[FIRESTORE] Querying notifications collection for userId: ${userId}`);
    const querySnapshot = await getDocs(q);
    
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreNotification;
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    
    console.log(`[FIRESTORE] ✅ Found ${notifications.length} unread notifications`);
    return notifications;
  } catch (error: any) {
    console.error(`[FIRESTORE] ❌ Error querying notifications:`, error);
    console.error(`[FIRESTORE] Error code:`, error?.code);
    console.error(`[FIRESTORE] Error message:`, error?.message);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  console.log(`[FIRESTORE] markNotificationAsRead called for notificationId: ${notificationId}`);
  
  try {
    const db = getFirestoreDb();
    const notificationRef = doc(db, 'notifications', notificationId);
    
    await updateDoc(notificationRef, {
      read: true,
    });
    
    console.log(`[FIRESTORE] ✅ Marked notification ${notificationId} as read`);
  } catch (error: any) {
    console.error(`[FIRESTORE] ❌ Error marking notification as read:`, error);
    console.error(`[FIRESTORE] Error code:`, error?.code);
    console.error(`[FIRESTORE] Error message:`, error?.message);
    throw error;
  }
}