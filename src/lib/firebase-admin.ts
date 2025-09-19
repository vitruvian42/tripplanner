
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  try {
    // When deployed to App Hosting, the Admin SDK is automatically initialized.
    // When running locally, you must set the FIREBASE_ADMIN_SDK_CONFIG env var.
    admin.initializeApp();
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
    // Provide a more helpful error message for local development.
    if (error.code === 'app/invalid-credential') {
        throw new Error('Failed to initialize Firebase Admin SDK. For local development, ensure the FIREBASE_ADMIN_SDK_CONFIG environment variable is set correctly in your .env file.');
    }
    throw new Error('Failed to initialize Firebase Admin SDK. Check your environment variables.');
  }
}

const db = getFirestore();

export { admin, db };
