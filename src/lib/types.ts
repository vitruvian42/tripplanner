import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {}

export interface EnrichedActivity {
  title: string;
  description: string;
  link?: string;
}

export interface EnrichedDay {
  day: number;
  title: string;
  activities: EnrichedActivity[];
}

export interface EnrichedItinerary {
  days: EnrichedDay[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: {
    uid: string;
    displayName: string;
  };
  currency: string;
  createdAt: string; // ISO string
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
  // This is now stored in Firestore but may be missing from old documents.
  enrichedItinerary?: EnrichedItinerary; 
  expenses?: Expense[];
}
