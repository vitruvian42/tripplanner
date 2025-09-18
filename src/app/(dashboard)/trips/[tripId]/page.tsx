import { getTripById } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { placeholderImageById, defaultPlaceholderImage } from '@/lib/placeholder-images';
import ItineraryTimeline from '@/components/trip/itinerary-timeline';
import { enrichItinerary } from '@/ai/flows/ai-enrich-itinerary';
import { updateTrip } from '@/lib/firestore';
import { TripHighlights } from '@/components/trip/trip-highlights';
import { TripOverviewCard } from '@/components/trip/trip-overview-card';
import { AssistantCard } from '@/components/trip/assistant-card';
import { TripMap } from '@/components/trip/trip-map';
import { FindHotelCard } from '@/components/trip/find-hotel-card';


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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <TripHighlights trip={{
              destination: trip.destination,
              startDate: trip.startDate,
              endDate: trip.endDate,
              budget: trip.budget,
              interests: trip.interests,
              collaborators: trip.collaborators,
            }} />

            <div id="itinerary" className="scroll-mt-20">
               <h2 className="text-3xl font-bold font-headline mb-6">Your Itinerary</h2>
               <ItineraryTimeline itinerary={trip.enrichedItinerary} />
            </div>

            <div id="hotel" className="scroll-mt-20">
               <h2 className="text-3xl font-bold font-headline mb-6">Hotel</h2>
               <FindHotelCard destination={trip.destination} budget={trip.budget} />
            </div>

             <div id="assistant" className="scroll-mt-20">
               <h2 className="text-3xl font-bold font-headline mb-6">AI Assistant</h2>
               <AssistantCard tripDetails={trip.itinerary} />
            </div>

            <div id="map" className="scroll-mt-20">
               <h2 className="text-3xl font-bold font-headline mb-6">Map</h2>
               <TripMap destination={trip.destination} />
            </div>
          </div>
          
          {/* Sticky Sidebar */}
          <div className="relative">
            <TripOverviewCard trip={trip} />
          </div>
        </div>
      </div>
    </div>
  );
}
