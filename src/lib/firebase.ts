
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

console.log(firebaseConfig)

// This function checks if the client-side Firebase config is complete.
function isFirebaseConfigured(): boolean {
  return (
    !!firebaseConfig.apiKey &&
    !!firebaseConfig.authDomain &&
    !!firebaseConfig.projectId &&
    !!firebaseConfig.appId
  );
}

// Singleton instances for client-side services
let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Initializes the Firebase app on the client side if it hasn't been already.
 * This function is designed to be called safely multiple times.
 */
function initializeClientApp() {
  if (!isFirebaseConfigured()) {
    console.warn(
      'Firebase client configuration is missing or incomplete. Client-side Firebase services will be unavailable. Check your NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
    return;
  }

  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('Firebase Client SDK initialized successfully.');
    } catch (error) {
       console.error('Firebase Client SDK initialization error:', error);
    }
  } else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

// Initialize on first module load
initializeClientApp();

/**
 * Gets the initialized Firebase App instance.
 * @throws {Error} if Firebase is not configured or failed to initialize.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase has not been initialized. Check your environment variables and console for errors.');
  }
  return app;
}

/**
 * Gets the initialized Firebase Auth instance.
 * @returns {Auth} The Auth instance.
 * @throws {Error} if Firebase is not configured or failed to initialize.
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth has not been initialized. Check your environment variables and console for errors.');
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
    throw new Error('Firestore has not been initialized. Check your environment variables and console for errors.');
  }
  return db;
}

// Export the configuration status check as well
export { isFirebaseConfigured };
