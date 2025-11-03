'use client';

import React from 'react';
import type { FlightRecommendation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, Globe, Clock, DollarSign, Building2 } from 'lucide-react';

type FlightRecommendationsProps = {
  flights?: FlightRecommendation[];
};

export function FlightRecommendations({ flights }: FlightRecommendationsProps) {
  // Debug logging
  React.useEffect(() => {
    console.log('[FlightRecommendations] Flights data:', flights);
    console.log('[FlightRecommendations] Flights length:', flights?.length);
  }, [flights]);

  if (!flights || flights.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-headline mb-2">Flight Recommendations</h2>
          <p className="text-muted-foreground">Flight recommendations will appear here once available</p>
        </div>
        <Card>
          <CardContent className="py-6 text-center">
            <Plane className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Flight recommendations are being generated. Please check back shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-headline mb-2">Flight Recommendations</h2>
        <p className="text-muted-foreground">Recommended flights for your trip</p>
      </div>
      <div className="flex flex-col gap-4 w-full">
        {flights.map((flight, index) => (
          <Card key={index} className="relative overflow-hidden w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {flight.type === 'roundTrip' ? (
                    <Globe className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Plane className="h-5 w-5 text-primary shrink-0" />
                  )}
                  <CardTitle className="text-lg sm:text-xl font-headline">{flight.route}</CardTitle>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                  flight.type === 'roundTrip' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {flight.type === 'roundTrip' ? 'Round Trip' : 'Internal'}
                </span>
              </div>
              <CardDescription className="text-sm sm:text-base leading-relaxed">{flight.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {flight.estimatedCost && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium">Estimated Cost:</span> {flight.estimatedCost}
                  </span>
                </div>
              )}
              {flight.bestTimeToBook && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    <span className="font-medium">Best Time to Book:</span> {flight.bestTimeToBook}
                  </span>
                </div>
              )}
              {flight.airlines && flight.airlines.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-muted-foreground">
                    <span className="font-medium">Recommended Airlines:</span>
                    <ul className="list-disc pl-5 mt-1">
                      {flight.airlines.map((airline, i) => (
                        <li key={i}>{airline}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

