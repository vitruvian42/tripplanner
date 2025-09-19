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

const ItineraryOutputSchema = z.object({
  days: z.array(EnrichedDaySchema),
  hotel: HotelSchema.optional(),
});
export type ItineraryOutput = z.infer<typeof ItineraryOutputSchema>;


export async function generateItinerary(input: ItineraryInput): Promise<ItineraryOutput> {
  return itineraryFlow(input);
}

const itineraryPrompt = ai.definePrompt({
  name: 'itineraryPrompt',
  input: {schema: ItineraryInputSchema},
  output: {schema: ItineraryOutputSchema}, // Use the new structured schema
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an AI travel assistant. Generate a detailed trip itinerary based on the following information:

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
  description: string;
  imageUrl?: string;
  location: Location;
}

interface EnrichedActivity {
  title: string;
  description: string;
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

interface EnrichedItinerary {
  days: EnrichedDay[];
  hotel?: Hotel; // Best hotel suggestion for the trip
}

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
