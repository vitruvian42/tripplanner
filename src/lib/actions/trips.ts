
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
  const { db, auth } = getFirebaseAdmin();

  console.log('[ACTION] Starting createTripAction for user:', userId);

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
  const { db } = getFirebaseAdmin();
  
  try {
    console.log('[ASYNC] Starting itinerary generation for trip:', tripId);
    
    // Generate itinerary using progressive flow
    const generatedEnrichedItinerary = await generateItineraryFull(tripData);
    
    console.log('[ASYNC] Successfully generated itinerary for trip:', tripId);
    
    // Update trip with generated itinerary
    const tripRef = db.collection('trips').doc(tripId);
    
    // Update with itinerary and potentially better image
    const updateData: any = {
      enrichedItinerary: generatedEnrichedItinerary,
      itinerary: JSON.stringify(generatedEnrichedItinerary), // Store as JSON string for backward compatibility
    };
    
    // Update image if we got a good one from the itinerary
    if (generatedEnrichedItinerary.hotel?.imageUrl || generatedEnrichedItinerary.days[0]?.activities[0]?.imageUrl) {
      // Keep existing imageId for now, we could update it if needed
    }
    
    await tripRef.update(updateData);
    
    console.log('[ASYNC] Successfully updated trip', tripId, 'with itinerary');
    
    // Note: revalidatePath cannot be called from async background functions
    // The trip page will automatically show updated data when user refreshes or navigates
    // Client-side navigation will handle cache updates
    
  } catch (error: any) {
    console.error('[ASYNC] Error generating itinerary for trip', tripId, ':', error);
    // Could set an error status on the trip document here if needed
    throw error;
  }
}

interface AddExpenseParams {
    tripId: string;
    expenseData: Omit<Expense, 'id' | 'createdAt'>;
}

export async function addExpenseAction({ tripId, expenseData }: AddExpenseParams): Promise<{ success: boolean; error?: string; }> {
    const { db } = getFirebaseAdmin();
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
  const { db } = getFirebaseAdmin();
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
    const { db, auth } = getFirebaseAdmin();
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
    const { db } = getFirebaseAdmin();
    
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
    const { db } = getFirebaseAdmin();
    
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
    const { db } = getFirebaseAdmin();
    
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
