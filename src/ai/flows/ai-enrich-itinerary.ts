// This is a server-side file.
'use server';

/**
 * @fileOverview Enriches a raw text itinerary with structured data, images, and links.
 *
 * This file defines a Genkit flow that takes a string-based itinerary and converts it
 * into a structured JSON object with details for each day and activity, suitable for
 * rendering a rich user interface.
 *
 * @exports enrichItinerary - The main function to trigger the itinerary enrichment flow.
 * @exports EnrichItineraryInput - The input type for the enrichItinerary function.
 * @exports EnrichItineraryOutput - The output type for the enrichItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Define the schema for a single enriched activity
const EnrichedActivitySchema = z.object({
  title: z.string().describe('The title of the activity (e.g., "Visit the War Remnants Museum").'),
  description: z.string().describe('A one or two-sentence, engaging description of the activity.'),
  imageUrl: z.string().optional().describe('A URL for a relevant, high-quality, publicly accessible image of the location or activity.'),
  link: z.string().optional().describe('A URL to an official website or a Google Maps link for the location.'),
});

// Define the schema for a single day in the itinerary
const EnrichedDaySchema = z.object({
  day: z.number().describe('The day number of the itinerary (e.g., 1, 2, 3).'),
  title: z.string().describe('A short, catchy title for the day (e.g., "Arrival in Ho Chi Minh City").'),
  activities: z.array(EnrichedActivitySchema).describe('A list of activities for the day.'),
  imageUrl: z.string().optional().describe('A general image URL representing the main theme or location for the day.'),
});

// Define the schema for the full enriched itinerary
const EnrichedItinerarySchema = z.object({
  days: z.array(EnrichedDaySchema).describe('An array of enriched day objects for the entire trip.'),
});

// Define the input and output types for the flow
const EnrichItineraryInputSchema = z.object({
  itinerary: z.string().describe('The raw text of the AI-generated itinerary.'),
});
export type EnrichItineraryInput = z.infer<typeof EnrichItineraryInputSchema>;

const EnrichItineraryOutputSchema = z.object({
  enrichedItinerary: EnrichedItinerarySchema,
});
export type EnrichItineraryOutput = z.infer<typeof EnrichItineraryOutputSchema>;

// Export the main function that will be called from the server component
export async function enrichItinerary(input: EnrichItineraryInput): Promise<EnrichedItineraryOutput> {
  return enrichItineraryFlow(input);
}

const enrichPrompt = ai.definePrompt({
  name: 'enrichItineraryPrompt',
  input: { schema: EnrichItineraryInputSchema },
  output: { schema: EnrichItineraryOutputSchema },
  model: googleAI.model('gemini-1.5-pro'), // Use a more powerful model for better JSON generation
  prompt: `You are a travel expert and a web researcher. Your task is to transform a raw text-based travel itinerary into a rich, structured JSON object.

For each day and each activity, you must provide engaging descriptions and find relevant, high-quality, publicly accessible URLs for images and links. Do not invent fake URLs.

Here is the raw itinerary:
---
{{{itinerary}}}
---

Please process this text and return it in the specified JSON format. Ensure every activity has a title and a description. Providing an imageUrl and a link is highly encouraged for a better user experience.`,
});

const enrichItineraryFlow = ai.defineFlow(
  {
    name: 'enrichItineraryFlow',
    inputSchema: EnrichItineraryInputSchema,
    outputSchema: EnrichItineraryOutputSchema,
  },
  async (input) => {
    console.log('[ENRICH FLOW] Starting enrichment for itinerary...');
    const { output } = await enrichPrompt(input);
    if (!output) {
      console.error('[ENRICH FLOW] Failed to get output from the prompt.');
      throw new Error('Failed to enrich itinerary.');
    }
    console.log('[ENRICH FLOW] Successfully enriched itinerary.');
    return output;
  }
);
