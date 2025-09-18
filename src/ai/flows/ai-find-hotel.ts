// src/ai/flows/ai-find-hotel.ts
'use server';

/**
 * @fileOverview An AI agent that finds and suggests hotels based on trip details.
 *
 * - findHotelForTrip - The main function to trigger the hotel finding flow.
 * - FindHotelInput - The input type for the findHotelForTrip function.
 * - FindHotelOutput - The output type for the findHotelForTrip function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { findHotel } from '@/ai/tools/hotel-finder';

const FindHotelInputSchema = z.object({
  destination: z.string().describe('The destination city for the trip.'),
  budget: z.string().describe('The budget for the trip (e.g., "budget", "moderate", "luxury").'),
});
export type FindHotelInput = z.infer<typeof FindHotelInputSchema>;

const FindHotelOutputSchema = z.object({
  hotelName: z.string().describe('The name of the recommended hotel.'),
  hotelPrice: z.string().describe('The estimated price per night for the hotel.'),
  hotelDescription: z.string().describe('A brief description of the hotel.'),
});
export type FindHotelOutput = z.infer<typeof FindHotelOutputSchema>;

// Export the main function that will be called from the server component
export async function findHotelForTrip(input: FindHotelInput): Promise<FindHotelOutput> {
  return findHotelFlow(input);
}

const findHotelAgent = ai.definePrompt({
  name: 'findHotelAgent',
  tools: [findHotel],
  prompt: `You are a travel agent. Your task is to find the best hotel for a user's trip.
  1. Use the findHotel tool to search for a hotel based on the provided destination and budget.
  2. Once the tool returns the hotel information, use that information to populate the final response.
  
  Destination: {{{destination}}}
  Budget: {{{budget}}}`,
  input: { schema: FindHotelInputSchema },
  output: { schema: FindHotelOutputSchema },
});

const findHotelFlow = ai.defineFlow(
  {
    name: 'findHotelFlow',
    inputSchema: FindHotelInputSchema,
    outputSchema: FindHotelOutputSchema,
  },
  async (input) => {
    console.log('[AGENT FLOW] Starting hotel search for:', input.destination);
    
    // Ensure the budget is one of the allowed enum values for the tool
    const validBudgets = ['budget', 'moderate', 'luxury'];
    const sanitizedBudget = validBudgets.includes(input.budget.toLowerCase()) 
      ? input.budget.toLowerCase() 
      : 'moderate';

    const { output } = await findHotelAgent({ 
        ...input, 
        budget: sanitizedBudget,
    });
    
    if (!output) {
      console.error('[AGENT FLOW] Failed to get output from the agent.');
      throw new Error('Failed to find a hotel.');
    }
    console.log('[AGENT FLOW] Successfully found hotel:', output.hotelName);
    return output;
  }
);
