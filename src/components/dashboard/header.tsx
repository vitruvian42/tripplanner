
'use client';

import Link from 'next/link';
import { Home, LogOut, Menu, Package, Search, Settings, Users, Map } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '../ui/logo';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function DashboardHeader() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'An error occurred during logout.' });
    }
  };
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-gray-900 text-gray-50 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-40">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-50">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col bg-gray-900 text-gray-50 border-r-gray-800">
          <nav className="grid gap-2 text-lg font-medium">
            <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Logo />
            </Link>
            <Link href="/dashboard" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-gray-400 hover:text-gray-50">
              <Home className="h-5 w-5" />
              My Trips
            </Link>
            <Link href="/discover" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-gray-400 hover:text-gray-50">
              <Map className="h-5 w-5" />
              Discover
            </Link>
            <Link href="/collaborate" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-gray-400 hover:text-gray-50">
              <Users className="h-5 w-5" />
              Shared With Me
            </Link>
            <Link href="/settings" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-gray-400 hover:text-gray-50">
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search trips or destinations..."
              className="w-full appearance-none bg-gray-800 text-gray-50 border-gray-700 pl-8 shadow-none md:w-2/3 lg:w-1/3 placeholder:text-gray-400"
            />
          </div>
        </form>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full bg-gray-800 hover:bg-gray-700">
            <Avatar>
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'}/>
                <AvatarFallback className="bg-gray-700 text-gray-300">{getInitials(user?.email)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
