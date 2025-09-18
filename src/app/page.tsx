'use client';

import { LandingHeader } from '@/components/landing/header';
import { LandingHero } from '@/components/landing/hero';
import { LandingFeatures } from '@/components/landing/features';
import { useEffect, useState } from 'react';

export default function Home() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
      </main>
      <footer className="bg-muted/50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 text-center text-sm text-muted-foreground">
          © {year || new Date().getFullYear()} Wanderplan. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
