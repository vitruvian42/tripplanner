
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_CONFIG) {
      // For local development, use the service account from the environment variable.
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG);
      admin.initializeApp({
        credential: credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized with service account.');
    } else {
      // For deployed environments (like App Hosting), use Application Default Credentials.
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized with default credentials.');
    }
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

const db = getFirestore();
const auth = admin.auth();

export { admin, db, auth };
