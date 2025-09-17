import { getTripById } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Bot, FileText, Users, Wallet } from 'lucide-react';
import { AssistantCard } from '@/components/trip/assistant-card';
import Image from 'next/image';
import { TripMap } from '@/components/trip/trip-map';
import { placeholderImageById, defaultPlaceholderImage } from '@/lib/placeholder-images';
import ItineraryTimeline from '@/components/trip/itinerary-timeline';
import { enrichItinerary } from '@/ai/flows/ai-enrich-itinerary';
import type { Trip, EnrichedItinerary } from '@/lib/types';
import { updateTrip } from '@/lib/firestore';


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
    const enrichedOutput = await enrichItinerary({ itinerary: trip.itinerary });
    trip.enrichedItinerary = enrichedOutput.enrichedItinerary;

    // Update the document in Firestore so we don't have to do this again.
    await updateTrip(tripId, { enrichedItinerary: trip.enrichedItinerary });
    console.log(`[TRIP PAGE] Saved enrichedItinerary for trip ${tripId}.`);
  }


  const imageInfo = (trip.imageId && placeholderImageById[trip.imageId]) || defaultPlaceholderImage;

  return (
    <div className="grid gap-4 md:gap-8">
        <div className="relative h-64 md:h-96 w-full">
            <Image
                src={imageInfo.imageUrl}
                alt={`Image of ${trip.destination}`}
                fill
                data-ai-hint={`${imageInfo.imageHint} landscape`}
                className="object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
            <div className="absolute bottom-6 left-6">
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-white">{trip.destination}</h1>
                <p className="text-lg text-white/90">{new Date(trip.startDate).toLocaleDateString('en-US', {month: 'long', day: 'numeric'})} - {new Date(trip.endDate).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</p>
            </div>
        </div>

      <Tabs defaultValue="itinerary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="itinerary"><FileText className="w-4 h-4 mr-2" />Itinerary</TabsTrigger>
          <TabsTrigger value="map"><Map className="w-4 h-4 mr-2" />Map</TabsTrigger>
          <TabsTrigger value="assistant"><Bot className="w-4 h-4 mr-2" />Assistant</TabsTrigger>
          <TabsTrigger value="collaborators"><Users className="w-4 h-4 mr-2" />Collaborators</TabsTrigger>
          <TabsTrigger value="expenses"><Wallet className="w-4 h-4 mr-2" />Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="itinerary">
            <ItineraryTimeline itinerary={trip.enrichedItinerary} />
        </TabsContent>
        <TabsContent value="map">
            <TripMap destination={trip.destination} />
        </TabsContent>
        <TabsContent value="assistant">
          <AssistantCard tripDetails={trip.itinerary} />
        </TabsContent>
        <TabsContent value="collaborators">
            <Card>
            <CardHeader>
                <CardTitle>Collaborators</CardTitle>
                <CardDescription>Manage who is planning this trip with you.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Collaboration features coming soon.</p>
            </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="expenses">
            <Card>
            <CardHeader>
                <CardTitle>Expense Tracker</CardTitle>
                <CardDescription>Manage your trip's budget.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Expense tracking features coming soon.</p>
            </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
