
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
    <div className="flex items-start gap-3">
        <div className="shrink-0 pt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-1.5">{label}</p>
            <div className="text-muted-foreground text-sm sm:text-base leading-relaxed">{value}</div>
        </div>
    </div>
);


export function TripHighlights({ trip }: TripHighlightsProps) {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const duration = differenceInDays(endDate, startDate) + 1;
    
  return (
    <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-headline mb-2">{trip.destination}</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            <ClientOnly>A {duration}-day adventure</ClientOnly>
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 p-5 sm:p-6 border rounded-xl bg-card">
             <HighlightItem 
                icon={<Calendar className="w-5 h-5 text-primary"/>}
                label="Dates"
                value={<ClientOnly><span>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</span></ClientOnly>}
             />
             <HighlightItem 
                icon={<Wallet className="w-5 h-5 text-primary"/>}
                label="Budget"
                value={<span className="capitalize">{trip.budget}</span>}
             />
             <HighlightItem 
                icon={<Tag className="w-5 h-5 text-primary"/>}
                label="Interests"
                value={<span>{trip.interests}</span>}
             />
              <HighlightItem 
                icon={<Users className="w-5 h-5 text-primary"/>}
                label="Planners"
                value={
                  <TooltipProvider>
                    <div className="flex items-center -space-x-2 flex-wrap gap-2">
                        {trip.collaborators.map((c) => (
                            <Tooltip key={c.uid}>
                                <TooltipTrigger asChild>
                                    <div className="cursor-pointer">
                                        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-background">
                                            <AvatarImage src={c.photoURL || undefined} />
                                            <AvatarFallback className="text-xs">{c.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </div>
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
