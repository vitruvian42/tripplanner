
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, PlayCircle, ArrowRight, Sparkles, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { Input } from '../ui/input';
import { useState } from 'react';
import { VideoPlayerDialog } from '../ui/video-player-dialog';
import { ClientOnly } from '../ui/client-only';

export function LandingHero() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <section className="relative w-full min-h-screen flex items-center justify-center text-center text-white overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/30" />
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Beautiful travel destination"
            className="object-cover absolute inset-0 h-full w-full"
          />
        </div>
        <div className="absolute inset-0 bg-black/40 z-20" />

        {/* Floating elements */}
        <div className="absolute top-20 left-10 z-30 float">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute top-32 right-16 z-30 float" style={{ animationDelay: '2s' }}>
          <div className="w-12 h-12 bg-accent/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="absolute bottom-32 left-20 z-30 float" style={{ animationDelay: '4s' }}>
          <div className="w-14 h-14 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="container relative mx-auto mobile-padding space-y-8 z-30 max-w-6xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent" />
            AI-Powered Trip Planning
          </div>

          {/* Main heading */}
          <div className="space-y-4 animate-slide-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-headline tracking-tight leading-tight">
              Plan Your Perfect
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Adventure
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed">
              From local tours to faraway destinations, create unforgettable experiences with AI-powered recommendations and seamless collaboration.
            </p>
          </div>

          {/* Search section */}
          <div className="max-w-2xl mx-auto space-y-6 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Where do you want to go?"
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white text-foreground text-base border-0 focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <Button asChild size="lg" className="h-12 px-8 rounded-xl gradient-primary hover:shadow-glow">
                  <Link href="/signup">
                    <span className="hidden sm:inline">Start Planning</span>
                    <span className="sm:hidden">Plan</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">50K+</div>
                <div className="text-sm text-white/70">Happy Travelers</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">100+</div>
                <div className="text-sm text-white/70">Countries</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-white/70">AI Support</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">4.9★</div>
                <div className="text-sm text-white/70">Rating</div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 text-white border-white/30 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 h-12 px-8"
                onClick={() => setIsVideoOpen(true)}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-foreground hover:bg-white/90 h-12 px-8"
                asChild
              >
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/60 text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Collaborative planning</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered insights</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce-subtle">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
      
      <ClientOnly>
        <VideoPlayerDialog
          isOpen={isVideoOpen}
          onOpenChange={setIsVideoOpen}
          videoUrl="https://drive.google.com/file/d/1spjcFDFnWbOqdiLHP6Lf1sOzoxD6AZMc/view?usp=sharing"
        />
      </ClientOnly>
    </>
  );
}
