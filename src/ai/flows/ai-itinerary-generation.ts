// This is a server-side file.
'use server';

/**
 * @fileOverview AI-powered travel itinerary generation.
 *
 * This file defines a Genkit flow that takes user inputs such as destination, dates, interests, and budget,
 * and generates a detailed trip itinerary with points of interest and recommendations.
 *
 * @module src/ai/flows/ai-itinerary-generation
 *
 * @exports generateItinerary - The main function to trigger the itinerary generation flow.
 * @exports ItineraryInput - The input type for the generateItinerary function.
 * @exports ItineraryOutput - The output type for the generateItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';


const ItineraryInputSchema = z.object({
  startingPoint: z.string().describe('The starting point or origin city for the trip.'),
  destination: z.string().describe('The destination for the trip.'),
  startDate: z.string().describe('The start date of the trip (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the trip (YYYY-MM-DD).'),
  interests: z.string().describe('A comma-separated list of interests e.g., history, food, nature.'),
  budget: z.string().describe('The budget for the trip (e.g., $1000, $5000, or budget, moderate, luxury).'),
});
export type ItineraryInput = z.infer<typeof ItineraryInputSchema>;

const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string(),
});

const HotelSchema = z.object({
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  location: LocationSchema,
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

const FlightRecommendationSchema = z.object({
  type: z.enum(['roundTrip', 'internal']).describe('Type of flight: roundTrip for origin-destination round trip, internal for flights within the destination country/region.'),
  route: z.string().describe('Flight route description (e.g., "New York to Paris" or "Paris to Nice").'),
  description: z.string().describe('Description and recommendations for this flight route.'),
  estimatedCost: z.string().optional().describe('Estimated cost range for the flight.'),
  bestTimeToBook: z.string().optional().describe('Best time to book this flight.'),
  airlines: z.array(z.string()).optional().describe('Recommended airlines for this route.'),
});

const ItineraryOutputSchema = z.object({
  days: z.array(EnrichedDaySchema),
  hotel: HotelSchema.optional(),
  flights: z.array(FlightRecommendationSchema).optional().describe('Flight recommendations including round trip from starting point to destination and internal flights if applicable.'),
});
export type ItineraryOutput = z.infer<typeof ItineraryOutputSchema>;


export async function generateItinerary(input: ItineraryInput): Promise<ItineraryOutput> {
  return itineraryFlow(input);
}

const itineraryPrompt = ai.definePrompt({
  name: 'itineraryPrompt',
  input: {schema: ItineraryInputSchema},
  output: {schema: ItineraryOutputSchema}, // Use the new structured schema
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are an AI travel assistant. Generate a detailed trip itinerary based on the following information:

Starting Point: {{{startingPoint}}}
Destination: {{{destination}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Interests: {{{interests}}}
Budget: {{{budget}}}

Generate the output as a JSON object that strictly conforms to the following TypeScript interface:

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface Hotel {
  name: string;
  description: string; // COMPREHENSIVE description (minimum 4-5 sentences) including features, amenities, location advantages, dining options, and why it's recommended
  imageUrl?: string;
  location: Location;
}

interface EnrichedActivity {
  title: string;
  description: string; // COMPREHENSIVE description (minimum 4-5 sentences) with rich details about the experience, practical information, timing, what to expect, and why it's recommended
  link?: string;
  imageUrl?: string; // URL for an image related to the activity
  location?: Location; // Precise location data (latitude, longitude, address)
  keynotes?: string[]; // Key notes about the place
  waysTo Reach?: string[]; // How to reach the place
  thingsToDo?: string[]; // Things to do at the place
}

interface EnrichedDay {
  day: number;
  title: string;
  activities: EnrichedActivity[];
}

interface FlightRecommendation {
  type: 'roundTrip' | 'internal'; // 'roundTrip' for origin-destination round trip, 'internal' for flights within destination
  route: string; // e.g., "New York to Paris" or "Paris to Nice"
  description: string; // COMPREHENSIVE description (minimum 4-5 sentences) including flight duration, airlines, airport info, booking tips, and what to expect
  estimatedCost?: string; // Estimated cost range
  bestTimeToBook?: string; // Best time to book this flight
  airlines?: string[]; // Recommended airlines for this route
}

interface EnrichedItinerary {
  days: EnrichedDay[];
  hotel?: Hotel; // Best hotel suggestion for the trip
  flights?: FlightRecommendation[]; // Flight recommendations including round trip and internal flights
}

IMPORTANT FLIGHT RECOMMENDATIONS:
1. Always include a round trip flight recommendation from the starting point ({{{startingPoint}}}) to the destination ({{{destination}}}) and back.
2. If the destination is a large country/region with multiple cities worth visiting (e.g., India, USA, Europe), suggest internal flights between major cities that would enhance the itinerary.
3. For internal flights, only suggest if they make sense for the itinerary and if the distance/time saved is significant (e.g., flights between major cities that are far apart by land/rail).
4. Provide practical recommendations including:
   - Route description
   - Estimated costs based on the budget level
   - Best time to book
   - Recommended airlines
   - Tips for getting the best deals

IMPORTANT: Write comprehensive descriptions for all activities, hotels, and flights:
- Activity descriptions: Minimum 4-5 sentences with rich details about what the experience entails, what to expect, practical information (timing, duration, what to bring/wear), why it's recommended, tips, and what makes it special.
- Hotel descriptions: Minimum 4-5 sentences covering features, amenities, room quality, location advantages, dining options, and why it's suitable for this budget.
- Flight descriptions: Minimum 4-5 sentences including flight duration, best airlines, airport information, layover considerations, booking tips, and what to expect.

Write as if you're a knowledgeable travel guide helping someone fully understand their trip. Be detailed, informative, and practical.

Ensure that for each activity, if you can find a real, publicly accessible image URL, provide it. Otherwise, omit the 'imageUrl' field. Provide precise latitude, longitude, and address. For the hotel, if you can find a real, publicly accessible image URL, provide it. Otherwise, omit the 'imageUrl' field. Also provide its name, description, and location.
`,
});

const itineraryFlow = ai.defineFlow(
  {
    name: 'itineraryFlow',
    inputSchema: ItineraryInputSchema,
    outputSchema: ItineraryOutputSchema,
  },
  async input => {
    const {output} = await itineraryPrompt(input);
    return output!; // The output is already structured JSON
  }
);
