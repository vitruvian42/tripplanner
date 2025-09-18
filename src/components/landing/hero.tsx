import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';

export function LandingHero() {
  return (
    <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white">
      <Image
        src="https://picsum.photos/seed/hero-main/1920/1080"
        alt="Breathtaking landscape"
        fill
        data-ai-hint="travel landscape"
        className="object-cover -z-10"
        priority
      />
      <div className="absolute inset-0 bg-black/50 -z-10" />

      <div className="container mx-auto px-4 md:px-6 space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-headline tracking-tight">
          Find your next adventure
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/90">
          From local tours to faraway destinations, plan your perfect trip with AI-powered recommendations.
        </p>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Input 
              type="search"
              placeholder="Where are you going?"
              className="w-full h-14 pl-12 pr-32 rounded-full bg-white text-foreground text-lg"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Button asChild size="lg" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-11">
              <Link href="/signup">Search</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
