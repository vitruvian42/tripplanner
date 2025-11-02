
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {}

export interface Collaborator {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
}

export interface TripPhoto {
  id: string;
  url: string;
  uploadedBy: {
    uid: string;
    name: string;
    photoURL?: string | null;
  };
  uploadedAt: string; // ISO string
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

export interface FlightRecommendation {
  type: 'roundTrip' | 'internal';
  route: string;
  description: string;
  estimatedCost?: string;
  bestTimeToBook?: string;
  airlines?: string[];
}

export interface EnrichedItinerary {
  days: EnrichedDay[];
  hotel?: Hotel; // New: Best hotel suggestion for the trip
  flights?: FlightRecommendation[]; // Flight recommendations including round trip and internal flights
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
  startingPoint?: string; // Starting point for the trip (optional for backward compatibility)
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
  photos?: TripPhoto[];
  bookingId?: string; // Reference to the booking document ID for the trip owner
}

export interface FirestoreTrip extends Omit<Trip, 'id' | 'createdAt'> {
    createdAt: Timestamp;
}

// Booking types
export interface FlightBooking {
  id: string;
  type: 'roundTrip' | 'internal';
  route: string;
  description: string;
  bookingNumber: string;
  airline?: string;
  confirmationCode: string;
  departureDate?: string;
  returnDate?: string;
  howToUse: string;
}

export interface HotelBooking {
  id: string;
  name: string;
  description: string;
  location: Location;
  bookingNumber: string;
  confirmationCode: string;
  checkIn: string;
  checkOut: string;
  address: string;
  howToUse: string;
}

export interface ActivityBooking {
  id: string;
  title: string;
  description: string;
  activityDate?: string;
  bookingNumber: string;
  confirmationCode: string;
  location?: Location;
  howToUse: string;
}

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  bookingDate: string; // ISO string
  totalAmount: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  flights: FlightBooking[];
  hotel?: HotelBooking;
  activities: ActivityBooking[];
}

export interface FirestoreBooking extends Omit<Booking, 'id' | 'bookingDate'> {
  bookingDate: Timestamp;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'trip_collaborator_added';
  title: string;
  message: string;
  tripId: string;
  tripName?: string; // Destination for quick reference
  read: boolean;
  createdAt: string; // ISO string
}

export interface FirestoreNotification extends Omit<Notification, 'id' | 'createdAt'> {
  createdAt: Timestamp;
}
