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
  try {
    if (!firebaseConfig.apiKey) {
        throw new Error('Missing Firebase API Key. Please set NEXT_PUBLIC_FIREBASE_API_KEY in your .env file');
    }
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Firebase initialization error", e);
    throw new Error("Failed to initialize Firebase. Check your environment variables.");
  }
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);


export { app, auth, db };
