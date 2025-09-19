
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG
  ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG)
  : undefined;

if (!admin.apps.length) {
    if (!serviceAccount) {
        throw new Error('Missing Firebase Admin SDK config. Please set FIREBASE_ADMIN_SDK_CONFIG in your .env.local file');
    }
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.log('Firebase admin initialization error', error.stack);
    throw new Error('Failed to initialize Firebase Admin SDK. Check your environment variables.');
  }
}

const db = getFirestore();

export { admin, db };
