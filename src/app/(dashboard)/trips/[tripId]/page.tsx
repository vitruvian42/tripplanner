'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

import { placeholderImageById, defaultPlaceholderImage, getDestinationImage } from '@/lib/placeholder-images';
import { getDestinationGalleryImages, getActivityImageUrl, getHotelImageUrl } from '@/lib/image-service';
import ItineraryTimeline from '@/components/trip/itinerary-timeline';
import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';
import { generateItineraryProgressive } from '@/ai/flows/ai-itinerary-generation-progressive';
import { getTripById, updateTrip, getCollaboratorDetails } from '@/lib/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { getBookingByTripAndUserAction } from '@/lib/actions/trips';
import { TripHighlights } from '@/components/trip/trip-highlights';
import { AssistantCard } from '@/components/trip/assistant-card';
import { TripMap } from '@/components/trip/trip-map';
import { FindHotelCard } from '@/components/trip/find-hotel-card';
import { HotelDisplayCard } from '@/components/trip/hotel-display-card';
import { FlightRecommendations } from '@/components/trip/flight-recommendations';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Hotel, Map as MapIcon, Bot, Wallet, Share2, Camera, CreditCard, Ticket } from 'lucide-react';
import { ExpenseTracker } from '@/components/trip/expense-tracker';
import { Button } from '@/components/ui/button';
import { ShareTripDialog } from '@/components/trip/share-trip-dialog';
import { DeleteTripButton } from '@/components/trip/delete-trip-button';
import { EnrichedItinerary, Trip, Collaborator, TripPhoto, Booking } from '@/lib/types';
import { PhotoUploadSection } from '@/components/trip/photo-upload-section';
import { Loader2 } from 'lucide-react';
import { use } from 'react';
import { ItineraryLoader } from '@/components/ui/itinerary-loader';
import { useAuth } from '@/context/auth-context';
import { bookTripAction } from '@/lib/actions/trips';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type TripPageProps = {
  params: Promise<{
    tripId: string;
  }>;
};

export default function TripPage({ params }: TripPageProps) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.tripId;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [itineraryProgress, setItineraryProgress] = useState(0);
  const [itineraryMessage, setItineraryMessage] = useState<string | undefined>(undefined);
  const [isItineraryComplete, setIsItineraryComplete] = useState(false);

  useEffect(() => {
    // Wait for authentication to be ready before fetching trip data
    if (authLoading || !user) {
      return;
    }

    setLoading(true);
    console.log(`[TRIP PAGE] Setting up real-time listener for trip ${tripId}`);

    // Set up real-time Firestore listener to watch for progressive updates
    const db = getFirestoreDb();
    const tripDocRef = doc(db, 'trips', tripId);
    
    const unsubscribe = onSnapshot(
      tripDocRef,
      async (docSnapshot) => {
        try {
          if (!docSnapshot.exists()) {
            console.log(`[TRIP PAGE] Trip not found, calling notFound()`);
            notFound();
            return;
          }

          const tripData = { id: docSnapshot.id, ...docSnapshot.data() } as Trip & {
            createdAt?: Timestamp;
          };
          
          console.log(`[TRIP PAGE] Trip document updated - enrichedItinerary status:`, {
            hasDays: !!tripData.enrichedItinerary?.days?.length,
            hasHotel: !!tripData.enrichedItinerary?.hotel,
            hasFlights: !!tripData.enrichedItinerary?.flights?.length,
            daysCount: tripData.enrichedItinerary?.days?.length || 0,
          });

          // Update generating state based on itinerary completeness
          if (!tripData.enrichedItinerary) {
            setGeneratingItinerary(true);
            setItineraryProgress(5);
            setItineraryMessage('Initializing itinerary generation...');
            setIsItineraryComplete(false);
          } else {
            const daysCount = tripData.enrichedItinerary.days?.length || 0;
            const hasHotel = !!tripData.enrichedItinerary.hotel;
            const hasFlights = !!tripData.enrichedItinerary.flights?.length;
            
            // Calculate progress based on what's complete
            let progress = 0;
            let message = 'Generating itinerary...';
            
            if (daysCount > 0) progress += 50;
            if (hasHotel) progress += 25;
            if (hasFlights) progress += 25;
            
            if (daysCount > 0 && hasHotel && hasFlights) {
              setGeneratingItinerary(false);
              setItineraryProgress(100);
              setItineraryMessage(undefined);
              setIsItineraryComplete(true);
              message = 'Itinerary complete!';
            } else {
              setGeneratingItinerary(true);
              setItineraryProgress(progress);
              setIsItineraryComplete(false);
              
              if (daysCount > 0) {
                message = hasHotel ? 'Adding flight recommendations...' : 'Finding perfect hotels...';
              } else {
                message = 'Planning your days...';
              }
              setItineraryMessage(message);
            }
          }

          // Convert Firestore Timestamp to ISO string
          if (tripData.createdAt && typeof tripData.createdAt.toDate === 'function') {
            tripData.createdAt = tripData.createdAt.toDate().toISOString() as any;
          }

          // Clean image URLs
          if (tripData.enrichedItinerary) {
            if (tripData.enrichedItinerary.hotel?.imageUrl?.includes('example.com')) {
              tripData.enrichedItinerary.hotel.imageUrl = undefined;
            }
            tripData.enrichedItinerary.days?.forEach(day => {
              day.activities?.forEach(activity => {
                if (activity.imageUrl?.includes('example.com')) {
                  activity.imageUrl = undefined;
                }
              });
            });
          }

          // Update trip state (this will trigger UI re-render with new data)
          setTrip(tripData);

          // Fetch collaborator details if we have collaborators
          if (tripData.collaborators && tripData.collaborators.length > 0) {
            try {
              const collaboratorDetails = await getCollaboratorDetails(tripData.collaborators);
              setCollaborators(collaboratorDetails);
            } catch (e: unknown) {
              console.error(`[TRIP PAGE] Error fetching collaborator details:`, e);
            }
          }

          // Check for existing booking (only once on initial load)
          if (!booking) {
            try {
              const existingBooking = await getBookingByTripAndUserAction(tripId, user.uid);
              if (existingBooking) {
                setBooking(existingBooking);
              }
            } catch (e: unknown) {
              console.error(`[TRIP PAGE] Error checking for booking:`, e);
            }
          }

          setLoading(false);
          setError(null);
        } catch (e: unknown) {
          const error = e as { code?: string; message?: string };
          console.error(`[TRIP PAGE] ❌ Error in snapshot handler:`, e);
          console.error(`[TRIP PAGE] Error code:`, error?.code);
          console.error(`[TRIP PAGE] Error message:`, error?.message);
          
          // Handle permission errors specifically
          if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
            setError('You do not have permission to view this trip. Please ensure you are the owner or have been added as a collaborator.');
          } else {
            setError('Failed to load trip. Please try again later.');
          }
          setLoading(false);
        }
      },
      (error: any) => {
        // Snapshot error handler
        console.error(`[TRIP PAGE] ❌ Snapshot error:`, error);
        if (error.code === 'permission-denied') {
          setError('You do not have permission to view this trip.');
        } else {
          setError('Failed to load trip. Please try again later.');
        }
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log(`[TRIP PAGE] Cleaning up listener for trip ${tripId}`);
      unsubscribe();
    };
  }, [tripId, user?.uid, authLoading]);

  // Show loader only on initial load or if we have no trip data yet
  // Once we have partial data, show it even if generation is in progress
  if (authLoading || (loading && !trip)) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <ItineraryLoader 
          message={itineraryMessage || 'Loading trip...'}
          progress={generatingItinerary ? itineraryProgress : undefined}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  const imageInfo = (trip.imageId && placeholderImageById[trip.imageId]) || defaultPlaceholderImage;
  // Generate high-definition gallery images for the destination
  const galleryImages = getDestinationGalleryImages(trip.destination, 5).map((url, index) => ({
    id: `${trip.destination}-${index}`,
    description: `${trip.destination} image ${index + 1}`,
    imageUrl: url,
    imageHint: trip.destination,
  }));

  const handleBookTrip = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to book this trip.',
        variant: 'destructive',
      });
      return;
    }

    if (!trip.enrichedItinerary) {
      toast({
        title: 'Itinerary not available',
        description: 'Please wait for the itinerary to be generated.',
        variant: 'destructive',
      });
      return;
    }

    setIsBooking(true);
    try {
      const result = await bookTripAction({ tripId: trip.id, userId: user.uid });
      if (result.success && result.bookingId) {
        // Fetch the booking to update state
        const newBooking = await getBookingByTripAndUserAction(tripId, user.uid);
        if (newBooking) {
          setBooking(newBooking);
        }
        
        toast({
          title: 'Booking confirmed!',
          description: 'Your booking has been successfully created.',
        });
        router.push(`/trips/${tripId}/booking/${result.bookingId}`);
      } else {
        toast({
          title: 'Booking failed',
          description: result.error || 'Failed to create booking. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="w-full">
      {/* Image Gallery Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-64 md:h-96">
        {/* Main Image */}
        <div className="col-span-1 md:col-span-2 md:row-span-2 relative">
           <ImageWithFallback
              src={
                trip.enrichedItinerary?.hotel?.imageUrl && !trip.enrichedItinerary.hotel.imageUrl.includes('example.com')
                  ? trip.enrichedItinerary.hotel.imageUrl
                  : trip.enrichedItinerary?.days[0]?.activities[0]?.imageUrl && !trip.enrichedItinerary.days[0].activities[0].imageUrl.includes('example.com')
                  ? trip.enrichedItinerary.days[0].activities[0].imageUrl
                  : getDestinationImage(trip.destination)
              }
              alt={`Main image for ${trip.destination}`}
              fill
              className="object-cover rounded-xl md:rounded-l-xl md:rounded-tr-none md:rounded-br-none"
          />
        </div>
        {/* Smaller Images - Hidden on mobile */}
        {trip.enrichedItinerary?.days.flatMap(day => day.activities).slice(0, 4).map((activity, index) => {
          const activityImageUrl = activity.imageUrl && !activity.imageUrl.includes('example.com')
            ? activity.imageUrl
            : getActivityImageUrl(activity.title, trip.destination);
          
          return (
            <div key={index} className="relative hidden md:block">
              <ImageWithFallback
                src={activityImageUrl}
                alt={activity.title}
                fill
                className={`object-cover ${index === 1 ? '' : index === 2 ? 'rounded-tr-xl' : index === 3 ? '' : 'rounded-br-xl'}`}
              />
            </div>
          );
        }) || galleryImages.slice(1, 5).map((image, index) => (
          <div key={index} className="relative hidden md:block">
            <ImageWithFallback
              src={image.imageUrl}
              alt={`Image ${index + 1} for ${trip.destination}`}
              fill
              className={`object-cover ${index === 1 ? '' : index === 2 ? 'rounded-tr-xl' : index === 3 ? '' : 'rounded-br-xl'}`}
            />
          </div>
        ))}
      </div>

      <div className="container mx-auto max-w-7xl mt-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
             <div className="flex-1">
               <TripHighlights trip={{
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                budget: trip.budget,
                interests: trip.interests,
                collaborators: collaborators,
              }} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 lg:flex-col lg:items-stretch lg:gap-3">
              {booking ? (
                <Button 
                  onClick={() => router.push(`/trips/${tripId}/booking/${booking.id}`)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">View Voucher</span>
                  <span className="sm:hidden">Voucher</span>
                </Button>
              ) : (
                <Button 
                  onClick={handleBookTrip} 
                  disabled={isBooking || !isItineraryComplete}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Booking...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Book Complete Trip</span>
                      <span className="sm:hidden">Book Trip</span>
                    </>
                  )}
                </Button>
              )}
              <ShareTripDialog tripId={trip.id} trip={trip}>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </ShareTripDialog>
              <DeleteTripButton tripId={trip.id} disabled={!isItineraryComplete} />
            </div>
          </div>
          
          <Tabs defaultValue="itinerary" className="mt-8">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted/50">
              <TabsTrigger value="itinerary" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm">
                <FileText className="w-4 h-4"/>
                <span className="hidden sm:inline">Itinerary</span>
                <span className="sm:hidden">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm">
                <Wallet className="w-4 h-4"/>
                <span className="hidden sm:inline">Expenses</span>
                <span className="sm:hidden">Cost</span>
              </TabsTrigger>
              <TabsTrigger value="hotel" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm">
                <Hotel className="w-4 h-4"/>
                <span className="hidden sm:inline">Hotel</span>
                <span className="sm:hidden">Stay</span>
              </TabsTrigger>
              <TabsTrigger value="assistant" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm">
                <Bot className="w-4 h-4"/>
                <span className="hidden sm:inline">AI Assistant</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm">
                <MapIcon className="w-4 h-4"/>
                <span className="hidden sm:inline">Map</span>
                <span className="sm:hidden">Map</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm">
                <Camera className="w-4 h-4"/>
                <span className="hidden sm:inline">Photos</span>
                <span className="sm:hidden">Pics</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="itinerary" className="mt-6 space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <h2 className="text-2xl sm:text-3xl font-bold font-headline">Your Itinerary</h2>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <span>{trip.enrichedItinerary?.days.length || 0} days planned</span>
                   {generatingItinerary && (
                     <span className="flex items-center gap-1 text-primary">
                       <Loader2 className="h-3 w-3 animate-spin" />
                       <span className="hidden sm:inline">Generating...</span>
                     </span>
                   )}
                 </div>
               </div>
               {generatingItinerary && trip.enrichedItinerary && (
                 <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
                   <div className="flex items-center gap-2 mb-2">
                     <Loader2 className="h-4 w-4 animate-spin text-primary" />
                     <span className="font-medium">{itineraryMessage || 'Generating itinerary...'}</span>
                   </div>
                   <div className="flex flex-wrap gap-4 mt-3 text-xs">
                     <span className={trip.enrichedItinerary.days?.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                       {trip.enrichedItinerary.days?.length ? '✅ Days' : '⏳ Days'}
                     </span>
                     <span className={trip.enrichedItinerary.hotel ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                       {trip.enrichedItinerary.hotel ? '✅ Hotel' : '⏳ Hotel'}
                     </span>
                     <span className={trip.enrichedItinerary.flights?.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                       {trip.enrichedItinerary.flights?.length ? '✅ Flights' : '⏳ Flights'}
                     </span>
                   </div>
                 </div>
               )}
               <div className="w-full">
                 <FlightRecommendations flights={trip.enrichedItinerary?.flights} />
               </div>
               <ItineraryTimeline itinerary={trip.enrichedItinerary ?? { days: [] }} destination={trip.destination} />
            </TabsContent>
             <TabsContent value="expenses" className="mt-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl sm:text-3xl font-bold font-headline">Expense Tracker</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{trip.expenses?.length || 0} expenses</span>
                  </div>
                </div>
                {collaborators && collaborators.length > 0 ? (
                  <ExpenseTracker trip={trip} collaborators={collaborators} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Could not load collaborator data for expenses.</p>
                  </div>
                )}
            </TabsContent>
            <TabsContent value="hotel" className="mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold font-headline">Accommodation</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{trip.budget} budget</span>
                </div>
              </div>
              {trip.enrichedItinerary?.hotel ? (
                <HotelDisplayCard hotel={trip.enrichedItinerary.hotel} destination={trip.destination} />
              ) : (
                <FindHotelCard destination={trip.destination} budget={trip.budget} />
              )}
            </TabsContent>
            <TabsContent value="assistant" className="mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold font-headline">AI Assistant</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>24/7 support</span>
                </div>
              </div>
               <AssistantCard tripDetails={trip.itinerary} />
            </TabsContent>
             <TabsContent value="map" className="mt-6 space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <h2 className="text-2xl sm:text-3xl font-bold font-headline">Interactive Map</h2>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <span>{trip.enrichedItinerary?.days.length || 0} locations</span>
                 </div>
               </div>
               <div className="h-[400px] sm:h-[500px] lg:h-[600px]">
                 <TripMap destination={trip.destination} itinerary={trip.enrichedItinerary ?? undefined} />
               </div>
            </TabsContent>
            <TabsContent value="photos" className="mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold font-headline">Trip Photos</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{trip.photos?.length || 0} photos</span>
                </div>
              </div>
              <PhotoUploadSection tripId={trip.id} initialPhotos={trip.photos || []} />
            </TabsContent>
          </Tabs>

      </div>
    </div>
  );
}