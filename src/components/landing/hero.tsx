import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function LandingHero() {
  return (
    <section className="w-full pt-24 md:pt-32 lg:pt-40 border-b">
      <div className="px-4 md:px-6 space-y-10 xl:space-y-16">
        <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col justify-center space-y-4">
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl/none">
              Craft Your Perfect Journey with AI
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Wanderplan is your intelligent travel partner. Create personalized itineraries, collaborate with friends, and manage
              your trip seamlessly, all in one place.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/signup" prefetch={false}>
                  Start Planning for Free
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
             <Image
                src="https://picsum.photos/seed/hero/600/400"
                width="600"
                height="400"
                alt="Hero Image"
                data-ai-hint="travel journey"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
              />
          </div>
        </div>
      </div>
    </section>
  );
}
