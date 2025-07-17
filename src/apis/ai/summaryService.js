import { getPromptByCategoryTypeAndSection } from './api';
import { runFlow } from 'genkit';
import { assessmentFlow } from '@/ai/flows/assessmentFlow'; // Assuming this flow exists

// MOCK AI service (to be replaced with actual API calls)
const mockAIService = {
  generate: async (prompt, data) => {
    console.log('Simulating AI generation with prompt:', prompt);
    console.log('Using data:', data);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    if (prompt.includes('summary')) {
      return { 
        summary: 'This is a mock AI summary based on patient data.',
        recommendations: [
          { text: 'Recommended: Semaglutide 0.25mg weekly', confidence: 0.94 },
          { text: 'Consider: Metformin 500mg daily', confidence: 0.85 }
        ],
        reasoning: 'Based on BMI and patient goals, these treatments are most effective.'
      };
    }
    if (prompt.includes('assessment')) {
      return { assessment: 'Mock clinical assessment.' };
    }
    if (prompt.includes('plan')) {
      return { plan: 'Mock treatment plan.' };
    }
    return { error: 'Unknown prompt type' };
  },
};

/**
 * Generates an intake summary using AI.
 * @param {object} formData - The patient's intake form data.
 * @param {string} categoryId - The category of the consultation.
 * @param {string} promptType - 'initial' or 'followup'.
 * @returns {Promise<object>} The generated summary.
 */
export const generateIntakeSummary = async (
  formData,
  categoryId,
  promptType = 'initial'
) => {
  const prompt = await getPromptByCategoryTypeAndSection(
    categoryId,
    promptType,
    'summary'
  );
  if (!prompt) {
    throw new Error('Could not find a suitable AI prompt for summary generation.');
  }

  // In a real app, you would use a service that calls the Genkit flow
  // For now, we call the mock service.
  return mockAIService.generate(prompt.prompt, formData);
};


/**
 * Generates a clinical assessment using a Genkit flow.
 * @param {object} formData - The patient's intake form data.
 * @param {string} categoryId - The category of the consultation.
 * @param {string} promptType - 'initial' or 'followup'.
 * @returns {Promise<object>} The generated assessment.
 */
export const generateAssessment = async (
  formData,
  categoryId,
  promptType = 'initial'
) => {
  // Directly call the Genkit flow
  try {
    const result = await runFlow(assessmentFlow, { patientData: formData, category: categoryId });
    return { assessment: result.assessment };
  } catch(e) {
    console.error("Genkit flow error in generateAssessment", e);
    // Fallback to mock service if Genkit flow fails
    const prompt = await getPromptByCategoryTypeAndSection(
      categoryId,
      promptType,
      'assessment'
    );
    if (!prompt) {
      throw new Error('Could not find a suitable AI prompt for assessment generation.');
    }
    return mockAIService.generate(prompt.prompt, formData);
  }
};

/**
 * Generates a treatment plan using AI.
 * @param {object} formData - The patient's intake form data.
 * @param {string} categoryId - The category of the consultation.
 * @param {string} promptType - 'initial' or 'followup'.
 * @returns {Promise<object>} The generated plan.
 */
export const generatePlan = async (
  formData,
  categoryId,
  promptType = 'initial'
) => {
  const prompt = await getPromptByCategoryTypeAndSection(
    categoryId,
    promptType,
    'plan'
  );
  if (!prompt) {
    throw new Error('Could not find a suitable AI prompt for plan generation.');
  }
  return mockAIService.generate(prompt.prompt, formData);
};


// Dummy functions for saving/getting summaries. Replace with actual DB logic.
export const saveSummary = async (patientId, formId, summary, type) => {
  console.log(`Saving ${type} for patient ${patientId}:`, summary);
  // This would interact with the `ai_summaries` table.
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, id: `summary_${Date.now()}` };
};

export const getSummary = async (patientId, formId, type) => {
   console.log(`Getting ${type} for patient ${patientId}`);
   // This would fetch from the `ai_summaries` table.
   await new Promise(resolve => setTimeout(resolve, 500));
   return null; // Return null to simulate no existing summary
};
