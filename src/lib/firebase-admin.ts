import admin from 'firebase-admin';

let initializedApp: admin.app.App | undefined;

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    initializedApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
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