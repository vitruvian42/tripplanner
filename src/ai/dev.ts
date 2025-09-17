import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { genkitEval } from '@genkit-ai/eval';
import { dotprompt } from '@genkit-ai/dotprompt';


// Import your flows here.
import '@/ai/flows/ai-itinerary-generation.ts';
import '@/ai/flows/ai-personal-trip-assistant.ts';

genkit({
  plugins: [
    googleAI(),
    dotprompt(),
    genkitEval({
      judge: 'googleai/gemini-1.5-flash',
      metrics: ['reasoning', 'accuracy'],
    }),
  ],
  // Log all traces to the local filesystem.
  traceStore: {
    provider: 'file',
    options: {
      path: './.genkit/traces',
    },
  },
  flowStateStore: {
    provider: 'file',
    options: {
      path: './.genkit/flow-states',
    },
  },
});
