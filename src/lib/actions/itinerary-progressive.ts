'use server';

import { generateItineraryProgressive } from '@/ai/flows/ai-itinerary-generation-progressive';
import type { ItineraryInput } from '@/ai/flows/ai-itinerary-generation';

/**
 * Generate itinerary with progressive updates
 * Returns summary quickly, then full itinerary
 */
export async function generateItineraryWithUpdates(input: ItineraryInput): Promise<{
  summary: {
    destination: string;
    overview: string;
    dayCount: number;
    highlights: string[];
    estimatedBudget?: string;
  };
  fullItinerary: Awaited<ReturnType<typeof generateItineraryProgressive>>['fullItinerary'];
}> {
  const result = await generateItineraryProgressive(input);
  return {
    summary: result.summary,
    fullItinerary: result.fullItinerary,
  };
}

