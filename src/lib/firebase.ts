
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function initializeFirebase() {
  if (!getApps().length) {
    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.authDomain ||
      !firebaseConfig.projectId
    ) {
      throw new Error('Firebase configuration is missing in environment variables.');
    }
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

// Initialize on load
if (typeof window !== 'undefined') {
    initializeFirebase();
}


export function getFirebaseApp(): FirebaseApp {
  if (!app) initializeFirebase();
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) initializeFirebase();
  return db;
}

export function isFirebaseConfigured(): boolean {
  // This check is now more for server-side or build-time verification if needed
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
}
