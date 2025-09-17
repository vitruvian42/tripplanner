
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck, Milestone, Utensils, Bed, Footprints, Mountain, Building, Ship, Sun } from 'lucide-react';
import React from 'react';

type ItineraryTimelineProps = {
  itinerary: string;
};

type ItineraryItem = {
  day: string;
  title: string;
  activities: string[];
};

const getIconForActivity = (activity: string) => {
  const lowerCaseActivity = activity.toLowerCase();
  if (lowerCaseActivity.includes('lunch') || lowerCaseActivity.includes('dinner') || lowerCaseActivity.includes('breakfast') || lowerCaseActivity.includes('food') || lowerCaseActivity.includes('cuisine') || lowerCaseActivity.includes('restaurant')) {
    return <Utensils className="h-4 w-4" />;
  }
  if (lowerCaseActivity.includes('check-in') || lowerCaseActivity.includes('hotel') || lowerCaseActivity.includes('check in') || lowerCaseActivity.includes('accommodation')) {
    return <Bed className="h-4 w-4" />;
  }
  if (lowerCaseActivity.includes('arrive') || lowerCaseActivity.includes('depart') || lowerCaseActivity.includes('flight')) {
    return <Milestone className="h-4 w-4" />;
  }
  if (lowerCaseActivity.includes('explore') || lowerCaseActivity.includes('walk') || lowerCaseActivity.includes('tour') || lowerCaseActivity.includes('stroll')) {
    return <Footprints className="h-4 w-4" />;
  }
  if (lowerCaseActivity.includes('museum') || lowerCaseActivity.includes('landmark') || lowerCaseActivity.includes('castle') || lowerCaseActivity.includes('palace')) {
    return <Building className="h-4 w-4" />;
  }
  if (lowerCaseActivity.includes('hike') || lowerCaseActivity.includes('mountain') || lowerCaseActivity.includes('nature')) {
    return <Mountain className="h-4 w-4" />;
  }
  if (lowerCaseActivity.includes('beach') || lowerCaseActivity.includes('relax') || lowerCaseActivity.includes('leisure')) {
      return <Sun className="h-4 w-4" />;
  }
  if (lowerCaseActivity.includes('boat') || lowerCaseActivity.includes('cruise') || lowerCaseActivity.includes('ferry')) {
      return <Ship className="h-4 w-4" />;
  }
  return <CircleCheck className="h-4 w-4" />;
};

const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itinerary }) => {
  const parseItinerary = (text: string): ItineraryItem[] => {
    if (!text) return [];

    const lines = text.split('\n').filter(line => line.trim() !== '');
    const days: ItineraryItem[] = [];
    let currentDay: ItineraryItem | null = null;
    
    const dayRegex = /^Day\s*(\d+)\s*[:-]?\s*(.*)/i;

    for (const line of lines) {
      const dayMatch = line.match(dayRegex);
      if (dayMatch) {
        if (currentDay) {
          days.push(currentDay);
        }
        currentDay = {
          day: `Day ${dayMatch[1]}`,
          title: dayMatch[2].trim(),
          activities: [],
        };
      } else if (currentDay) {
          const activity = line.trim().replace(/^[-*]\s*/, '');
          if(activity) {
            currentDay.activities.push(activity);
          }
      }
    }

    if (currentDay) {
      days.push(currentDay);
    }
    
    // Fallback for unstructured text
    if (days.length === 0 && lines.length > 0) {
        return [{
            day: 'Your Itinerary',
            title: 'Trip Details',
            activities: lines.map(line => line.trim().replace(/^[-*]\s*/, ''))
        }];
    }

    return days;
  };


  const itineraryDays = parseItinerary(itinerary);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Your AI-Generated Itinerary</CardTitle>
            <CardDescription>A detailed timeline for your adventure.</CardDescription>
        </CardHeader>
        <CardContent>
            {itineraryDays.length > 0 ? (
                <div className="space-y-8">
                    {itineraryDays.map((item, index) => (
                        <div key={index} className="relative pl-8">
                            <div className="absolute left-0 top-0 flex h-full w-8 justify-center">
                                <div className="h-full w-px bg-border"></div>
                            </div>
                            <div className="absolute left-0 top-1.5 -translate-x-1/2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <span className="text-xs font-bold">{index + 1}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-headline text-lg font-semibold text-primary">{item.day}</h3>
                                <p className="font-medium text-foreground">{item.title}</p>
                            </div>
                            <ul className="mt-4 space-y-4">
                                {item.activities.map((activity, actIndex) => (
                                    <li key={actIndex} className="relative pl-6">
                                        <div className="absolute left-[-22px] top-[5px] flex items-center justify-center">
                                          <div className="h-4 w-4 rounded-full bg-secondary ring-4 ring-background"></div>
                                        </div>
                                         <div className="absolute left-[-22px] top-[5px] flex items-center justify-center text-muted-foreground">
                                          {getIconForActivity(activity)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{activity}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground">
                    <p>No detailed itinerary items found.</p>
                    <p className="text-sm">The itinerary might not be in a recognized format.</p>
                </div>
            )}
        </CardContent>
    </Card>
  );
};

export default ItineraryTimeline;
