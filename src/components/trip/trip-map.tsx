
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EnrichedItinerary } from '@/lib/types';

type TripMapProps = {
  destination: string;
  itinerary?: EnrichedItinerary;
};

export function TripMap({ destination, itinerary }: TripMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Trip Location</CardTitle>
                <CardDescription>A map showing the location of your trip to {destination}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full h-96 bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
                     <p className="text-destructive font-semibold">Configuration Error</p>
                    <p className="text-muted-foreground mt-2">
                        The Google Maps API key is missing. Please add it to your environment variables to display the map.
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                        Set <code className="bg-gray-200 text-black px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-gray-200 text-black px-1 py-0.5 rounded">.env.local</code> file.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  // Construct the directions URL
  const waypoints = itinerary?.days
    .flatMap(day => day.activities)
    // Filter out generic activities that don't represent a specific place
    .filter(activity => !activity.title.toLowerCase().includes('check-in') && !activity.title.toLowerCase().includes('breakfast') && !activity.title.toLowerCase().includes('lunch') && !activity.title.toLowerCase().includes('dinner'))
    .map(activity => encodeURIComponent(activity.title))
    .join('|') || '';

  const directionsUrl = new URL('https://www.google.com/maps/embed/v1/directions', 'https://www.google.com');
  directionsUrl.searchParams.append('key', apiKey);
  directionsUrl.searchParams.append('origin', encodeURIComponent(destination));
  directionsUrl.searchParams.append('destination', encodeURIComponent(destination));
  if (waypoints) {
    directionsUrl.searchParams.append('waypoints', waypoints);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Map</CardTitle>
        <CardDescription>A map showing the planned route for your trip to {destination}.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96 bg-muted rounded-lg overflow-hidden">
           <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={directionsUrl.toString()}>
            </iframe>
        </div>
      </CardContent>
    </Card>
  );
}
