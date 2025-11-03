
'use server';

import { generateItinerary } from '@/ai/flows/ai-itinerary-generation';
import { generateItineraryFull } from '@/ai/flows/ai-itinerary-generation-progressive';

import { revalidatePath } from 'next/cache';
import { placeholderImages } from '@/lib/placeholder-images';
import { randomUUID } from 'crypto';
import type { Expense, Trip, Booking, FlightBooking, HotelBooking, ActivityBooking } from '@/lib/types';
import { sendTripInviteEmail, sendWelcomeEmail } from '@/lib/email';
import { getFirebaseAdmin } from '@/lib/firebase-admin'; // Added this line
import { FieldValue } from 'firebase-admin/firestore';

// NOTE: We are now using the Firebase Admin SDK for all Firestore operations.
// We no longer import from 'firebase/firestore'.

interface CreateTripParams {
  tripData: {
    startingPoint: string;
    destination: string;
    startDate: string;
    endDate: string;
    interests: string;
    budget: string;
  };
  userId: string;
}

export async function createTripAction({ tripData, userId }: CreateTripParams): Promise<{ success: boolean; tripId?: string; error?: string; }> {
  console.log('[ACTION] Starting createTripAction for user:', userId);
  
  let db, auth;
  try {
    const admin = getFirebaseAdmin();
    db = admin.db;
    auth = admin.auth;
    console.log('[ACTION] Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('[ACTION] Failed to initialize Firebase Admin:', error);
    console.error('[ACTION] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return { 
      success: false, 
      error: `Firebase initialization failed: ${error.message}. Please check your server configuration.` 
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('[ACTION] ERROR: GEMINI_API_KEY is not set.');
    return { success: false, error: 'The AI service is not configured. Please set the GEMINI_API_KEY in your environment variables.' };
  }

  try {
    // 1. Select a placeholder image
    const destinationHash = tripData.destination
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = destinationHash % placeholderImages.length;
    const selectedImage = placeholderImages[imageIndex];
    
    // 2. Save trip to Firestore immediately (without itinerary)
    // The itinerary will be generated asynchronously in the background
    console.log('[ACTION] Creating trip document immediately...');
    const tripPayload = {
      ...tripData,
      itinerary: '', // Will be populated when itinerary is generated
      ownerId: userId,
      collaborators: [userId],
      createdAt: FieldValue.serverTimestamp(),
      imageId: selectedImage.id,
      expenses: [],
      // enrichedItinerary will be added when generated
    };

    console.log('[ACTION] Trip payload before save:', {
      ownerId: tripPayload.ownerId,
      ownerIdType: typeof tripPayload.ownerId,
      collaborators: tripPayload.collaborators,
      collaboratorsType: Array.isArray(tripPayload.collaborators) ? 'array' : typeof tripPayload.collaborators,
      userId: userId,
      userIdType: typeof userId,
    });

    const docRef = await db.collection('trips').add(tripPayload);
    console.log('[ACTION] Successfully saved trip to Firestore with ID:', docRef.id);
    const tripId = docRef.id;

    // 3. Generate itinerary asynchronously in the background (don't await)
    // This allows us to return the trip ID immediately while generation happens
    console.log('[ACTION] Starting async itinerary generation for trip:', tripId);
    generateItineraryAsync(tripId, tripData).catch((error) => {
      console.error('[ACTION] Error generating itinerary for trip', tripId, ':', error);
      // Optionally update trip with error status or retry logic
    });

    // 4. Revalidate dashboard path to show new trip
    revalidatePath('/dashboard');

    // Return immediately - user can navigate to trip page while itinerary generates
    return { success: true, tripId };
  } catch (error: any) {
    console.error('!!!!!!!! [ACTION] ERROR in createTripAction !!!!!!!!!!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    return { success: false, error: error.message || 'An unknown error occurred during trip creation.' };
  }
}

/**
 * Generate itinerary asynchronously and update the trip document
 * This runs in the background after trip creation
 */
async function generateItineraryAsync(
  tripId: string,
  tripData: CreateTripParams['tripData']
): Promise<void> {
  // Initialize Firebase Admin at the start of the async function
  // This ensures it's initialized in the async context, not just the calling context
  let db;
  try {
    const admin = getFirebaseAdmin();
    db = admin.db;
  } catch (error: any) {
    console.error('[ASYNC] Failed to initialize Firebase Admin:', error);
    throw new Error(`Failed to initialize Firebase Admin in async function: ${error.message}`);
  }
  
  try {
    console.log('[ASYNC] Starting progressive itinerary generation for trip:', tripId);
    const tripRef = db.collection('trips').doc(tripId);
    
    // Import the AI module to access prompts directly
    const { ai } = await import('@/ai/genkit');
    const { googleAI } = await import('@genkit-ai/googleai');
    const { z } = await import('genkit');
    
    // Calculate dayCount
    const dayCount = Math.ceil(
      (new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    // Initialize partial itinerary structure
    let partialItinerary: any = {
      days: [],
      flights: [],
    };
    
    // Initialize empty structure in Firestore (this triggers UI update)
    await tripRef.update({ enrichedItinerary: partialItinerary });
    console.log('[ASYNC] Initialized empty itinerary structure');
    
    // Define schemas inline (matching the progressive file)
    const LocationSchema = z.object({
      lat: z.number(),
      lng: z.number(),
      address: z.string(),
    });
    
    const EnrichedActivitySchema = z.object({
      title: z.string(),
      description: z.string(),
      link: z.string().optional(),
      imageUrl: z.string().optional(),
      location: LocationSchema.optional(),
      keynotes: z.array(z.string()).optional(),
      waysToReach: z.array(z.string()).optional(),
      thingsToDo: z.array(z.string()).optional(),
    });
    
    const EnrichedDaySchema = z.object({
      day: z.number(),
      title: z.string(),
      activities: z.array(EnrichedActivitySchema),
    });
    
    const HotelSchema = z.object({
      name: z.string(),
      description: z.string(),
      imageUrl: z.string().optional(),
      location: LocationSchema,
    });
    
    const FlightRecommendationSchema = z.object({
      type: z.enum(['roundTrip', 'internal']),
      route: z.string(),
      description: z.string(),
      estimatedCost: z.string().optional(),
      bestTimeToBook: z.string().optional(),
      airlines: z.array(z.string()).optional(),
    });
    
    // Create prompts inline
    const daysPrompt = ai.definePrompt({
      name: 'daysPromptIncremental',
      input: {schema: z.object({
        startingPoint: z.string(),
        destination: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        interests: z.string(),
        budget: z.string(),
        dayCount: z.number(),
      })},
      output: {schema: z.object({days: z.array(EnrichedDaySchema)})},
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Generate a detailed day-by-day itinerary. 

Starting Point: {{{startingPoint}}}
Destination: {{{destination}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Interests: {{{interests}}}
Budget: {{{budget}}}
Day Count: {{{dayCount}}}

For each day, provide:
- day: day number (1, 2, 3, etc.)
- title: brief title for the day
- activities: array of activities with:
  - title: activity name
  - description: detailed description
  - link: optional URL
  - imageUrl: optional real image URL (if available)
  - location: {lat, lng, address} if available
  - keynotes: optional array of key points
  - waysToReach: optional array of transportation options
  - thingsToDo: optional array of specific things to do

Generate exactly {{{dayCount}}} days. Make it comprehensive and detailed.`,
    });
    
    const hotelPrompt = ai.definePrompt({
      name: 'hotelPromptIncremental',
      input: {schema: z.object({
        destination: z.string(),
        budget: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })},
      output: {schema: z.object({hotel: HotelSchema.optional()})},
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Recommend the best hotel for this trip.

Destination: {{{destination}}}
Budget: {{{budget}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}

Provide:
- name: hotel name
- description: detailed description
- imageUrl: real image URL if available (omit if not)
- location: {lat, lng, address}

Match the budget level (budget/moderate/luxury).`,
    });
    
    const flightsPrompt = ai.definePrompt({
      name: 'flightsPromptIncremental',
      input: {schema: z.object({
        startingPoint: z.string(),
        destination: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        budget: z.string(),
      })},
      output: {schema: z.object({flights: z.array(FlightRecommendationSchema)})},
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `Generate flight recommendations.

Starting Point: {{{startingPoint}}}
Destination: {{{destination}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Budget: {{{budget}}}

ALWAYS include:
1. A roundTrip flight from {{{startingPoint}}} to {{{destination}}} and back

Optionally include internal flights if the destination is large (e.g., India, USA, Europe) and internal flights would save significant time.

For each flight provide:
- type: 'roundTrip' or 'internal'
- route: description (e.g., "New York to Paris")
- description: detailed recommendations
- estimatedCost: cost range based on budget
- bestTimeToBook: when to book
- airlines: array of recommended airlines`,
    });
    
    // Generate all in parallel, but update Firestore as each completes
    const daysPromise = daysPrompt({
      startingPoint: tripData.startingPoint || tripData.destination,
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      interests: tripData.interests,
      budget: tripData.budget,
      dayCount,
    }).then(async (result) => {
      if (result.output?.days) {
        partialItinerary.days = result.output.days;
        await tripRef.update({ enrichedItinerary: partialItinerary });
        console.log('[ASYNC] ✅ Updated days in itinerary');
      }
      return result.output?.days;
    }).catch((error: any) => {
      console.error('[ASYNC] Error generating days:', error);
      return null;
    });
    
    const hotelPromise = hotelPrompt({
      destination: tripData.destination,
      budget: tripData.budget,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
    }).then(async (result) => {
      if (result.output?.hotel) {
        partialItinerary.hotel = result.output.hotel;
        await tripRef.update({ enrichedItinerary: partialItinerary });
        console.log('[ASYNC] ✅ Updated hotel in itinerary');
      }
      return result.output?.hotel;
    }).catch((error: any) => {
      console.error('[ASYNC] Error generating hotel:', error);
      return null;
    });
    
    const flightsPromise = flightsPrompt({
      startingPoint: tripData.startingPoint || tripData.destination,
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      budget: tripData.budget,
    }).then(async (result) => {
      if (result.output?.flights) {
        partialItinerary.flights = result.output.flights;
        await tripRef.update({ enrichedItinerary: partialItinerary });
        console.log('[ASYNC] ✅ Updated flights in itinerary');
      }
      return result.output?.flights;
    }).catch((error: any) => {
      console.error('[ASYNC] Error generating flights:', error);
      return null;
    });
    
    // Wait for all to complete
    await Promise.all([daysPromise, hotelPromise, flightsPromise]);
    
    // Final update with complete itinerary and JSON string for backward compatibility
    await tripRef.update({
      itinerary: JSON.stringify(partialItinerary),
    });
    
    console.log('[ASYNC] ✅ Successfully completed progressive itinerary generation for trip', tripId);
    
  } catch (error: any) {
    console.error('[ASYNC] Error generating itinerary for trip', tripId, ':', error);
    console.error('[ASYNC] Error name:', error?.name);
    console.error('[ASYNC] Error message:', error?.message);
    console.error('[ASYNC] Error stack:', error?.stack);
    // Could set an error status on the trip document here if needed
    // Don't throw - we want to fail gracefully without breaking the main flow
  }
}

interface AddExpenseParams {
    tripId: string;
    expenseData: Omit<Expense, 'id' | 'createdAt'>;
}

export async function addExpenseAction({ tripId, expenseData }: AddExpenseParams): Promise<{ success: boolean; error?: string; }> {
    let db;
    try {
        const admin = getFirebaseAdmin();
        db = admin.db;
    } catch (error: any) {
        console.error('[ACTION] Failed to initialize Firebase Admin:', error);
        return { success: false, error: `Firebase initialization failed: ${error.message}` };
    }
    
    try {
        const tripRef = db.collection('trips').doc(tripId); // Admin SDK syntax

        const newExpense: Expense = {
            id: randomUUID(),
            ...expenseData,
            createdAt: new Date().toISOString(),
        };

        await tripRef.update({ // Admin SDK syntax
            expenses: FieldValue.arrayUnion(newExpense) // Admin SDK syntax
        });

        revalidatePath(`/trips/${tripId}`);
        return { success: true };

    } catch (error: any) {
        console.error('Error adding expense:', error);
        return { success: false, error: 'Failed to add expense.' };
    }
}

export async function deleteTripAction(tripId: string): Promise<{ success: boolean; error?: string; }> {
  let db;
  try {
    const admin = getFirebaseAdmin();
    db = admin.db;
  } catch (error: any) {
    console.error('[ACTION] Failed to initialize Firebase Admin:', error);
    return { success: false, error: `Firebase initialization failed: ${error.message}` };
  }
  
  try {
    await db.collection('trips').doc(tripId).delete(); // Call the firestore function

    revalidatePath('/dashboard'); // Revalidate dashboard to remove the deleted trip
    revalidatePath(`/trips/${tripId}`); // Revalidate the specific trip page (will likely lead to notFound)

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    return { success: false, error: 'Failed to delete trip.' };
  }
}


interface ShareTripParams {
    tripId: string;
    trip: Trip;
    invitee: {
        name: string;
        email: string;
        mobile: string;
    };
}

export async function shareTripAction({ tripId, trip, invitee }: ShareTripParams): Promise<{ success: boolean; error?: string; }> {
    let db, auth;
    try {
        const admin = getFirebaseAdmin();
        db = admin.db;
        auth = admin.auth;
    } catch (error: any) {
        console.error('[ACTION] Failed to initialize Firebase Admin:', error);
        return { success: false, error: `Firebase initialization failed: ${error.message}` };
    }
    
    try {
        let inviteeId: string;
        let isNewUser = false;

        try {
            const userRecord = await auth.getUserByEmail(invitee.email);
            inviteeId = userRecord.uid;
            console.log(`[ACTION] Found existing user: ${inviteeId}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                isNewUser = true;
                console.log('[ACTION] User not found, creating placeholder user...');

                // Create user in Firebase Auth
                const newUserRecord = await auth.createUser({
                    email: invitee.email,
                    displayName: invitee.name,
                    phoneNumber: invitee.mobile,
                    emailVerified: false, // User will verify when they sign up properly
                    // A secure, random password for the placeholder account
                    password: `placeholder_${randomUUID()}`,
                });
                inviteeId = newUserRecord.uid;
                console.log(`[ACTION] Created new placeholder user: ${inviteeId}`);

                // Create user document in Firestore
                const userDocRef = db.collection('users').doc(inviteeId); // Admin SDK syntax
                await userDocRef.set({ // Admin SDK syntax
                    uid: inviteeId,
                    email: invitee.email,
                    displayName: invitee.name,
                    photoURL: null, // No photo yet
                });
                console.log(`[ACTION] Created Firestore document for new user.`);

            } else {
                throw error; // Rethrow other auth errors
            }
        }

        // Add user to the trip's collaborators
        const tripRef = db.collection('trips').doc(tripId); // Admin SDK syntax
        await tripRef.update({ // Admin SDK syntax
            collaborators: FieldValue.arrayUnion(inviteeId) // Admin SDK syntax
        });
        console.log(`[ACTION] Added ${inviteeId} to trip collaborators.`);

        // Get trip owner info for notification
        const tripDoc = await tripRef.get();
        const tripData = tripDoc.data();
        const ownerDoc = await db.collection('users').doc(tripData?.ownerId).get();
        const ownerData = ownerDoc.data();
        const ownerName = ownerData?.displayName || ownerData?.email || 'Someone';

        // Create notification for the invitee
        const notificationsRef = db.collection('notifications');
        await notificationsRef.add({
            userId: inviteeId,
            type: 'trip_collaborator_added',
            title: 'You\'ve been added to a trip',
            message: `${ownerName} added you as a collaborator to the trip "${trip.destination}"`,
            tripId: tripId,
            tripName: trip.destination,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
        });
        console.log(`[ACTION] Created notification for user ${inviteeId}.`);

        // Send emails
        if (isNewUser) {
            await sendWelcomeEmail({ name: invitee.name, email: invitee.email });
        }
        await sendTripInviteEmail({
            name: invitee.name,
            email: invitee.email,
            trip: trip
        });
        
        revalidatePath(`/trips/${tripId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error sharing trip:', error);
        return { success: false, error: "Failed to share trip. " + error.message };
    }
}

interface BookTripParams {
    tripId: string;
    userId: string;
}

export async function bookTripAction({ tripId, userId }: BookTripParams): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    let db;
    try {
        const admin = getFirebaseAdmin();
        db = admin.db;
    } catch (error: any) {
        console.error('[ACTION] Failed to initialize Firebase Admin:', error);
        return { success: false, error: `Firebase initialization failed: ${error.message}` };
    }
    
    try {
        console.log('[ACTION] Starting bookTripAction for trip:', tripId, 'user:', userId);
        
        // Get trip data
        const tripDoc = await db.collection('trips').doc(tripId).get();
        if (!tripDoc.exists) {
            return { success: false, error: 'Trip not found.' };
        }
        
        const tripData = tripDoc.data() as Trip;
        if (!tripData.enrichedItinerary) {
            return { success: false, error: 'Trip itinerary not available for booking.' };
        }
        
        const enrichedItinerary = tripData.enrichedItinerary;
        
        // Generate mock bookings
        const flights: FlightBooking[] = [];
        if (enrichedItinerary.flights && enrichedItinerary.flights.length > 0) {
            enrichedItinerary.flights.forEach((flight, index) => {
                const bookingNumber = `FL${Date.now()}${index}`;
                const confirmationCode = `${flight.type === 'roundTrip' ? 'RT' : 'INT'}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                
                flights.push({
                    id: randomUUID(),
                    type: flight.type,
                    route: flight.route,
                    description: flight.description,
                    bookingNumber,
                    airline: flight.airlines?.[0] || 'Selected Airline',
                    confirmationCode,
                    departureDate: flight.type === 'roundTrip' ? tripData.startDate : undefined,
                    returnDate: flight.type === 'roundTrip' ? tripData.endDate : undefined,
                    howToUse: `1. Present this confirmation code at the airline check-in counter\n2. Show valid ID matching the booking name\n3. Check in online 24 hours before departure using the booking number\n4. Arrive at the airport at least 2 hours before international flights\n5. Contact the airline directly for any changes or cancellations`
                });
            });
        }
        
        let hotel: HotelBooking | undefined;
        if (enrichedItinerary.hotel) {
            const bookingNumber = `HT${Date.now()}`;
            const confirmationCode = `HTL${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            
            hotel = {
                id: randomUUID(),
                name: enrichedItinerary.hotel.name,
                description: enrichedItinerary.hotel.description,
                location: enrichedItinerary.hotel.location,
                bookingNumber,
                confirmationCode,
                checkIn: tripData.startDate,
                checkOut: tripData.endDate,
                address: enrichedItinerary.hotel.location.address,
                howToUse: `1. Present this confirmation code at hotel reception during check-in\n2. Valid ID required matching the booking name\n3. Check-in time: 3:00 PM | Check-out time: 11:00 AM\n4. Contact the hotel directly for early check-in or late check-out requests\n5. Keep this voucher safe until check-out`
            };
        }
        
        const activities: ActivityBooking[] = [];
        enrichedItinerary.days.forEach((day, dayIndex) => {
            day.activities.forEach((activity, actIndex) => {
                const bookingNumber = `ACT${Date.now()}${dayIndex}${actIndex}`;
                const confirmationCode = `ACT${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                
                const activityBooking: ActivityBooking = {
                    id: randomUUID(),
                    title: activity.title,
                    description: activity.description,
                    activityDate: tripData.startDate, // Could be enhanced to calculate based on day number
                    bookingNumber,
                    confirmationCode,
                    howToUse: `1. Present this confirmation code at the activity venue\n2. Show valid ID matching the booking name\n3. Arrive 15 minutes before the scheduled activity time\n4. Contact the activity provider directly for rescheduling or cancellations\n5. Keep this voucher safe until the activity is completed`
                };
                
                // Only add location if it exists (not undefined)
                if (activity.location) {
                    activityBooking.location = activity.location;
                }
                
                activities.push(activityBooking);
            });
        });
        
        // Calculate total amount (mock calculation)
        const flightAmount = flights.length * 500; // Mock: $500 per flight
        const hotelAmount = hotel ? 1500 : 0; // Mock: $1500 for hotel
        const activityAmount = activities.length * 50; // Mock: $50 per activity
        const totalAmount = flightAmount + hotelAmount + activityAmount;
        
        // Helper function to remove undefined values recursively
        const removeUndefined = (obj: any): any => {
            if (obj === null || obj === undefined) {
                return null;
            }
            if (Array.isArray(obj)) {
                return obj.map(removeUndefined).filter(item => item !== undefined);
            }
            if (typeof obj === 'object') {
                const cleaned: any = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const value = removeUndefined(obj[key]);
                        if (value !== undefined) {
                            cleaned[key] = value;
                        }
                    }
                }
                return cleaned;
            }
            return obj;
        };

        // Create booking
        const booking: Omit<Booking, 'id' | 'bookingDate'> = {
            tripId,
            userId,
            totalAmount,
            currency: 'USD',
            status: 'confirmed',
            flights,
            hotel,
            activities
        };
        
        // Remove undefined values before saving to Firestore
        const cleanedBooking = removeUndefined(booking);
        
        // Save to Firestore
        const bookingRef = await db.collection('bookings').add({
            ...cleanedBooking,
            bookingDate: FieldValue.serverTimestamp()
        });
        
        console.log('[ACTION] Successfully created booking with ID:', bookingRef.id);
        
        // Update trip document to store bookingId reference
        // Only store bookingId if user is the trip owner
        if (tripData.ownerId === userId) {
            await db.collection('trips').doc(tripId).update({
                bookingId: bookingRef.id
            });
            console.log('[ACTION] Updated trip with bookingId:', bookingRef.id);
        }
        
        revalidatePath(`/trips/${tripId}`);
        revalidatePath(`/trips/${tripId}/booking/${bookingRef.id}`);
        
        return { success: true, bookingId: bookingRef.id };
    } catch (error: any) {
        console.error('[ACTION] Error booking trip:', error);
        return { success: false, error: error.message || 'Failed to create booking.' };
    }
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
    let db;
    try {
        const admin = getFirebaseAdmin();
        db = admin.db;
    } catch (error: any) {
        console.error('[ACTION] Failed to initialize Firebase Admin:', error);
        return null;
    }
    
    try {
        const bookingDoc = await db.collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists) {
            return null;
        }
        
        const data = bookingDoc.data();
        if (!data) {
            return null;
        }
        
        // Convert Firestore timestamp to ISO string
        const bookingDate = data.bookingDate?.toDate?.()?.toISOString() || data.bookingDate || new Date().toISOString();
        
        return {
            id: bookingDoc.id,
            ...data,
            bookingDate
        } as Booking;
    } catch (error: any) {
        console.error('Error getting booking:', error);
        return null;
    }
}

/**
 * Get booking by trip and user (server-side, bypasses security rules)
 */
export async function getBookingByTripAndUserAction(tripId: string, userId: string): Promise<Booking | null> {
    let db;
    try {
        const admin = getFirebaseAdmin();
        db = admin.db;
    } catch (error: any) {
        console.error('[ACTION] Failed to initialize Firebase Admin:', error);
        return null;
    }
    
    try {
        console.log('[ACTION] getBookingByTripAndUserAction called for tripId:', tripId, 'userId:', userId);
        
        // Query using Admin SDK (bypasses security rules)
        const bookingsRef = db.collection('bookings');
        const querySnapshot = await bookingsRef
            .where('tripId', '==', tripId)
            .where('userId', '==', userId)
            .limit(1)
            .get();
        
        if (querySnapshot.empty) {
            console.log('[ACTION] No booking found for tripId:', tripId, 'userId:', userId);
            return null;
        }
        
        const bookingDoc = querySnapshot.docs[0];
        const data = bookingDoc.data();
        
        // Convert Firestore timestamp to ISO string
        const bookingDate = data.bookingDate?.toDate?.()?.toISOString() || data.bookingDate || new Date().toISOString();
        
        const booking: Booking = {
            id: bookingDoc.id,
            ...data,
            bookingDate
        } as Booking;
        
        console.log('[ACTION] ✅ Found booking with ID:', booking.id);
        return booking;
    } catch (error: any) {
        console.error('[ACTION] Error getting booking:', error);
        return null;
    }
}
