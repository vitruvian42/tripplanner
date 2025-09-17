'use client';

import { LandingHeader } from '@/components/landing/header';
import { LandingHero } from '@/components/landing/hero';
import { LandingFeatures } from '@/components/landing/features';
import { useEffect, useState } from 'react';

export default function Home() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
      </main>
      <footer className="bg-muted p-6 md:py-12 w-full">
        <div className="container mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          © {year} Wanderplan. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
