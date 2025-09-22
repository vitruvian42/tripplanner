
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { Trip } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { CreateTripDialog } from '@/components/dashboard/create-trip-dialog';

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
                        <img
                            src={imageInfo.imageUrl}
                            alt={trip.destination}
                            data-ai-hint={imageInfo.imageHint}
                            className="object-cover absolute inset-0 h-full w-full"
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

const EmptyState = ({ title, description, openDialog }: { title: string, description: string, openDialog: () => void }) => (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4 py-12">
        <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Button className="mt-4" onClick={openDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Trip
            </Button>
        </div>
    </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  

  useEffect(() => {
    if (!user || !user.uid) {
        setLoading(false);
        return;
    }

    setLoading(true);
    const db = getFirestoreDb();

    // Query for trips where the user is the owner
    const ownerQuery = query(collection(db, 'trips'), where('ownerId', '==', user.uid));

    // Query for trips where the user is a collaborator
    const collaboratorQuery = query(collection(db, 'trips'), where('collaborators', 'array-contains', user.uid));

    const unsubOwner = onSnapshot(ownerQuery, (ownerSnapshot) => {
        const ownerTrips = new Map<string, Trip>();
        ownerSnapshot.forEach((doc) => {
            ownerTrips.set(doc.id, { id: doc.id, ...doc.data() } as Trip);
        });

        const unsubCollaborator = onSnapshot(collaboratorQuery, (collaboratorSnapshot) => {
            const combinedTrips = new Map<string, Trip>(ownerTrips);
            collaboratorSnapshot.forEach((doc) => {
                if (!combinedTrips.has(doc.id)) {
                    combinedTrips.set(doc.id, { id: doc.id, ...doc.data() } as Trip);
                }
            });

            setMyTrips(Array.from(combinedTrips.values()));
            setLoading(false);
        }, (error) => {
            console.error("Collaborator snapshot error:", error);
            setLoading(false);
        });

        return () => unsubCollaborator();
    }, (error) => {
        console.error("Owner snapshot error:", error);
        setLoading(false);
    });

    return () => {
        unsubOwner();
        // The collaborator unsubscribe is handled inside the owner snapshot
    };
}, [user]);

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
        ) : myTrips.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                {myTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
            </div>
        ) : (
            <EmptyState 
                title="You have no trips yet"
                description="Start planning your next adventure by creating a new trip."
                openDialog={() => setIsDialogOpen(true)}
            />
        )}

        <CreateTripDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
