
'use client';

import Link from 'next/link';
import { Home, LogOut, Menu, Package, Search, Settings, Users, Map, Bell } from 'lucide-react';
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
import { getFirebaseAuth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';
import { getUnreadNotifications, markNotificationAsRead } from '@/lib/firestore';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardHeader() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        setLoadingNotifications(true);
        const unreadNotifications = await getUnreadNotifications(user.uid);
        setNotifications(unreadNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Navigate to the trip
      router.push(`/trips/${notification.tripId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notification as read.',
      });
    }
  };

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center mobile-padding">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-6">
                <Logo />
              </Link>
              <Link href="/dashboard" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                <Home className="h-5 w-5" />
                My Trips
              </Link>
              <Link href="/discover" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                <Map className="h-5 w-5" />
                Discover
              </Link>
              <Link href="/shared-trips" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                <Users className="h-5 w-5" />
                Shared With Me
              </Link>
              <Link href="/settings" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo - only show on mobile (desktop has sidebar logo) */}
        <Link href="/dashboard" className="flex md:hidden items-center gap-2 font-semibold mr-6">
          <Logo />
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search trips or destinations..."
              className="pl-10 pr-4 h-10 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="absolute top-0 right-0 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-semibold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingNotifications ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>No new notifications</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 p-4 cursor-pointer hover:bg-accent"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="font-semibold text-sm">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">{notification.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Package className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
