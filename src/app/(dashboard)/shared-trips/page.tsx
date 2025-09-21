
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { Trip } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { placeholderImageById, defaultPlaceholderImage } from '@/lib/placeholder-images';
import { ClientOnly } from '@/components/ui/client-only';

const TripCard = ({ trip }: { trip: Trip }) => {
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
                            {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </ClientOnly>
                    </CardDescription>
                </CardContent>
            </Link>
        </Card>
    );
};

const EmptyState = () => (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4 py-12">
        <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">No trips have been shared with you</h3>
            <p className="text-sm text-muted-foreground">When someone shares a trip, it will appear here.</p>
        </div>
    </div>
);

export default function SharedTripsPage() {
  const { user } = useAuth();
  const [sharedTrips, setSharedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if (!user || !user.uid || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Query for trips where the user is a collaborator but NOT the owner
    const q = query(
      collection(db, 'trips'),
      where('collaborators', 'array-contains', user.uid),
      where('ownerId', '!=', user.uid) // Filter out trips owned by the current user
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const trips: Trip[] = [];
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() } as Trip);
      });
      setSharedTrips(trips);
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
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Shared with Me</h1>
        </div>
        
        {loading ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : sharedTrips.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                {sharedTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
            </div>
        ) : (
            <EmptyState />
        )}
    </div>
  );
}
