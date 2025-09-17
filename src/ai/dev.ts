import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Import your flows here.
import '@/ai/flows/ai-itinerary-generation.ts';
import '@/ai/flows/ai-personal-trip-assistant.ts';

genkit({
  plugins: [googleAI()],
  // Log all traces to the local filesystem.
  traceStore: {
    provider: 'file',
    options: {
      path: './.genkit/traces',
    },
  },
});
