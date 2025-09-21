
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { Search, PlayCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { useState } from 'react';
import { VideoPlayerDialog } from '../ui/video-player-dialog';
import { ClientOnly } from '../ui/client-only';

export function LandingHero() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white isolate">
        <div className="absolute inset-0 z-10">
          <img
            src="https://picsum.photos/seed/hero-main/1920/1080"
            alt="Breathtaking landscape"
            data-ai-hint="travel landscape"
            className="object-cover absolute inset-0 h-full w-full"
          />
        </div>
        <div className="absolute inset-0 bg-black/50 z-20" />

        <div className="container relative mx-auto px-4 md:px-6 space-y-6 z-30">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-headline tracking-tight">
            Find your next adventure
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/90">
            From local tours to faraway destinations, plan your perfect trip with AI-powered recommendations.
          </p>
          <div className="max-w-2xl mx-auto space-y-4">
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
            <Button
              variant="outline"
              size="lg"
              className="bg-white/20 text-white border-white/50 backdrop-blur-sm hover:bg-white/30"
              onClick={() => setIsVideoOpen(true)}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>
      <ClientOnly>
        <VideoPlayerDialog
          isOpen={isVideoOpen}
          onOpenChange={setIsVideoOpen}
          videoUrl="https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4"
        />
      </ClientOnly>
    </>
  );
}
