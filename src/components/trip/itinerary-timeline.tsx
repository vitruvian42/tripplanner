
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck, Milestone, Utensils, Bed, Footprints } from 'lucide-react';
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
  if (lowerCaseActivity.includes('check-in') || lowerCaseActivity.includes('hotel') || lowerCaseActivity.includes('check in')) {
    return <Bed className="h-4 w-4" />;
  }
    if (lowerCaseActivity.includes('arrive') || lowerCaseActivity.includes('depart') || lowerCaseActivity.includes('flight')) {
    return <Milestone className="h-4 w-4" />;
  }
  if (lowerCaseActivity.includes('explore') || lowerCaseActivity.includes('walk') || lowerCaseActivity.includes('tour')) {
    return <Footprints className="h-4 w-4" />;
  }
  return <CircleCheck className="h-4 w-4" />;
};

const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itinerary }) => {

  const parseItinerary = (text: string): ItineraryItem[] => {
    if (!text) return [];
    
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const days: ItineraryItem[] = [];
    let currentDay: ItineraryItem | null = null;

    lines.forEach(line => {
      const dayMatch = line.match(/^Day\s*\d+\s*:(.*)/i);
      if (dayMatch) {
        if (currentDay) {
          days.push(currentDay);
        }
        currentDay = {
          day: dayMatch[0].split(':')[0].trim(),
          title: dayMatch[1].trim(),
          activities: []
        };
      } else if (currentDay && (line.trim().startsWith('-') || line.trim().startsWith('*'))) {
        currentDay.activities.push(line.trim().substring(1).trim());
      } else if (currentDay && line.trim()) {
         // This handles activities that don't start with a bullet but are part of a day.
        currentDay.activities.push(line.trim());
      }
    });

    if (currentDay) {
      days.push(currentDay);
    }
    
    // Fallback for non-structured text
    if (days.length === 0 && lines.length > 0) {
        return [{
            day: 'Day 1',
            title: 'Your Itinerary',
            activities: lines
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
