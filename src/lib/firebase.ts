
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

function isFirebaseConfigured(): boolean {
    return !!(
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId
    );
}

// Singleton instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function initializeFirebase() {
    if (!isFirebaseConfigured()) {
        throw new Error('Firebase configuration is missing in environment variables.');
    }
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
}

// Initialize on load
try {
    initializeFirebase();
} catch (error) {
    console.error("Firebase initialization failed:", (error as Error).message);
    // Don't throw here, let components handle the uninitialized state.
}


export function getFirebaseApp(): FirebaseApp {
  if (!app) {
      // This will throw if config is missing.
      initializeFirebase();
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
      // This will throw if config is missing.
      initializeFirebase();
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
      // This will throw if config is missing.
      initializeFirebase();
  }
  return db;
}

export { isFirebaseConfigured };
