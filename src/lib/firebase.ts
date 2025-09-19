
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Initialize Firebase
let app;
if (!getApps().length) {
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  ) {
    app = initializeApp(firebaseConfig);
  } else {
    // This will now only log a warning if the config is truly missing,
    // preventing the app from crashing during build or server-side rendering
    // if env vars aren't loaded yet.
    console.warn(
      'Firebase client config is missing. Please set up your .env.local file.'
    );
  }
} else {
  app = getApp();
}

// Conditionally get auth and db to prevent errors when app is not initialized
const auth = app ? getAuth(app) : undefined;
const db = app ? getFirestore(app) : undefined;


export { app, auth, db };
