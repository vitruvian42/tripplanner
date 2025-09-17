'use client';

import React from 'react';
import type { EnrichedItinerary, EnrichedActivity } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { CircleCheck, Link as LinkIcon, Building, Utensils, Bed, Footprints, Mountain, Ship, Sun } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type ItineraryTimelineProps = {
  itinerary?: EnrichedItinerary;
};

const getIconForActivity = (activityTitle: string) => {
    const lowerCaseActivity = activityTitle.toLowerCase();
    if (lowerCaseActivity.includes('lunch') || lowerCaseActivity.includes('dinner') || lowerCaseActivity.includes('breakfast') || lowerCaseActivity.includes('food') || lowerCaseActivity.includes('cuisine') || lowerCaseActivity.includes('restaurant')) {
      return <Utensils className="h-5 w-5" />;
    }
    if (lowerCaseActivity.includes('check-in') || lowerCaseActivity.includes('hotel') || lowerCaseActivity.includes('check in') || lowerCaseActivity.includes('accommodation')) {
      return <Bed className="h-5 w-5" />;
    }
    if (lowerCaseActivity.includes('explore') || lowerCaseActivity.includes('walk') || lowerCaseActivity.includes('tour') || lowerCaseActivity.includes('stroll')) {
      return <Footprints className="h-5 w-5" />;
    }
    if (lowerCaseActivity.includes('museum') || lowerCaseActivity.includes('landmark') || lowerCaseActivity.includes('castle') || lowerCaseActivity.includes('palace') || lowerCaseActivity.includes('temple')) {
      return <Building className="h-5 w-5" />;
    }
    if (lowerCaseActivity.includes('hike') || lowerCaseActivity.includes('mountain') || lowerCaseActivity.includes('nature')) {
      return <Mountain className="h-5 w-5" />;
    }
    if (lowerCaseActivity.includes('beach') || lowerCaseActivity.includes('relax') || lowerCaseActivity.includes('leisure')) {
        return <Sun className="h-5 w-5" />;
    }
    if (lowerCaseActivity.includes('boat') || lowerCaseActivity.includes('cruise') || lowerCaseActivity.includes('ferry')) {
        return <Ship className="h-5 w-5" />;
    }
    return <CircleCheck className="h-5 w-5" />;
};


const ActivityCard: React.FC<{ activity: EnrichedActivity }> = ({ activity }) => {
  return (
    <div className="relative pl-8">
      <div className="absolute left-[-5px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background"></div>
      <div className="p-4 rounded-lg transition-shadow duration-300">
        <h4 className="font-headline text-lg font-semibold text-primary">{activity.title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
        {activity.imageUrl && (
          <div className="mt-3 relative h-40 w-full rounded-lg overflow-hidden">
            <Image 
                src={activity.imageUrl} 
                alt={activity.title} 
                fill 
                className="object-cover" 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        {activity.link && (
          <Button asChild variant="link" className="p-0 h-auto mt-2">
            <Link href={activity.link} target="_blank" rel="noopener noreferrer">
              <LinkIcon className="mr-2 h-4 w-4" />
              Learn More
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};


const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itinerary }) => {
  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Itinerary details are being generated or are not available.</p>
          <p className="text-sm">Please check back in a moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {itinerary.days.map((day, index) => (
        <Card key={index} className="overflow-hidden shadow-lg border-l-4 border-primary">
          <div className="relative h-48">
            {day.imageUrl ? (
              <Image 
                src={day.imageUrl} 
                alt={day.title} 
                fill 
                className="object-cover" 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
                <div className="h-full w-full bg-muted"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
            <div className="absolute bottom-0 left-0 p-6">
              <h2 className="text-3xl font-bold font-headline text-white">Day {day.day}</h2>
              <p className="text-lg text-white/90">{day.title}</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="relative border-l-2 border-dashed border-border/80 space-y-8">
              {day.activities.map((activity, actIndex) => (
                <div key={actIndex} className="relative pl-8">
                     <div className="absolute left-[-11px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {getIconForActivity(activity.title)}
                     </div>
                    <h4 className="font-semibold text-lg">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    {activity.imageUrl && (
                        <div className="mt-4 relative h-48 w-full rounded-lg overflow-hidden border">
                            <Image 
                                src={activity.imageUrl} 
                                alt={activity.title} 
                                fill 
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                             />
                        </div>
                    )}
                    {activity.link && (
                        <Link href={activity.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline mt-3">
                            <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                            Find out more
                        </Link>
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ItineraryTimeline;
