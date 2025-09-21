import admin from 'firebase-admin'; // Changed from import * as admin

if (!admin.apps.length) {
  if (process.env.GCLOUD_PROJECT) {
    // Running in a Google Cloud environment (e.g., Cloud Functions, Cloud Run)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    // Running locally or in another environment, might need a service account key
    // For local development, you might need to set GOOGLE_APPLICATION_CREDENTIALS
    // or provide a service account key directly.
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();