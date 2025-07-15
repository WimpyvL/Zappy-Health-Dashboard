import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {defineFlow, runFlow} from 'genkit/flow';

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
