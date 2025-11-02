'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel, Location } from '@/lib/types';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { defaultPlaceholderImage } from '@/lib/placeholder-images';
import { getHotelImageUrl } from '@/lib/image-service';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

// Minor change to trigger re-evaluation

type HotelDisplayCardProps = {
  hotel: Hotel;
  destination?: string;
};

export function HotelDisplayCard({ hotel, destination }: HotelDisplayCardProps) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.location.address || `${hotel.location.lat},${hotel.location.lng}`)}`;
  
  // Use real image URL with proper aspect ratio, fallback to generated URL if available
  const hotelImageUrl = hotel.imageUrl && !hotel.imageUrl.includes('example.com')
    ? hotel.imageUrl
    : getHotelImageUrl(hotel.name, destination);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hotel.name}</CardTitle>
      <CardDescription>{hotel.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full h-64 rounded-md overflow-hidden">
          <ImageWithFallback
            src={hotelImageUrl}
            alt={hotel.name}
            fill
            className="object-cover"
            fallbackSrc={defaultPlaceholderImage.imageUrl}
          />
        </div>
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
