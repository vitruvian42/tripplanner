
// src/components/trip/trip-highlights.tsx
'use client';

import { Calendar, Tag, Users, Wallet } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ClientOnly } from '../ui/client-only';
import type { Collaborator } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type TripHighlightsProps = {
  trip: {
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    interests: string;
    collaborators: Collaborator[];
  };
};

const HighlightItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="text-primary mt-1">{icon}</div>
        <div>
            <p className="font-semibold text-foreground">{label}</p>
            <div className="text-muted-foreground">{value}</div>
        </div>
    </div>
);


export function TripHighlights({ trip }: TripHighlightsProps) {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const duration = differenceInDays(endDate, startDate) + 1;
    
  return (
    <div>
        <h1 className="text-4xl font-bold font-headline mb-2">{trip.destination}</h1>
        <p className="text-lg text-muted-foreground mb-6">A {duration}-day adventure</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border rounded-xl">
             <HighlightItem 
                icon={<Calendar className="w-6 h-6"/>}
                label="Dates"
                value={<ClientOnly>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</ClientOnly>}
             />
             <HighlightItem 
                icon={<Wallet className="w-6 h-6"/>}
                label="Budget"
                value={<span className="capitalize">{trip.budget}</span>}
             />
             <HighlightItem 
                icon={<Tag className="w-6 h-6"/>}
                label="Interests"
                value={trip.interests}
             />
              <HighlightItem 
                icon={<Users className="w-6 h-6"/>}
                label="Planners"
                value={
                  <TooltipProvider>
                    <div className="flex items-center -space-x-2">
                        {trip.collaborators.map(c => (
                            <Tooltip key={c.uid}>
                                <TooltipTrigger>
                                     <Avatar className="w-8 h-8 border-2 border-background">
                                        <AvatarImage src={c.photoURL || undefined} />
                                        <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{c.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                  </TooltipProvider>
                }
             />
        </div>
    </div>
  );
}
