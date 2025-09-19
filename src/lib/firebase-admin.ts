
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// When running in a Google Cloud environment (like App Hosting or Cloud Functions),
// the Admin SDK is automatically initialized. When running locally, you must
// authenticate via the Google Cloud CLI by running `gcloud auth application-default login`.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase admin initialization error', error);
    throw new Error(
      'Failed to initialize Firebase Admin SDK. For local development, make sure you have authenticated with `gcloud auth application-default login`.'
    );
  }
}

const db = getFirestore();
const auth = admin.auth();

export { admin, db, auth };
