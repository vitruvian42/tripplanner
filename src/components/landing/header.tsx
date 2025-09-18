import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-black/30 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-white/20">
      <div className="container mx-auto max-w-7xl flex items-center justify-between">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo className="text-white"/>
          <span className="sr-only">Wanderplan</span>
        </Link>
        <nav className="flex gap-4 sm:gap-6">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/login" prefetch={false}>
              Login
            </Link>
          </Button>
          <Button asChild variant="outline" className="text-white border-white bg-transparent hover:bg-white hover:text-black">
            <Link href="/signup" prefetch={false}>
              Sign Up
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
