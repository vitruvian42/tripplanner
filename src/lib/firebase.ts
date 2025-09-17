import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAB785A_XtYTXJPonHrCHLYl8WD7fblglI",
  authDomain: "absolute-realm-470109-c9.firebaseapp.com",
  projectId: "absolute-realm-470109-c9",
  storageBucket: "absolute-realm-470109-c9.appspot.com",
  messagingSenderId: "833486528271",
  appId: "1:833486528271:web:2d4d1168ad22ffead6687a",
  measurementId: "G-PTK02S4CV6"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Firebase initialization error", e);
    throw new Error("Failed to initialize Firebase. Check your API keys.");
  }
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);


export { app, auth, db };
