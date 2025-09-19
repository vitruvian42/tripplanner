
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

// Singleton function to get the Firebase app instance
const getFirebaseApp = (): FirebaseApp => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase configuration is missing. Check your NEXT_PUBLIC_FIREBASE_* environment variables.');
  }
  
  if (getApps().length === 0) {
    console.log('Firebase Client SDK initializing...');
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
};


// Memoize the app, auth, and db instances at the module level
const app: FirebaseApp | null = isFirebaseConfigured() ? getFirebaseApp() : null;
const auth: Auth | null = app ? getAuth(app) : null;
const db: Firestore | null = app ? getFirestore(app) : null;


/**
 * Gets the initialized Firebase Auth instance.
 * @returns {Auth} The Auth instance.
 * @throws {Error} if Firebase is not configured or failed to initialize.
 */
export function getFirebaseAuth(): Auth {
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
    throw new Error('Firestore is not available. Check your configuration.');
  }
  return db;
}

// Export the configuration status check as well
export { isFirebaseConfigured };
