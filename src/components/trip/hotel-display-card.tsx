'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, Location } from '@/lib/types';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { defaultPlaceholderImage } from '@/lib/placeholder-images'; // Import defaultPlaceholderImage

// Minor change to trigger re-evaluation

type HotelDisplayCardProps = {
  hotel: Hotel;
};

export function HotelDisplayCard({ hotel }: HotelDisplayCardProps) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.location.address || `${hotel.location.lat},${hotel.location.lng}`)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hotel.name}</CardTitle>
      <CardDescription>{hotel.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hotel.imageUrl && (
          <div className="relative w-full h-48 rounded-md overflow-hidden">
            <img
              src={hotel.imageUrl}
              alt={hotel.name}
              className="object-cover absolute inset-0 h-full w-full"
              onError={(e) => {
                e.currentTarget.src = defaultPlaceholderImage.imageUrl; // Fallback to a generic placeholder
              }}
            />
          </div>
        )}
        {hotel.location && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {hotel.location.address || `${hotel.location.lat}, ${hotel.location.lng}`}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
