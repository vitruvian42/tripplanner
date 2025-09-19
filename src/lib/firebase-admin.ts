
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This simplified initialization works for both local development and deployed environments.
// - In a deployed Google Cloud environment (like App Hosting), it uses the built-in service account.
// - For local development, it uses Application Default Credentials (ADC).
//   You must authenticate locally by running `gcloud auth application-default login` in your terminal.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error("Firebase admin initialization error. For local development, ensure you've authenticated via `gcloud auth application-default login`.", error);
  }
}

const db = getFirestore();
const auth = admin.auth();

export { admin, db, auth };
