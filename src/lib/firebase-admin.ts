
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// When running in a Google Cloud environment (like App Hosting or Cloud Functions),
// the Admin SDK is automatically initialized. When running locally, if you have
// run `gcloud auth application-default login`, it will use those credentials.
if (!admin.apps.length) {
  try {
    // This single call handles both production and local ADC environments.
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error);
    // Throw a more generic error if it still fails, but the previous setup was too specific.
    throw new Error(
      'Failed to initialize Firebase Admin SDK. Ensure your environment is configured correctly.'
    );
  }
}

const db = getFirestore();
const auth = admin.auth();

export { admin, db, auth };
