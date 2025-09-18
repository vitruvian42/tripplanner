'use client';

import { useState } from 'react';
import { findHotelForTrip, type FindHotelOutput } from '@/ai/flows/ai-find-hotel';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Hotel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FindHotelCardProps = {
  destination: string;
  budget: string;
};

export function FindHotelCard({ destination, budget }: FindHotelCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<FindHotelOutput | null>(null);
  const { toast } = useToast();

  const handleFindHotel = async () => {
    setIsLoading(true);
    setRecommendation(null);
    try {
      const result = await findHotelForTrip({ destination, budget });
      setRecommendation(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to find a hotel. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find a Hotel</CardTitle>
        <CardDescription>Let our AI agent find the perfect hotel for your budget.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleFindHotel} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Hotel className="mr-2 h-4 w-4" />
              Find Hotel Recommendation
            </>
          )}
        </Button>

        {recommendation && (
          <div className="pt-4">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">{recommendation.hotelName}</CardTitle>
                <CardDescription>{recommendation.hotelPrice}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{recommendation.hotelDescription}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
