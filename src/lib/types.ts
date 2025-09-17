import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  interests: string;
  budget: string;
  itinerary: string;
  ownerId: string;
  collaborators: string[];
  createdAt: Timestamp;
  imageUrl?: string;
  imageHint?: string;
}
