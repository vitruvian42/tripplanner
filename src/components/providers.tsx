'use client';

import { AuthProvider } from '@/context/auth-context';
import { useEffect, useState, type ReactNode } from 'react';
import { initializeFirebaseClient } from '@/lib/firebase';

export function AppProviders({ children }: { children: ReactNode }) {
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);

  useEffect(() => {
    initializeFirebaseClient();
    setIsFirebaseInitialized(true);
  }, []);

  if (!isFirebaseInitialized) {
    return null; // Or a loading spinner
  }

  return <AuthProvider>{children}</AuthProvider>;
}
