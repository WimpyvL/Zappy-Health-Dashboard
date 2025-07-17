// src/ai/flows/assessmentFlow.ts
'use server';
/**
 * @fileOverview A Genkit flow for generating a clinical assessment.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';

// Define the input schema for the assessment flow
export const AssessmentInputSchema = z.object({
  patientData: z.any().describe('The intake form data for the patient.'),
  category: z.string().describe('The clinical category (e.g., weight_management).'),
});

// Define the output schema for the assessment flow
export const AssessmentOutputSchema = z.object({
  assessment: z.string().describe('A comprehensive clinical assessment based on the patient data.'),
});

// Define the Genkit prompt
const assessmentPrompt = ai.definePrompt({
  name: 'assessmentPrompt',
  input: { schema: AssessmentInputSchema },
  output: { schema: AssessmentOutputSchema },
  prompt: `
    You are a medical scribe assisting a healthcare provider.
    Based on the following patient intake data for a {{category}} consultation,
    generate a clinical assessment.

    Patient Data:
    \`\`\`json
    {{{json patientData}}}
    \`\`\`

    Generate a concise but comprehensive clinical assessment suitable for a medical note.
    Focus on summarizing the key points from the patient data and providing an initial assessment.
    Do not include a treatment plan.
  `,
});

// Define the Genkit flow
export const assessmentFlow = ai.defineFlow(
  {
    name: 'assessmentFlow',
    inputSchema: AssessmentInputSchema,
    outputSchema: AssessmentOutputSchema,
  },
  async (input) => {
    const llmResponse = await assessmentPrompt(input);
    return llmResponse.output!;
  }
);
