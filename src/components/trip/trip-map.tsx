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

  // Use the public Firebase API key for the map
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (itinerary && itinerary.days && itinerary.days.length > 0) {
    const waypoints = itinerary.days
      .flatMap(day => day.activities)
      .map(activity => activity.title)
      .filter(title => {
        const lowerTitle = title.toLowerCase();
        // Keep the title if it doesn't contain any of the generic terms
        return !genericTerms.some(term => lowerTitle.includes(term));
      })
      // Add the destination to each waypoint for better geocoding
      .map(title => `${title}, ${destination}`)
      .join('|');

    // As a fallback, we use a simple place embed. The Directions API requires more configuration.
    mapSrc = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(destination)}&key=${apiKey}`;

  } else {
    // Default map if there's no itinerary
    mapSrc = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(destination)}&key=${apiKey}`;
  }
  
  // Note: For the Directions API to work, the "Maps Embed API" and "Directions API"
  // must be enabled in the Google Cloud Console for the project associated with this API key.
  // The project may also need to have billing enabled.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Location</CardTitle>
        <CardDescription>A map showing the location of {destination}.</CardDescription>
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
