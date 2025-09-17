import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC02x6Z_3Z9Q-iZ3s6p5g1vX6aC9H2b4jA",
  authDomain: "absolute-realm-470109-c9.firebaseapp.com",
  projectId: "absolute-realm-470109-c9",
  storageBucket: "absolute-realm-470109-c9.appspot.com",
  messagingSenderId: "833486528271",
  appId: "1:833486528271:web:2d4d1168ad22ffead6687a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
