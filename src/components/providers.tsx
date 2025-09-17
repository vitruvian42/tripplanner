'use client';

import { AuthProvider } from '@/context/auth-context';
import type { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
