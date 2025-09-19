
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * This file provides a singleton pattern for the Firebase Admin SDK.
 * It ensures that the SDK is initialized only once across the server-side
 * part of the application.
 *
 * How it works:
 * - When this module is imported for the first time, it checks if an app
 *   is already initialized in `admin.apps`.
 * - If not, it calls `admin.initializeApp()`. This works for both local
 *   development (using Application Default Credentials from gcloud) and
*   deployed environments (which have a runtime service account).
 * - It then exports the initialized `db` and `auth` services.
 */

if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error);
    // In a production environment, you might want to handle this more gracefully.
    // For now, we'll log the error to make it visible during development.
  }
}

const db = getFirestore();
const auth = getAuth();

export { admin, db, auth };
