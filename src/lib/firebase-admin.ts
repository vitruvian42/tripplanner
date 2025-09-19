
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This simple initialization works for both local development (using ADC)
// and deployed environments (using the runtime service account).
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // You might want to throw an error here in a real application
    // to prevent the app from running in a partially initialized state.
  }
}

const db = getFirestore();
const auth = admin.auth();

export { admin, db, auth };
