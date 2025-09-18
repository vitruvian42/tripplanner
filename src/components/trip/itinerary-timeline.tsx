
'use client';

import React from 'react';
import type { EnrichedItinerary, EnrichedActivity } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { CircleCheck, Link as LinkIcon, Building, Utensils, Bed, Footprints, Mountain, Ship, Sun } from 'lucide-react';
import Link from 'next/link';

type ItineraryTimelineProps = {
  itinerary?: EnrichedItinerary;
};

const getIconForActivity = (activityTitle: string) => {
    const lowerCaseActivity = activityTitle.toLowerCase();
    if (lowerCaseActivity.includes('lunch') || lowerCaseActivity.includes('dinner') || lowerCaseActivity.includes('breakfast') || lowerCaseActivity.includes('food') || lowerCaseActivity.includes('cuisine') || lowerCaseActivity.includes('restaurant')) {
      return <Utensils className="h-5 w-5 text-primary" />;
    }
    if (lowerCaseActivity.includes('check-in') || lowerCaseActivity.includes('hotel') || lowerCaseActivity.includes('check in') || lowerCaseActivity.includes('accommodation')) {
      return <Bed className="h-5 w-5 text-primary" />;
    }
    if (lowerCaseActivity.includes('explore') || lowerCaseActivity.includes('walk') || lowerCaseActivity.includes('tour') || lowerCaseActivity.includes('stroll')) {
      return <Footprints className="h-5 w-5 text-primary" />;
    }
    if (lowerCaseActivity.includes('museum') || lowerCaseActivity.includes('landmark') || lowerCaseActivity.includes('castle') || lowerCaseActivity.includes('palace') || lowerCaseActivity.includes('temple')) {
      return <Building className="h-5 w-5 text-primary" />;
    }
    if (lowerCaseActivity.includes('hike') || lowerCaseActivity.includes('mountain') || lowerCaseActivity.includes('nature')) {
      return <Mountain className="h-5 w-5 text-primary" />;
    }
    if (lowerCaseActivity.includes('beach') || lowerCaseActivity.includes('relax') || lowerCaseActivity.includes('leisure')) {
        return <Sun className="h-5 w-5 text-primary" />;
    }
    if (lowerCaseActivity.includes('boat') || lowerCaseActivity.includes('cruise') || lowerCaseActivity.includes('ferry')) {
        return <Ship className="h-5 w-5 text-primary" />;
    }
    return <CircleCheck className="h-5 w-5 text-primary" />;
};


const ActivityCard: React.FC<{ activity: EnrichedActivity; isLast: boolean }> = ({ activity, isLast }) => {
  return (
    <div className="relative pl-10">
      {/* Icon and Timeline */}
      <div className="absolute left-0 top-0 flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
          {getIconForActivity(activity.title)}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-border mt-2"></div>}
      </div>

      <div className='pb-10 ml-4'>
        <h4 className="font-semibold text-lg font-headline">{activity.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
        {activity.link && (
            <Link href={activity.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline mt-3 font-medium">
                Find out more
                <LinkIcon className="ml-1.5 h-3.5 w-3.5" />
            </Link>
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
    <div className="space-y-8">
      {itinerary.days.map((day, index) => (
        <div key={index}>
           <h3 className="font-headline text-2xl font-bold mb-4">Day {day.day}: {day.title}</h3>
            <div className="space-y-2">
              {day.activities.map((activity, actIndex) => (
                <ActivityCard key={actIndex} activity={activity} isLast={actIndex === day.activities.length - 1} />
              ))}
            </div>
        </div>
      ))}
    </div>
  );
};

export default ItineraryTimeline;
