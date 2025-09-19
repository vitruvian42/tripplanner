import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EnrichedItinerary } from '@/lib/types';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Map } from 'lucide-react';

type TripMapProps = {
  destination: string;
  itinerary?: EnrichedItinerary;
};

export function TripMap({ destination, itinerary }: TripMapProps) {
  // Create a simple search link for Google Maps to avoid API key issues.
  const mapSearchLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Location</CardTitle>
        <CardDescription>A map showing the location of your trip to {destination}.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96 bg-muted rounded-lg overflow-hidden flex flex-col items-center justify-center text-center p-4">
          <p className="text-muted-foreground mb-4">
            There was an issue loading the interactive map. This is likely due to a Google Maps API key configuration issue.
          </p>
          <Button asChild>
            <Link href={mapSearchLink} target="_blank" rel="noopener noreferrer">
              <Map className="mr-2 h-4 w-4" />
              View on Google Maps
            </Link>
          </Button>
           <p className="text-xs text-muted-foreground mt-4">
            To enable the embedded map, please ensure the Maps Embed API is enabled and a billing account is linked to your Google Cloud project.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
