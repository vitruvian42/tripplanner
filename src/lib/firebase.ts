
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
    return !!firebaseConfig.projectId;
}

// Singleton instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function initializeFirebase() {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase client configuration is missing. Client-side Firebase services will be unavailable.');
        return;
    }
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
}

// Initialize on first load
initializeFirebase();

// Getter functions to be used throughout the app
export function getFirebaseApp(): FirebaseApp {
  if (!app) throw new Error('Firebase has not been initialized. Check your environment variables.');
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error('Firebase Auth has not been initialized. Check your environment variables.');
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) throw new Error('Firestore has not been initialized. Check your environment variables.');
  return db;
}

export { isFirebaseConfigured };
