'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plane, MapPin, Hotel, UtensilsCrossed, Camera, Compass } from 'lucide-react';

const loadingMessages = [
  { icon: Compass, text: 'Exploring amazing destinations...', color: 'text-blue-500' },
  { icon: MapPin, text: 'Finding the best locations...', color: 'text-green-500' },
  { icon: Hotel, text: 'Selecting perfect accommodations...', color: 'text-purple-500' },
  { icon: Plane, text: 'Planning your flight routes...', color: 'text-sky-500' },
  { icon: UtensilsCrossed, text: 'Discovering local cuisine spots...', color: 'text-orange-500' },
  { icon: Camera, text: 'Curating must-see attractions...', color: 'text-pink-500' },
  { icon: Compass, text: 'Optimizing your travel itinerary...', color: 'text-indigo-500' },
  { icon: MapPin, text: 'Adding hidden gems to your journey...', color: 'text-emerald-500' },
];

interface ItineraryLoaderProps {
  message?: string;
  progress?: number;
}

export function ItineraryLoader({ message, progress }: ItineraryLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (message) return; // Use provided message if available

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [message]);

  const currentMessage = message 
    ? { icon: Loader2, text: message, color: 'text-primary' }
    : loadingMessages[currentMessageIndex];
  const Icon = currentMessage.icon;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-12">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative rounded-full bg-background p-4 border-2 border-primary/30">
          <Icon className={`h-12 w-12 ${currentMessage.color} animate-spin`} />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">
          {currentMessage.text}
        </p>
        {progress !== undefined && (
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

