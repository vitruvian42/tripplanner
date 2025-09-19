

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EnrichedItinerary, Location } from '@/lib/types';
import { Loader2 } from 'lucide-react'; // For loading indicator

type TripMapProps = {
  destination: string;
  itinerary?: EnrichedItinerary;
};

// Helper to load Google Maps script
const loadGoogleMapsScript = (apiKey: string, callback: () => void) => {
  if (typeof window === 'undefined' || document.getElementById('google-maps-script')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
  script.async = true;
  script.defer = true;
  window.initMap = callback; // Global callback for the script
  document.head.appendChild(script);
};

export function TripMap({ destination, itinerary }: TripMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    loadGoogleMapsScript(apiKey, () => {
      setMapLoaded(true);
    });
  }, [apiKey]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !itinerary) {
      return;
    }

    const google = window.google;
    if (!google) {
      console.error("Google Maps API not loaded.");
      return;
    }

    const mapOptions: google.maps.MapOptions = {
      center: { lat: 0, lng: 0 }, // Default center, will be adjusted by bounds
      zoom: 2,
      mapId: 'DEMO_MAP_ID', // Replace with your actual Map ID if you have one
    };

    const map = new google.maps.Map(mapRef.current, mapOptions);
    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    // Add hotel marker if available
    if (itinerary.hotel && itinerary.hotel.location) {
      const hotelLocation = itinerary.hotel.location;
      const marker = new google.maps.Marker({
        position: { lat: hotelLocation.lat, lng: hotelLocation.lng },
        map: map,
        title: itinerary.hotel.name,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/lodging.png"
        }
      });
      bounds.extend(marker.getPosition()!);

      marker.addListener('click', () => {
        infoWindow.setContent(`
          <div>
            <h3>${itinerary.hotel?.name}</h3>
            <p>${itinerary.hotel?.description}</p>
            <p>Address: ${itinerary.hotel?.location.address}</p>
            ${itinerary.hotel?.imageUrl ? `<img src="${itinerary.hotel.imageUrl}" alt="${itinerary.hotel.name}" style="width:100px; height:auto; margin-top: 10px;" />` : ''}
          </div>
        `);
        infoWindow.open(map, marker);
      });
    }

    // Add activity markers
    itinerary.days.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.location) {
          const activityLocation = activity.location;
          const marker = new google.maps.Marker({
            position: { lat: activityLocation.lat, lng: activityLocation.lng },
            map: map,
            title: activity.title,
          });
          bounds.extend(marker.getPosition()!);

          marker.addListener('click', () => {
            infoWindow.setContent(`
              <div>
                <h3>${activity.title}</h3>
                <p>${activity.description}</p>
                <p>Address: ${activity.location?.address}</p>
                ${activity.imageUrl ? `<img src="${activity.imageUrl}" alt="${activity.title}" style="width:100px; height:auto; margin-top: 10px;" />` : ''}
                ${activity.link ? `<p><a href="${activity.link}" target="_blank" rel="noopener noreferrer">More Info</a></p>` : ''}
              </div>
            `);
            infoWindow.open(map, marker);
          });
        }
      });
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    } else if (destination) {
      // If no specific locations, try to center on the destination
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: destination }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(10); // A reasonable default zoom for a city
        } else {
          console.warn('Geocode was not successful for the following reason: ' + status);
        }
      });
    }

  }, [mapLoaded, itinerary, apiKey, destination]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Map</CardTitle>
        <CardDescription>A map showing the planned route for your trip to {destination}.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96 bg-muted rounded-lg overflow-hidden relative">
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Extend the Window interface to include initMap
declare global {
  interface Window {
    initMap: () => void;
    google: any; // Or more specific Google Maps types if available
  }
}
