// This is a server-side file.
'use server';

/**
 * @fileOverview Progressive AI-powered travel itinerary generation with parallel agents.
 * 
 * This file defines a progressive generation flow that:
 * 1. Generates a quick summary within 2 seconds
 * 2. Then progressively generates days, hotel, and flights in parallel
 * 3. Updates can be streamed to the client as they complete
 *
 * @module src/ai/flows/ai-itinerary-generation-progressive
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { ItineraryInput, ItineraryOutput } from './ai-itinerary-generation';

// Quick summary schema for fast initial response
const QuickSummarySchema = z.object({
  destination: z.string(),
  overview: z.string().describe('A brief 2-3 sentence overview of the trip'),
  dayCount: z.number().describe('Number of days for the trip'),
  highlights: z.array(z.string()).describe('3-5 key highlights or must-see places'),
  estimatedBudget: z.string().optional(),
});

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
  type: z.enum(['roundTrip', 'internal']),
  route: z.string(),
  description: z.string(),
  estimatedCost: z.string().optional(),
  bestTimeToBook: z.string().optional(),
  airlines: z.array(z.string()).optional(),
});

const ItineraryOutputSchema = z.object({
  days: z.array(EnrichedDaySchema),
  hotel: HotelSchema.optional(),
  flights: z.array(FlightRecommendationSchema).optional(),
});

const DaysInputSchema = z.object({
  startingPoint: z.string(),
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  interests: z.string(),
  budget: z.string(),
  dayCount: z.number(),
});

const HotelInputSchema = z.object({
  destination: z.string(),
  budget: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

const FlightsInputSchema = z.object({
  startingPoint: z.string(),
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.string(),
});

// Helper function to calculate days between dates
function calculateDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
}

// Quick summary prompt - optimized for speed (target: 2 seconds)
const quickSummaryPrompt = ai.definePrompt({
  name: 'quickSummaryPrompt',
  input: {schema: z.object({
    startingPoint: z.string(),
    destination: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    interests: z.string(),
    budget: z.string(),
  })},
  output: {schema: QuickSummarySchema},
  model: googleAI.model('gemini-2.5-flash'),
  config: {
    maxOutputTokens: 400, // Increased slightly for reliability
    temperature: 0.5, // Lower temperature for more consistent JSON output
  },
  prompt: `You are a travel assistant. Generate a brief trip summary in valid JSON format.

Trip Details:
- Starting Point: {{{startingPoint}}}
- Destination: {{{destination}}}
- Start Date: {{{startDate}}}
- End Date: {{{endDate}}}
- Interests: {{{interests}}}
- Budget: {{{budget}}}

IMPORTANT: You MUST return a valid JSON object matching this exact structure:
{
  "destination": "the destination name",
  "overview": "A brief 2-3 sentence overview of what makes this trip special",
  "dayCount": <calculate the number of days between startDate and endDate, including both dates>,
  "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"],
  "estimatedBudget": "an estimate based on the budget level (optional)"
}

Requirements:
- Return ONLY valid JSON, no markdown, no code blocks
- overview must be exactly 2-3 sentences
- highlights must be an array of exactly 4 strings
- dayCount must be a number (calculate days between {{{startDate}}} and {{{endDate}}})
- Be concise but informative`,
});

// Days generation prompt - generates full itinerary days
const daysPrompt = ai.definePrompt({
  name: 'daysPrompt',
  input: {schema: DaysInputSchema},
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

// Hotel generation prompt
const hotelPrompt = ai.definePrompt({
  name: 'hotelPrompt',
  input: {schema: HotelInputSchema},
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

// Flights generation prompt
const flightsPrompt = ai.definePrompt({
  name: 'flightsPrompt',
  input: {schema: FlightsInputSchema},
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

/**
 * Generate itinerary progressively
 * Returns a summary quickly, then progressively completes the full itinerary
 */
export async function generateItineraryProgressive(input: ItineraryInput): Promise<{
  summary: z.infer<typeof QuickSummarySchema>;
  fullItinerary?: ItineraryOutput;
}> {
  // Calculate dayCount programmatically for reliability
  const dayCount = calculateDayCount(input.startDate, input.endDate);
  
  // Create summary immediately without AI call for speed
  // We'll skip the quick summary AI call since it's not reliable and we don't need it
  const summary: z.infer<typeof QuickSummarySchema> = {
    destination: input.destination,
    overview: `An exciting ${dayCount}-day journey from ${input.startingPoint} to ${input.destination}. This trip will include ${input.interests} activities and experiences tailored to your ${input.budget} budget.`,
    dayCount: dayCount,
    highlights: [
      `Explore the vibrant culture of ${input.destination}`,
      `Experience local ${input.interests}`,
      'Discover hidden gems and local favorites',
      'Create unforgettable memories',
    ],
    estimatedBudget: input.budget,
  };

  // Generate days, hotel, and flights in parallel (this is where the real work happens)
  const [daysResult, hotelResult, flightsResult] = await Promise.all([
    daysPrompt({
      ...input,
      dayCount: summary.dayCount,
    }),
    hotelPrompt({
      destination: input.destination,
      budget: input.budget,
      startDate: input.startDate,
      endDate: input.endDate,
    }),
    flightsPrompt({
      startingPoint: input.startingPoint,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
    }),
  ]);

  // Combine results into full itinerary
  const fullItinerary: ItineraryOutput = {
    days: daysResult.output!.days,
    hotel: hotelResult.output!.hotel,
    flights: flightsResult.output!.flights,
  };

  return {
    summary,
    fullItinerary,
  };
}

/**
 * Generate full itinerary (for backward compatibility)
 */
export async function generateItineraryFull(input: ItineraryInput): Promise<ItineraryOutput> {
  const result = await generateItineraryProgressive(input);
  return result.fullItinerary!;
}

