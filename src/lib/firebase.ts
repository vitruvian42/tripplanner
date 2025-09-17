import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "wanderplan-gcp-us.firebaseapp.com",
  projectId: "wanderplan-gcp-us",
  storageBucket: "wanderplan-gcp-us.appspot.com",
  messagingSenderId: "33887595363",
  appId: "1:33887595363:web:5d36b81d74e35bb259c60e",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
