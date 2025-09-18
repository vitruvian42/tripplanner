import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EnrichedItinerary } from '@/lib/types';

type TripMapProps = {
  destination: string;
  itinerary?: EnrichedItinerary;
};

// Words to filter out from activity titles to get clean waypoints
const genericTerms = [
  'lunch', 'dinner', 'breakfast', 'meal', 'snack', 'food', 'cuisine', 'restaurant',
  'check-in', 'check in', 'hotel', 'accommodation', 'arrive', 'depart',
  'explore', 'walk', 'tour', 'stroll', 'free time', 'leisure', 'relax'
];

export function TripMap({ destination, itinerary }: TripMapProps) {
  let mapSrc: string;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  const waypoints = itinerary?.days
    .flatMap(day => day.activities)
    .map(activity => activity.title)
    .filter(title => {
      const lowerTitle = title.toLowerCase();
      return !genericTerms.some(term => lowerTitle.includes(term));
    })
    .map(title => `${title}, ${destination}`)
    .join('|');

  if (waypoints) {
    const origin = encodeURIComponent(destination);
    const destinationArg = encodeURIComponent(destination); // Route ends at the start
    // Use Google Maps Directions API embed
    mapSrc = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destinationArg}&waypoints=${encodeURIComponent(waypoints)}`;
  } else {
    // Default map if there's no itinerary or waypoints
    mapSrc = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(destination)}&key=${apiKey}`;
  }
  
  // Note: For the Directions API to work, the "Maps Embed API" and "Directions API"
  // must be enabled in the Google Cloud Console for the project associated with this API key.
  // The project may also need to have billing enabled.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Route</CardTitle>
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
            referrerPolicy="no-referrer-when-downgrade"
            src={mapSrc}
            title={`${destination} Itinerary Map`}
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}
