'use server';
/**
 * @fileOverview A tool for finding hotel recommendations.
 * This file defines a Genkit tool that can be used by an AI agent to find hotels
 * based on a given destination and budget.
 *
 * @exports findHotel - The tool function to find hotels.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mock hotel data for demonstration purposes
const mockHotels = {
  paris: {
    budget: { name: 'Hotel de la Paix', price: '~$80/night', description: 'A charming, budget-friendly hotel in a central location.' },
    moderate: { name: 'Le Citizen Hotel', price: '~$200/night', description: 'A modern boutique hotel with canal views.' },
    luxury: { name: 'The Ritz Paris', price: '~$1200/night', description: 'Iconic luxury and timeless elegance on Place Vendôme.' },
  },
  tokyo: {
    budget: { name: 'Sakura Hotel', price: '~$60/night', description: 'A popular choice for travelers on a budget.' },
    moderate: { name: 'Park Hotel Tokyo', price: '~$250/night', description: 'Stylish hotel with great views and an art concept.' },
    luxury: { name: 'Aman Tokyo', price: '~$1500/night', description: 'Experience ultimate luxury with panoramic city views.' },
  },
  default: {
    budget: { name: 'The Local Hostel', price: '~$50/night', description: 'A clean and friendly hostel for budget travelers.' },
    moderate: { name: 'City Center Inn', price: '~$150/night', description: 'A comfortable and convenient mid-range hotel.' },
    luxury: { name: 'The Grand Plaza', price: '~$500/night', description: 'A top-tier hotel offering premium amenities and service.' },
  },
};


export const findHotel = ai.defineTool(
  {
    name: 'findHotel',
    description: 'Finds a hotel recommendation based on the destination and budget.',
    inputSchema: z.object({
      destination: z.string().describe('The city or area for the hotel search (e.g., "Paris").'),
      budget: z.enum(['budget', 'moderate', 'luxury']).describe('The budget category for the hotel.'),
    }),
    outputSchema: z.object({
      name: z.string(),
      price: z.string(),
      description: z.string(),
    }),
  },
  async (input) => {
    console.log(`[TOOL] findHotel called with:`, input);
    const destinationKey = input.destination.toLowerCase().split(',')[0];
    const hotelsForDestination = mockHotels[destinationKey as keyof typeof mockHotels] || mockHotels.default;
    const hotel = hotelsForDestination[input.budget];
    console.log(`[TOOL] findHotel returning:`, hotel);
    return hotel;
  }
);
