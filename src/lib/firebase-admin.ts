
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// When running in a Google Cloud environment (like App Hosting or Cloud Functions),
// the Admin SDK is automatically initialized. When running locally, you must
// set the FIREBASE_ADMIN_SDK_CONFIG environment variable.
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_CONFIG) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Use Application Default Credentials for deployed environments
        admin.initializeApp();
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error', error);
    throw new Error(
      'Failed to initialize Firebase Admin SDK. For local development, make sure FIREBASE_ADMIN_SDK_CONFIG is set in your .env.local file.'
    );
  }
}

const db = getFirestore();
const auth = admin.auth();

export { admin, db, auth };
