
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { Trip } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { CreateTripDialog } from '@/components/dashboard/create-trip-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { placeholderImageById, defaultPlaceholderImage } from '@/lib/placeholder-images';
import { ClientOnly } from '@/components/ui/client-only';

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const db = getFirebaseDb();

  useEffect(() => {
    if (!user || !user.uid || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'trips'), where('collaborators', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTrips: Trip[] = [];
      querySnapshot.forEach((doc) => {
        userTrips.push({ id: doc.id, ...doc.data() } as Trip);
      });
      setTrips(userTrips);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, db]);

  return (
    <div className="flex flex-1 flex-col">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">My Trips</h1>
            <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="h-8 gap-1" onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Create Trip</span>
                </Button>
            </div>
        </div>
        
        {loading ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : trips.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                {trips.map((trip) => {
                    const imageInfo = (trip.imageId && placeholderImageById[trip.imageId]) || defaultPlaceholderImage;
                    return (
                        <Card key={trip.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                             <Link href={`/trips/${trip.id}`} className="block">
                                <CardHeader className="p-0">
                                    <div className="aspect-[4/3] relative">
                                        <Image 
                                            src={imageInfo.imageUrl}
                                            alt={trip.destination}
                                            fill
                                            data-ai-hint={imageInfo.imageHint}
                                            className="object-cover"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <CardTitle className="font-headline text-lg mb-1 truncate">{trip.destination}</CardTitle>
                                    <CardDescription>
                                        <ClientOnly>
                                            {new Date(trip.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - {new Date(trip.endDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                        </ClientOnly>
                                    </CardDescription>
                                </CardContent>
                            </Link>
                        </Card>
                    );
                })}
            </div>
        ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">You have no trips yet</h3>
                    <p className="text-sm text-muted-foreground">Start planning your next adventure by creating a new trip.</p>
                    <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Trip
                    </Button>
                </div>
            </div>
        )}

        <CreateTripDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
