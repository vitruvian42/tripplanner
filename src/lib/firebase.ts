import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'fir-ui-demo-5334b.firebaseapp.com',
  databaseURL: 'https://fir-ui-demo-5334b.firebaseio.com',
  projectId: 'fir-ui-demo-5334b',
  storageBucket: 'fir-ui-demo-5334b.appspot.com',
  messagingSenderId: '563194165564',
  appId: '1:563194165564:web:e45cc24fa24b1f69',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
