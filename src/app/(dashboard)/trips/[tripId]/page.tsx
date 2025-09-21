
import { notFound } from 'next/navigation';

import { placeholderImageById, defaultPlaceholderImage } from '@/lib/placeholder-images';
import ItineraryTimeline from '@/components/trip/itinerary-timeline';
import { generateItinerary } from '@/ai/flows/ai-itinerary-generation'; // Import generateItinerary
import { getTripById, updateTrip, getCollaboratorDetails } from '@/lib/firestore-admin';
import { TripHighlights } from '@/components/trip/trip-highlights';
import { AssistantCard } from '@/components/trip/assistant-card';
import { TripMap } from '@/components/trip/trip-map';
import { FindHotelCard } from '@/components/trip/find-hotel-card';
import { HotelDisplayCard } from '@/components/trip/hotel-display-card'; // Import HotelDisplayCard
import { ImageWithFallback } from '@/components/ui/image-with-fallback'; // Import ImageWithFallback
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Hotel, Map as MapIcon, Bot, Wallet, Share2, Camera } from 'lucide-react';
import { ExpenseTracker } from '@/components/trip/expense-tracker';
import { Button } from '@/components/ui/button';
import { ShareTripDialog } from '@/components/trip/share-trip-dialog';
import { DeleteTripButton } from '@/components/trip/delete-trip-button';
import { EnrichedItinerary, TripPhoto } from '@/lib/types';
import { PhotoUploadSection } from '@/components/trip/photo-upload-section';


type TripPageProps = {
  params: {
    tripId: string;
  };
};

export default async function TripPage({ params }: TripPageProps) {
  // Despite what the types might say, the Next.js runtime requires `params` to be awaited.
  const awaitedParams = await params;
  const tripId = awaitedParams.tripId;
  let trip = await getTripById(tripId);

  if (!trip) {
    notFound();
  }

  // If the trip doesn't have an enriched itinerary (e.g., old data),
  // generate and save it now.
  if (!trip.enrichedItinerary) {
    console.log(`[TRIP PAGE] Trip ${tripId} missing enrichedItinerary. Generating...`);
    try {
      // Call generateItinerary directly to get the structured output
      const generatedOutput = await generateItinerary({
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        interests: trip.interests,
        budget: trip.budget,
      });
      trip.enrichedItinerary = generatedOutput;

      // Update the document in Firestore so we don't have to do this again.
      if (trip.enrichedItinerary) {
        await updateTrip(tripId, { enrichedItinerary: trip.enrichedItinerary });
        console.log(`[TRIP PAGE] Saved enrichedItinerary for trip ${tripId}.`);
      } else {
        console.warn(`[TRIP PAGE] Generation process did not return a valid itinerary for trip ${tripId}.`);
      }
    } catch (e) {
      console.error(`[TRIP PAGE] Failed to generate enriched itinerary for trip ${tripId}`, e);
      // The page will still render, but without the enriched itinerary.
    }
  }

  // Helper function to clean image URLs
  const cleanImageUrls = (itinerary: EnrichedItinerary) => {
    if (itinerary.hotel?.imageUrl?.includes('example.com')) {
      itinerary.hotel.imageUrl = undefined;
    }
    itinerary.days.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.imageUrl?.includes('example.com')) {
          activity.imageUrl = undefined;
        }
      });
    });
    return itinerary;
  };

  // Clean image URLs after enrichedItinerary is set
  if (trip.enrichedItinerary) {
    trip.enrichedItinerary = cleanImageUrls(trip.enrichedItinerary);
  }

  const imageInfo = (trip.imageId && placeholderImageById[trip.imageId]) || defaultPlaceholderImage;
  const galleryImages = [
    imageInfo,
    ...Object.values(placeholderImageById).filter(img => img.id !== imageInfo.id).slice(0, 4)
  ];

  const collaborators = await getCollaboratorDetails(trip.collaborators);

  return (
    <div className="w-full">
      {/* Image Gallery Header */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-96">
        {/* Main Image */}
        <div className="col-span-2 row-span-2 relative">
           <ImageWithFallback
              src={trip.enrichedItinerary?.hotel?.imageUrl || trip.enrichedItinerary?.days[0]?.activities[0]?.imageUrl || galleryImages[0].imageUrl}
              alt={`Main image for ${trip.destination}`}
              fill
              data-ai-hint={`${galleryImages[0].imageHint} landscape`}
              className="object-cover rounded-l-xl"
              priority
          />
        </div>
        {/* Smaller Images */}
        {trip.enrichedItinerary?.days.flatMap(day => day.activities).slice(0, 4).map((activity, index) => (
          activity.imageUrl && (
            <div key={index} className="relative">
              <ImageWithFallback
                src={activity.imageUrl}
                alt={activity.title}
                fill
                className={`object-cover ${index === 1 ? '' : index === 2 ? 'rounded-tr-xl' : index === 3 ? '' : 'rounded-br-xl'}`}
              />
            </div>
          )
        )) || galleryImages.slice(1, 5).map((image, index) => (
          <div key={index} className="relative">
            <ImageWithFallback
              src={image.imageUrl}
              alt={`Image ${index + 1} for ${trip.destination}`}
              fill
              data-ai-hint={image.imageHint}
              className={`object-cover ${index === 1 ? '' : index === 2 ? 'rounded-tr-xl' : index === 3 ? '' : 'rounded-br-xl'}`}
            />
          </div>
        ))}
      </div>

      <div className="container mx-auto max-w-7xl mt-8">
          <div className="flex justify-between items-start">
             <TripHighlights trip={{
              destination: trip.destination,
              startDate: trip.startDate,
              endDate: trip.endDate,
              budget: trip.budget,
              interests: trip.interests,
              collaborators: collaborators,
            }} />
            <ShareTripDialog tripId={trip.id} trip={trip}>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </ShareTripDialog>
            <DeleteTripButton tripId={trip.id} />
          </div>
          
          <Tabs defaultValue="itinerary" className="mt-8">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="itinerary"><FileText className="mr-2"/>Itinerary</TabsTrigger>
              <TabsTrigger value="expenses"><Wallet className="mr-2"/>Expenses</TabsTrigger>
              <TabsTrigger value="hotel"><Hotel className="mr-2"/>Hotel</TabsTrigger>
              <TabsTrigger value="assistant"><Bot className="mr-2"/>AI Assistant</TabsTrigger>
              <TabsTrigger value="map"><MapIcon className="mr-2"/>Map</TabsTrigger>
              <TabsTrigger value="photos"><Camera className="mr-2"/>Photos</TabsTrigger>
            </TabsList>
            <TabsContent value="itinerary" className="mt-6">
               <h2 className="text-3xl font-bold font-headline mb-6">Your Itinerary</h2>
               <ItineraryTimeline itinerary={trip.enrichedItinerary ?? { days: [] }} />
            </TabsContent>
             <TabsContent value="expenses" className="mt-6">
                <h2 className="text-3xl font-bold font-headline mb-6">Expense Tracker</h2>
                {collaborators && collaborators.length > 0 ? (
                  <ExpenseTracker trip={trip} collaborators={collaborators} />
                ) : (
                  <p className="text-muted-foreground">Could not load collaborator data for expenses.</p>
                )}
            </TabsContent>
            <TabsContent value="hotel" className="mt-6">
              <h2 className="text-3xl font-bold font-headline mb-6">Hotel</h2>
              {trip.enrichedItinerary?.hotel ? (
                <HotelDisplayCard hotel={trip.enrichedItinerary.hotel} />
              ) : (
                <FindHotelCard destination={trip.destination} budget={trip.budget} />
              )}
            </TabsContent>
            <TabsContent value="assistant" className="mt-6">
              <h2 className="text-3xl font-bold font-headline mb-6">AI Assistant</h2>
               <AssistantCard tripDetails={trip.itinerary} />
            </TabsContent>
             <TabsContent value="map" className="mt-6">
               <h2 className="text-3xl font-bold font-headline mb-6">Map</h2>
               <TripMap destination={trip.destination} itinerary={trip.enrichedItinerary ?? undefined} />
            </TabsContent>
            <TabsContent value="photos" className="mt-6">
              <h2 className="text-3xl font-bold font-headline mb-6">Trip Photos</h2>
              <PhotoUploadSection tripId={trip.id} initialPhotos={trip.photos || []} />
            </TabsContent>
          </Tabs>

      </div>
    </div>
  );
}