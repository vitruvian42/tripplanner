// src/ai/flows/ai-personal-trip-assistant.ts
'use server';
/**
 * @fileOverview An AI-powered personal trip assistant that provides timely reminders and optimizes trip time with activity recommendations.
 *
 * - personalTripAssistant - A function that acts as a personal trip assistant.
 * - PersonalTripAssistantInput - The input type for the personalTripAssistant function.
 * - PersonalTripAssistantOutput - The return type for the personalTripAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const PersonalTripAssistantInputSchema = z.object({
  tripDetails: z
    .string()
    .describe(
      'Detailed information about the trip, including dates, location, activities, and preferences.'
    ),
  liveData: z
    .string()
    .describe(
      'Live data relevant to the trip, such as weather, traffic, and event schedules.'
    ),
  userPreferences: z
    .string()
    .describe('The preferences of the user, such as preferred activity types and pace.'),
});
export type PersonalTripAssistantInput = z.infer<typeof PersonalTripAssistantInputSchema>;

const PersonalTripAssistantOutputSchema = z.object({
  reminders: z
    .string()
    .describe('A list of timely reminders for upcoming activities and important events during the trip.'),
  recommendations: z
    .string()
    .describe(
      'Activity recommendations based on live data and user preferences, optimized for trip time.'
    ),
});
export type PersonalTripAssistantOutput = z.infer<typeof PersonalTripAssistantOutputSchema>;

export async function personalTripAssistant(input: PersonalTripAssistantInput): Promise<PersonalTripAssistantOutput> {
  return personalTripAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalTripAssistantPrompt',
  input: {schema: PersonalTripAssistantInputSchema},
  output: {schema: PersonalTripAssistantOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are a personal trip assistant. Your goal is to provide timely reminders and optimize the trip time for the user.

  Based on the following trip details, live data, and user preferences, provide reminders and activity recommendations.

  Trip Details: {{{tripDetails}}}
  Live Data: {{{liveData}}}
  User Preferences: {{{userPreferences}}}

  Reminders: Provide a list of reminders for upcoming activities and important events during the trip.
  Recommendations: Provide activity recommendations based on live data and user preferences, optimized for trip time.
  `,
});

const personalTripAssistantFlow = ai.defineFlow(
  {
    name: 'personalTripAssistantFlow',
    inputSchema: PersonalTripAssistantInputSchema,
    outputSchema: PersonalTripAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
