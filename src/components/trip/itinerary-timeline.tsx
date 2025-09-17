
'use client';

import React from 'react';
import type { EnrichedItinerary, EnrichedActivity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck, Link as LinkIcon, Building, Utensils, Bed, Footprints, Mountain, Ship, Sun } from 'lucide-react';
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
        <div className="absolute left-[-11px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {getIconForActivity(activity.title)}
        </div>
        <h4 className="font-semibold text-lg">{activity.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
        {activity.link && (
            <Link href={activity.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline mt-3">
                <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                Find out more
            </Link>
        )}
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
        <Card key={index} className="overflow-hidden shadow-sm border-l-4 border-primary/80 bg-card">
           <CardHeader>
              <CardTitle className="font-headline text-2xl">Day {day.day}: {day.title}</CardTitle>
           </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="relative border-l-2 border-dashed border-border/80 space-y-8 ml-1 mt-4">
              {day.activities.map((activity, actIndex) => (
                <ActivityCard key={actIndex} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ItineraryTimeline;
