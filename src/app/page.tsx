
'use client';

import { LandingHeader } from '@/components/landing/header';
import { LandingHero } from '@/components/landing/hero';
import { LandingFeatures } from '@/components/landing/features';
import { ClientOnly } from '@/components/ui/client-only';

export default function Home() {

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
      </main>
      <footer className="bg-muted/50">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 text-center text-sm text-muted-foreground">
          <ClientOnly>© {new Date().getFullYear()} Trippy. All rights reserved.</ClientOnly>
        </div>
      </footer>
    </div>
  );
}
