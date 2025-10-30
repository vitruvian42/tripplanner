
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import type { Trip } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, Calendar, MapPin, Users, DollarSign, Sparkles } from 'lucide-react';
import { CreateTripDialog } from '@/components/dashboard/create-trip-dialog';
import Link from 'next/link';
import { placeholderImageById, defaultPlaceholderImage } from '@/lib/placeholder-images';
import { ClientOnly } from '@/components/ui/client-only';
import { Badge } from '@/components/ui/badge';

const TripCard = ({ trip }: { trip: Trip }) => {
    const imageInfo = (trip.imageId && placeholderImageById[trip.imageId]) || defaultPlaceholderImage;
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return (
        <Card className="group overflow-hidden card-modern hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1">
            <Link href={`/trips/${trip.id}`} className="block">
                <CardHeader className="p-0">
                    <div className="aspect-[4/3] relative overflow-hidden">
                        <img
                            src={imageInfo.imageUrl}
                            alt={trip.destination}
                            data-ai-hint={imageInfo.imageHint}
                            className="object-cover absolute inset-0 h-full w-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-white/90 text-foreground">
                                {daysDiff} days
                            </Badge>
                        </div>
                        <div className="absolute bottom-3 left-3 text-white">
                            <div className="flex items-center gap-1 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span className="font-medium">{trip.destination}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div>
                            <CardTitle className="font-headline text-lg mb-1 line-clamp-1">{trip.destination}</CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                                <ClientOnly>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </ClientOnly>
                            </CardDescription>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{trip.collaborators?.length || 1} traveler{trip.collaborators?.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>{trip.budget}</span>
                            </div>
                        </div>
                        
                        {trip.interests && (
                            <div className="flex flex-wrap gap-1">
                                {trip.interests.split(',').slice(0, 2).map((interest, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {interest.trim()}
                                    </Badge>
                                ))}
                                {trip.interests.split(',').length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{trip.interests.split(',').length - 2} more
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
};

const EmptyState = ({ title, description, openDialog }: { title: string, description: string, openDialog: () => void }) => (
    <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 shadow-soft mt-8 py-16">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-bold font-headline">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <Button size="lg" className="mt-4 gradient-primary hover:shadow-glow" onClick={openDialog}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Your First Trip
            </Button>
        </div>
    </div>
);

const StatsCard = ({ title, value, icon: Icon, color = "primary" }: { 
    title: string, 
    value: string | number, 
    icon: any, 
    color?: "primary" | "accent" | "success" 
}) => {
    const colorClasses = {
        primary: "bg-primary/10 text-primary",
        accent: "bg-accent/10 text-accent", 
        success: "bg-success/10 text-success"
    };
    
    return (
        <Card className="card-modern">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold font-headline">{value}</div>
                        <div className="text-sm text-muted-foreground">{title}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

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
    const q = query(collection(db, 'trips'), where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const trips: Trip[] = [];
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() } as Trip);
      });
      setMyTrips(trips);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalDays = myTrips.reduce((acc, trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return acc + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, 0);

  const totalCollaborators = myTrips.reduce((acc, trip) => {
    return acc + (trip.collaborators?.length || 1);
  }, 0);

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Trips</h1>
                <p className="text-muted-foreground mt-1">Plan, organize, and share your adventures</p>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" className="sm:hidden" onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Trip
                </Button>
                <Button size="lg" className="hidden sm:flex gradient-primary hover:shadow-glow" onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Trip
                </Button>
            </div>
        </div>
        
        {/* Stats */}
        {myTrips.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard 
                    title="Total Trips" 
                    value={myTrips.length} 
                    icon={MapPin} 
                    color="primary" 
                />
                <StatsCard 
                    title="Days Traveled" 
                    value={totalDays} 
                    icon={Calendar} 
                    color="accent" 
                />
                <StatsCard 
                    title="Travelers" 
                    value={totalCollaborators} 
                    icon={Users} 
                    color="success" 
                />
            </div>
        )}
        
        {/* Trips Grid */}
        {loading ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed shadow-soft mt-8 py-16">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading your trips...</p>
                </div>
            </div>
        ) : myTrips.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
            </div>
        ) : (
            <EmptyState 
                title="Ready for your next adventure?"
                description="Start planning your perfect trip with AI-powered recommendations and seamless collaboration tools."
                openDialog={() => setIsDialogOpen(true)}
            />
        )}

        <CreateTripDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
