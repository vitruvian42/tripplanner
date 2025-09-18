// src/components/trip/trip-overview-card.tsx
'use client';
import type { Trip } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bot, FileText, Hotel, Map, Users } from 'lucide-react';
import Link from 'next/link';

type TripOverviewCardProps = {
  trip: Trip;
};

export function TripOverviewCard({ trip }: TripOverviewCardProps) {
  const navItems = [
    { href: '#itinerary', label: 'Itinerary', icon: <FileText className="w-5 h-5"/> },
    { href: '#hotel', label: 'Hotel', icon: <Hotel className="w-5 h-5"/> },
    { href: '#map', label: 'Map', icon: <Map className="w-5 h-5"/> },
    { href: '#assistant', label: 'AI Assistant', icon: <Bot className="w-5 h-5"/> },
    { href: '#collaborators', label: 'Collaborators', icon: <Users className="w-5 h-5"/> },
  ];

  return (
    <div className="sticky top-24">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Trip Overview</CardTitle>
          <CardDescription>Quick navigation and trip tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <nav className="flex flex-col space-y-2">
            {navItems.map(item => (
                <Button key={item.label} variant="ghost" className="justify-start" asChild>
                    <Link href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                </Button>
            ))}
          </nav>
          <Button className="w-full" size="lg">Share Trip</Button>
        </CardContent>
      </Card>
    </div>
  );
}
