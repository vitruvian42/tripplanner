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

    if (waypoints) {
      const origin = encodeURIComponent(destination);
      const destination = encodeURIComponent(destination); // Route ends at the start
      // Use Google Maps Directions API embed
      mapSrc = `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}`;
    } else {
      // Fallback if no valid waypoints are found
      mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    }
  } else {
    // Default map if there's no itinerary
    mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  }
  
  // Note: The Directions Embed API requires a billing-enabled API key.
  // If process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set, this iframe may show an error.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Route</CardTitle>
        <CardDescription>A visualized route of your planned activities in {destination}.</CardDescription>
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
