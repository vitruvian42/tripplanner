
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// This function robustly initializes the Firebase Admin SDK.
// 1. For local development, it expects a `FIREBASE_ADMIN_SDK_CONFIG` environment variable
//    containing the JSON credentials for a service account.
// 2. When deployed to a Google Cloud environment (like App Hosting), it uses
//    Application Default Credentials, so `initializeApp()` is called without arguments.
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_ADMIN_SDK_CONFIG) {
      // Local development path: Use service account from environment variable
      console.log('Initializing Firebase Admin SDK with service account from env var...');
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG);
      admin.initializeApp({
        credential: credential.cert(serviceAccount),
      });
    } else {
      // Production/Deployed path: Use Application Default Credentials
      console.log('Initializing Firebase Admin SDK with default credentials...');
      admin.initializeApp();
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error', error);
    // Provide a clear error message depending on the context.
    const errorMessage = process.env.FIREBASE_ADMIN_SDK_CONFIG
      ? 'Failed to initialize Firebase Admin SDK. Check if the FIREBASE_ADMIN_SDK_CONFIG in your .env.local file is a valid JSON service account.'
      : 'Failed to initialize Firebase Admin SDK with default credentials. Ensure your deployment environment has the correct permissions.';
    throw new Error(errorMessage);
  }
}

const db = getFirestore();
const auth = admin.auth();

export { admin, db, auth };
