

import { getTripById } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { placeholderImageById, defaultPlaceholderImage } from '@/lib/placeholder-images';
import ItineraryTimeline from '@/components/trip/itinerary-timeline';
import { enrichItinerary } from '@/ai/flows/ai-enrich-itinerary';
import { updateTrip, getCollaboratorDetails } from '@/lib/firestore';
import { TripHighlights } from '@/components/trip/trip-highlights';
import { AssistantCard } from '@/components/trip/assistant-card';
import { TripMap } from '@/components/trip/trip-map';
import { FindHotelCard } from '@/components/trip/find-hotel-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Hotel, Map as MapIcon, Bot, Wallet, Share2 } from 'lucide-react';
import { ExpenseTracker } from '@/components/trip/expense-tracker';
import { Button } from '@/components/ui/button';
import { ShareTripDialog } from '@/components/trip/share-trip-dialog';


type TripPageProps = {
  params: {
    tripId: string;
  };
};

export default async function TripPage({ params: { tripId } }: TripPageProps) {
  let trip = await getTripById(tripId);

  if (!trip) {
    notFound();
  }

  // If the trip doesn't have an enriched itinerary (e.g., old data),
  // generate and save it now.
  if (!trip.enrichedItinerary) {
    console.log(`[TRIP PAGE] Trip ${tripId} missing enrichedItinerary. Generating...`);
    try {
      const enrichedOutput = await enrichItinerary({ itinerary: trip.itinerary });
      trip.enrichedItinerary = enrichedOutput.enrichedItinerary;

      // Update the document in Firestore so we don't have to do this again.
      await updateTrip(tripId, { enrichedItinerary: trip.enrichedItinerary });
      console.log(`[TRIP PAGE] Saved enrichedItinerary for trip ${tripId}.`);
    } catch (e) {
      console.error(`[TRIP PAGE] Failed to enrich itinerary for trip ${tripId}`, e);
    }
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
        <div className="col-span-2 row-span-2 relative">
           <Image
              src={galleryImages[0].imageUrl}
              alt={`Main image for ${trip.destination}`}
              fill
              data-ai-hint={`${galleryImages[0].imageHint} landscape`}
              className="object-cover rounded-l-xl"
              priority
          />
        </div>
        <div className="relative">
           <Image
              src={galleryImages[1].imageUrl}
              alt={`Image 1 for ${trip.destination}`}
              fill
              data-ai-hint={galleryImages[1].imageHint}
              className="object-cover"
          />
        </div>
         <div className="relative">
           <Image
              src={galleryImages[2].imageUrl}
              alt={`Image 2 for ${trip.destination}`}
              fill
              data-ai-hint={galleryImages[2].imageHint}
              className="object-cover rounded-tr-xl"
          />
        </div>
        <div className="relative">
           <Image
              src={galleryImages[3].imageUrl}
              alt={`Image 3 for ${trip.destination}`}
              fill
              data-ai-hint={galleryImages[3].imageHint}
              className="object-cover"
          />
        </div>
        <div className="relative">
           <Image
              src={galleryImages[4].imageUrl}
              alt={`Image 4 for ${trip.destination}`}
              fill
              data-ai-hint={galleryImages[4].imageHint}
              className="object-cover rounded-br-xl"
          />
        </div>
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
            <ShareTripDialog tripId={trip.id}>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </ShareTripDialog>
          </div>
          
          <Tabs defaultValue="itinerary" className="mt-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="itinerary"><FileText className="mr-2"/>Itinerary</TabsTrigger>
              <TabsTrigger value="expenses"><Wallet className="mr-2"/>Expenses</TabsTrigger>
              <TabsTrigger value="hotel"><Hotel className="mr-2"/>Hotel</TabsTrigger>
              <TabsTrigger value="assistant"><Bot className="mr-2"/>AI Assistant</TabsTrigger>
              <TabsTrigger value="map"><MapIcon className="mr-2"/>Map</TabsTrigger>
            </TabsList>
            <TabsContent value="itinerary" className="mt-6">
               <h2 className="text-3xl font-bold font-headline mb-6">Your Itinerary</h2>
               <ItineraryTimeline itinerary={trip.enrichedItinerary} />
            </TabsContent>
             <TabsContent value="expenses" className="mt-6">
                <h2 className="text-3xl font-bold font-headline mb-6">Expense Tracker</h2>
                <ExpenseTracker trip={trip} collaborators={collaborators} />
            </TabsContent>
            <TabsContent value="hotel" className="mt-6">
              <h2 className="text-3xl font-bold font-headline mb-6">Hotel</h2>
               <FindHotelCard destination={trip.destination} budget={trip.budget} />
            </TabsContent>
            <TabsContent value="assistant" className="mt-6">
              <h2 className="text-3xl font-bold font-headline mb-6">AI Assistant</h2>
               <AssistantCard tripDetails={trip.itinerary} />
            </TabsContent>
             <TabsContent value="map" className="mt-6">
               <h2 className="text-3xl font-bold font-headline mb-6">Map</h2>
               <TripMap destination={trip.destination} itinerary={trip.enrichedItinerary} />
            </TabsContent>
          </Tabs>

      </div>
    </div>
  );
}
