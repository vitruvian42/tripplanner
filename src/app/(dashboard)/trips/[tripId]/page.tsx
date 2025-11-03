'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

import { placeholderImageById, defaultPlaceholderImage, getDestinationImage } from '@/lib/placeholder-images';
import { getDestinationGalleryImages, getActivityImageUrl, getHotelImageUrl } from '@/lib/image-service';
import ItineraryTimeline from '@/components/trip/itinerary-timeline';
import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';
import { generateItineraryProgressive } from '@/ai/flows/ai-itinerary-generation-progressive';
import { getTripById, updateTrip, getCollaboratorDetails } from '@/lib/firestore';
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

  useEffect(() => {
    // Wait for authentication to be ready before fetching trip data
    if (authLoading || !user) {
      return;
    }

    const fetchTripData = async () => {
      try {
        setError(null);
        console.log(`[TRIP PAGE] Starting fetchTripData for trip ${tripId}`);
        console.log(`[TRIP PAGE] Current user:`, user?.uid, user?.email);
        
        console.log(`[TRIP PAGE] Step 1: Calling getTripById...`);
        const tripData = await getTripById(tripId);
        console.log(`[TRIP PAGE] Step 1 complete: getTripById returned`, tripData ? 'trip data' : 'null');

        if (!tripData) {
          console.log(`[TRIP PAGE] Trip not found, calling notFound()`);
          notFound();
          return;
        }

        console.log(`[TRIP PAGE] Step 2: Checking enrichedItinerary...`);
        if (!tripData.enrichedItinerary) {
          console.log(`[TRIP PAGE] Trip ${tripId} missing enrichedItinerary.`);
          
          // Wait a moment to see if background generation completes
          // This prevents duplicate generation when trip is just created
          setGeneratingItinerary(true);
          setItineraryProgress(5);
          setItineraryMessage('Checking itinerary status...');
          
          // Give background generation a few seconds to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Re-check trip data to see if background generation completed
          const updatedTripData = await getTripById(tripId);
          if (updatedTripData?.enrichedItinerary) {
            console.log(`[TRIP PAGE] Background generation completed, using existing itinerary`);
            tripData.enrichedItinerary = updatedTripData.enrichedItinerary;
            setGeneratingItinerary(false);
            setItineraryProgress(0);
            setItineraryMessage(undefined);
          } else {
            // Background generation hasn't completed, generate it now
            console.log(`[TRIP PAGE] Generating progressively on client...`);
            try {
              setItineraryProgress(10);
              setItineraryMessage('Creating your personalized itinerary...');
              
              // Use progressive generation - this generates summary first, then full details
              console.log(`[TRIP PAGE] Step 2a: Calling generateItineraryProgressive...`);
              
              const generationPromise = generateItineraryProgressive({
                startingPoint: tripData.startingPoint || tripData.destination,
                destination: tripData.destination,
                startDate: tripData.startDate,
                endDate: tripData.endDate,
                interests: tripData.interests,
                budget: tripData.budget,
              });

              // Wait for summary (should be quick)
              setItineraryProgress(20);
              setItineraryMessage('Exploring amazing destinations...');
              
              const progressiveResult = await generationPromise;

              // Show summary progress
              if (progressiveResult.summary) {
                setItineraryProgress(50);
                setItineraryMessage('Adding detailed activities and recommendations...');
              }

              // Wait for full itinerary
              const generatedOutput = progressiveResult.fullItinerary;
              if (generatedOutput) {
                setItineraryProgress(85);
                setItineraryMessage('Finalizing your itinerary...');
                
                console.log(`[TRIP PAGE] Step 2a complete: generateItineraryProgressive returned`);
                tripData.enrichedItinerary = generatedOutput;

                setItineraryProgress(95);
                if (tripData.enrichedItinerary) {
                  console.log(`[TRIP PAGE] Step 2b: Calling updateTrip to save enrichedItinerary...`);
                  await updateTrip(tripId, { enrichedItinerary: tripData.enrichedItinerary });
                  console.log(`[TRIP PAGE] Step 2b complete: updateTrip succeeded`);
                  console.log(`[TRIP PAGE] Saved enrichedItinerary for trip ${tripId}.`);
                  setItineraryProgress(100);
                } else {
                  console.warn(`[TRIP PAGE] Generation process did not return a valid itinerary for trip ${tripId}.`);
                }
              } else {
                console.warn(`[TRIP PAGE] Generation process did not return a valid itinerary for trip ${tripId}.`);
              }
            } catch (e: unknown) {
              const error = e as { code?: string; message?: string };
              console.error(`[TRIP PAGE] ❌ Error in step 2 (generate/update itinerary):`, e);
              console.error(`[TRIP PAGE] Error code:`, error?.code);
              console.error(`[TRIP PAGE] Error message:`, error?.message);
              throw e; // Re-throw to be caught by outer catch
            } finally {
              setGeneratingItinerary(false);
              setItineraryProgress(0);
              setItineraryMessage(undefined);
            }
          }
        } else {
          console.log(`[TRIP PAGE] Trip already has enrichedItinerary, skipping generation`);
        }
      
        console.log(`[TRIP PAGE] Step 3: Cleaning image URLs...`);
        // Clean image URLs
        if (tripData.enrichedItinerary) {
          if (tripData.enrichedItinerary.hotel?.imageUrl?.includes('example.com')) {
              tripData.enrichedItinerary.hotel.imageUrl = undefined;
          }
          tripData.enrichedItinerary.days.forEach(day => {
              day.activities.forEach(activity => {
              if (activity.imageUrl?.includes('example.com')) {
                  activity.imageUrl = undefined;
              }
              });
          });
        }

        console.log(`[TRIP PAGE] Step 4: Setting trip state...`);
        console.log(`[TRIP PAGE] Flights data:`, tripData.enrichedItinerary?.flights);
        console.log(`[TRIP PAGE] Flights length:`, tripData.enrichedItinerary?.flights?.length);
        setTrip(tripData);

        console.log(`[TRIP PAGE] Step 5: Getting collaborator details...`);
        if (tripData.collaborators) {
          console.log(`[TRIP PAGE] Collaborators array:`, tripData.collaborators);
          try {
            const collaboratorDetails = await getCollaboratorDetails(tripData.collaborators);
            console.log(`[TRIP PAGE] Step 5 complete: getCollaboratorDetails returned`, collaboratorDetails.length, 'collaborators');
            setCollaborators(collaboratorDetails);
          } catch (e: unknown) {
            const error = e as { code?: string; message?: string };
            console.error(`[TRIP PAGE] ❌ Error in step 5 (getCollaboratorDetails):`, e);
            console.error(`[TRIP PAGE] Error code:`, error?.code);
            console.error(`[TRIP PAGE] Error message:`, error?.message);
            // Don't throw - collaborator details are not critical
          }
        } else {
          console.log(`[TRIP PAGE] No collaborators to fetch`);
        }

        console.log(`[TRIP PAGE] Step 6: Checking for existing booking...`);
        try {
          const existingBooking = await getBookingByTripAndUserAction(tripId, user.uid);
          if (existingBooking) {
            console.log(`[TRIP PAGE] Found existing booking with ID:`, existingBooking.id);
            setBooking(existingBooking);
          } else {
            console.log(`[TRIP PAGE] No existing booking found for this trip and user`);
            setBooking(null);
          }
        } catch (e: unknown) {
          const error = e as { code?: string; message?: string };
          console.error(`[TRIP PAGE] ❌ Error checking for booking:`, error);
          // Don't throw - booking check is not critical for displaying trip
          setBooking(null);
        }

        console.log(`[TRIP PAGE] ✅ All steps complete successfully`);
        setLoading(false);
      } catch (err: any) {
        console.error('[TRIP PAGE] ❌ ERROR in fetchTripData:', err);
        console.error('[TRIP PAGE] Error name:', err?.name);
        console.error('[TRIP PAGE] Error code:', err?.code);
        console.error('[TRIP PAGE] Error message:', err?.message);
        console.error('[TRIP PAGE] Error stack:', err?.stack);
        // Handle permission errors specifically
        if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
          setError('You do not have permission to view this trip. Please ensure you are the owner or have been added as a collaborator.');
        } else {
          setError('Failed to load trip. Please try again later.');
        }
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, user, authLoading]);

  if (authLoading || loading || generatingItinerary) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <ItineraryLoader 
          message={itineraryMessage}
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
                  disabled={isBooking || !trip.enrichedItinerary}
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
              <DeleteTripButton tripId={trip.id} />
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
                 </div>
               </div>
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