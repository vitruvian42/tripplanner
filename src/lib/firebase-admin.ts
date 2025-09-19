
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  try {
    const adminSdkConfig = process.env.FIREBASE_ADMIN_SDK_CONFIG
      ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG)
      : undefined;

    // When deployed to App Hosting, the Admin SDK is automatically initialized.
    // When running locally, you must set the FIREBASE_ADMIN_SDK_CONFIG env var.
    admin.initializeApp({
        credential: adminSdkConfig ? admin.credential.cert(adminSdkConfig) : undefined,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error);
    if (error.code === 'app/invalid-credential' || error.message.includes('Could not find credential')) {
      throw new Error(
        'Failed to initialize Firebase Admin SDK. For local development, ensure the FIREBASE_ADMIN_SDK_CONFIG environment variable is set correctly in a .env.local file.'
      );
    }
    throw new Error(
      'Failed to initialize Firebase Admin SDK. Check your environment variables and logs.'
    );
  }
}

const db = getFirestore();

export { admin, db };
