import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {}

export interface EnrichedActivity {
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
}

export interface EnrichedDay {
  day: number;
  title: string;
  activities: EnrichedActivity[];
  imageUrl?: string;
}

export interface EnrichedItinerary {
  days: EnrichedDay[];
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  interests: string;
  budget: string;
  itinerary: string; // The raw AI-generated text
  ownerId: string;
  collaborators: string[];
  createdAt: Timestamp;
  imageId?: string;
  // This will be populated on the fly on the trip page
  enrichedItinerary?: EnrichedItinerary; 
  // DEPRECATED:
  imageUrl?: string;
  imageHint?: string;
}
