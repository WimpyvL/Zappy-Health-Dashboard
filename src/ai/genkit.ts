import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {initializeApp} from 'firebase-admin/app';

initializeApp();

export const ai = genkit({
  plugins: [
    // firebase(), // Temporarily removed to fix build error
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
