
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {}

export interface Collaborator {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
}

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

interface SplitDetail {
  uid: string;
  name: string;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: {
    uid: string;
    name: string;
  };
  currency: string;
  createdAt: string; // ISO string
  split: {
    type: 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE';
    splitBetween: SplitDetail[];
  };
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
  collaborators: string[]; // Array of user UIDs
  createdAt: Timestamp;
  imageId?: string;
  enrichedItinerary?: EnrichedItinerary; 
  expenses?: Expense[];
}
