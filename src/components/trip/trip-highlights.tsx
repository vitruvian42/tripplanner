// src/components/trip/trip-highlights.tsx
'use client';

import { Calendar, Tag, Users, Wallet } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ClientOnly } from '../ui/client-only';

type TripHighlightsProps = {
  trip: {
    destination: string;
    startDate: string;
    endDate: string;
    budget: string;
    interests: string;
    collaborators: string[];
  };
};

const HighlightItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="text-primary mt-1">{icon}</div>
        <div>
            <p className="font-semibold text-foreground">{label}</p>
            <p className="text-muted-foreground">{value}</p>
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 border rounded-xl">
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
                value={`${trip.collaborators.length} person${trip.collaborators.length > 1 ? 's' : ''}`}
             />
        </div>
    </div>
  );
}
