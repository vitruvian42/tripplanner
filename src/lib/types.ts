
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {}

export interface Collaborator {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Hotel {
  name: string;
  description: string;
  imageUrl?: string;
  location: Location;
}

export interface EnrichedActivity {
  title: string;
  description: string;
  link?: string;
  imageUrl?: string; // New: URL for an image related to the activity
  location?: Location; // New: Precise location data
  keynotes?: string[]; // New: Key notes about the place
  waysToReach?: string[]; // New: How to reach the place
  thingsToDo?: string[]; // New: Things to do at the place
}

export interface EnrichedDay {
  day: number;
  title: string;
  activities: EnrichedActivity[];
}

export interface EnrichedItinerary {
  days: EnrichedDay[];
  hotel?: Hotel; // New: Best hotel suggestion for the trip
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
  createdAt: string; // ISO string
  imageId?: string;
  enrichedItinerary?: EnrichedItinerary; 
  expenses?: Expense[];
}

export interface FirestoreTrip extends Omit<Trip, 'id' | 'createdAt'> {
    createdAt: Timestamp;
}
