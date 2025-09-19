
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

/**
 * Gets the initialized Firebase App instance, initializing it if needed.
 * This "get-or-create" pattern prevents race conditions and duplicate initializations.
 * @throws {Error} if Firebase is not configured.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase configuration is missing. Check your NEXT_PUBLIC_FIREBASE_* environment variables.');
  }

  if (getApps().length > 0) {
    return getApp();
  }
  
  try {
    const app = initializeApp(firebaseConfig);
    console.log('Firebase Client SDK initialized successfully.');
    return app;
  } catch (error) {
     console.error('Firebase Client SDK initialization error:', error);
     throw new Error('Firebase initialization failed. See console for details.');
  }
}

/**
 * Gets the initialized Firebase Auth instance.
 * @returns {Auth} The Auth instance.
 * @throws {Error} if Firebase is not configured or failed to initialize.
 */
export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  return getAuth(app);
}

/**
 * Gets the initialized Firestore instance.
 * @returns {Firestore} The Firestore instance.
 * @throws {Error} if Firebase is not configured or failed to initialize.
 */
export function getFirebaseDb(): Firestore {
  const app = getFirebaseApp();
  return getFirestore(app);
}

// Export the configuration status check as well
export { isFirebaseConfigured };
