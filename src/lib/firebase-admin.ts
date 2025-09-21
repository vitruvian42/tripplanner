import admin from 'firebase-admin'; // Changed from import * as admin

let initializedApp: admin.app.App | undefined;

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    if (process.env.GCLOUD_PROJECT) {
      initializedApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      initializedApp = admin.initializeApp();
    }
  } else {
    initializedApp = admin.app(); // Get the default app if already initialized
  }
  return initializedApp;
}

export function getFirebaseAdmin() {
  const app = initializedApp || initializeFirebaseAdmin();
  return {
    db: app.firestore(),
    auth: app.auth(),
    storage: app.storage(),
  };
}