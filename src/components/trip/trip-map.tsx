import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TripMapProps = {
  destination: string;
};

export function TripMap({ destination }: TripMapProps) {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    destination
  )}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Map</CardTitle>
        <CardDescription>Visualizing your journey to {destination}.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96 bg-muted rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={mapSrc}
            title={`${destination} Map`}
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}
