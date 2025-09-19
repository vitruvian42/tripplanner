
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// Helper function to save user data to Firestore
const saveUserToFirestore = async (user: User) => {
  try {
    const db = getFirebaseDb();
    const userRef = doc(db, "users", user.uid);
    // Using setDoc with merge: true will create the document if it doesn't exist,
    // and update it if it does, without overwriting other fields.
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0], // Provide a fallback display name
      photoURL: user.photoURL,
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user to Firestore:", error);
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch(e) {
      console.error("Firebase not configured. Auth will not be initialized.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // This will now run for new sign-ups and subsequent logins,
        // ensuring the user document always exists.
        saveUserToFirestore(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
