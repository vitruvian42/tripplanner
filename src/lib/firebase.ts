
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

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function initializeFirebase() {
  if (
    !app &&
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  ) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
}

// Export functions to get the instances, which will initialize on first call
export function getFirebaseApp() {
  if (!app) {
    initializeFirebase();
  }
  return app;
}

export function getFirebaseAuth() {
  const firebaseApp = getFirebaseApp();
  if (firebaseApp && !auth) {
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseDb() {
  const firebaseApp = getFirebaseApp();
  if (firebaseApp && !db) {
    db = getFirestore(firebaseApp);
  }
  return db;
}
