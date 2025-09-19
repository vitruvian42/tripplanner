
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

// This function checks if the client-side Firebase config is complete.
function isFirebaseConfigured(): boolean {
  return (
    !!firebaseConfig.apiKey &&
    !!firebaseConfig.authDomain &&
    !!firebaseConfig.projectId &&
    !!firebaseConfig.appId
  );
}

// Memoize instances at the module level but initialize them lazily.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function initializeFirebase() {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase configuration is missing. Services will not be available.');
    return;
  }
  if (getApps().length === 0) {
    console.log('Firebase Client SDK initializing...');
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
}


/**
 * Gets the initialized Firebase Auth instance.
 * @returns {Auth} The Auth instance.
 * @throws {Error} if Firebase is not configured or failed to initialize.
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  if (!auth) {
    throw new Error('Firebase Auth is not available. Check your configuration.');
  }
  return auth;
}

/**
 * Gets the initialized Firestore instance.
 * @returns {Firestore} The Firestore instance.
 * @throws {Error} if Firebase is not configured or failed to initialize.
 */
export function getFirebaseDb(): Firestore {
  if (!db) {
    initializeFirebase();
  }
  if (!db) {
    throw new Error('Firestore is not available. Check your configuration.');
  }
  return db;
}

// Export the configuration status check as well
export { isFirebaseConfigured };
