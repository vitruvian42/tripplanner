'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

import { placeholderImageById, defaultPlaceholderImage } from '@/lib/placeholder-images';
import ItineraryTimeline from '@/components/trip/itinerary-timeline';
import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';
import { getTripById, updateTrip, getCollaboratorDetails } from '@/lib/firestore';
import { TripHighlights } from '@/components/trip/trip-highlights';
import { AssistantCard } from '@/components/trip/assistant-card';
import { TripMap } from '@/components/trip/trip-map';
import { FindHotelCard } from '@/components/trip/find-hotel-card';
import { HotelDisplayCard } from '@/components/trip/hotel-display-card';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Hotel, Map as MapIcon, Bot, Wallet, Share2, Camera } from 'lucide-react';
import { ExpenseTracker } from '@/components/trip/expense-tracker';
import { Button } from '@/components/ui/button';
import { ShareTripDialog } from '@/components/trip/share-trip-dialog';
import { DeleteTripButton } from '@/components/trip/delete-trip-button';
import { EnrichedItinerary, Trip, Collaborator, TripPhoto } from '@/lib/types';
import { PhotoUploadSection } from '@/components/trip/photo-upload-section';
import { Loader2 } from 'lucide-react';
import React from 'react';

type TripPageProps = {
  params: {
    tripId: string;
  };
};

export default function TripPage({ params }: TripPageProps) {
  const { tripId } = React.use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripData = async () => {
      const tripData = await getTripById(tripId);

      if (!tripData) {
        notFound();
        return;
      }

      if (!tripData.enrichedItinerary) {
        console.log(`[TRIP PAGE] Trip ${tripId} missing enrichedItinerary. Generating...`);
        try {
          const generatedOutput = await generateItinerary({
            destination: tripData.destination,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            interests: tripData.interests,
            budget: tripData.budget,
          });
          tripData.enrichedItinerary = generatedOutput;

          if (tripData.enrichedItinerary) {
            await updateTrip(tripId, { enrichedItinerary: tripData.enrichedItinerary });
            console.log(`[TRIP PAGE] Saved enrichedItinerary for trip ${tripId}.`);
          } else {
            console.warn(`[TRIP PAGE] Generation process did not return a valid itinerary for trip ${tripId}.`);
          }
        } catch (e) {
          console.error(`[TRIP PAGE] Failed to generate enriched itinerary for trip ${tripId}`, e);
        }
      }
      
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

      setTrip(tripData);

      if (tripData.collaborators) {
        const collaboratorDetails = await getCollaboratorDetails(tripData.collaborators);
        setCollaborators(collaboratorDetails);
      }

      setLoading(false);
    };

    fetchTripData();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trip) {
    return null; // Or some other placeholder
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
               <ItineraryTimeline itinerary={trip.enrichedItinerary ?? { days: [] }} />
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
                <HotelDisplayCard hotel={trip.enrichedItinerary.hotel} />
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