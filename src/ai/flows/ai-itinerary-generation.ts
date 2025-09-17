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

const ItineraryOutputSchema = z.object({
  itinerary: z.string().describe('A detailed trip itinerary including points of interest and recommendations.'),
});
export type ItineraryOutput = z.infer<typeof ItineraryOutputSchema>;


export async function generateItinerary(input: ItineraryInput): Promise<ItineraryOutput> {
  return itineraryFlow(input);
}

const itineraryPrompt = ai.definePrompt({
  name: 'itineraryPrompt',
  input: {schema: ItineraryInputSchema},
  output: {schema: ItineraryOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an AI travel assistant. Generate a detailed trip itinerary based on the following information:

Destination: {{{destination}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Interests: {{{interests}}}
Budget: {{{budget}}}

Include points of interest, activity recommendations, and estimated costs.

Format the output as a well-structured itinerary.`, // Ensure this is a single string
});

const itineraryFlow = ai.defineFlow(
  {
    name: 'itineraryFlow',
    inputSchema: ItineraryInputSchema,
    outputSchema: ItineraryOutputSchema,
  },
  async input => {
    const {output} = await itineraryPrompt(input);
    return output!;
  }
);
