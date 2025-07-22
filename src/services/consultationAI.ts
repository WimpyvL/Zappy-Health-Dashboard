
/**
 * @fileoverview AI-powered consultation analysis and generation service.
 * Integrates with Genkit to provide summaries, assessments, and treatment plans.
 */

import { generateStructuredContent } from '@/ai/generate';
import { getPromptByCategoryTypeAndSection } from '@/apis/ai/api';
import { dbService } from './database';

interface ConsultationData {
  patientId: string;
  intakeData: Record<string, any>;
  notes?: string;
  previousConsultations?: any[];
}

interface AISummary {
  summary: string;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface AIPlan {
  goals: string[];
  actions: string[];
  medications: string[];
  follow_up: string;
}

interface AIAssessment {
  assessment: string;
  differential_diagnosis: string[];
  confidence_score: number;
}

class ConsultationAIService {
  /**
   * Generate an AI-powered summary of the consultation data.
   */
  async generateSummary(consultationData: ConsultationData, categoryId: string, promptType: string = 'initial'): Promise<AISummary> {
    try {
      const promptResult = await getPromptByCategoryTypeAndSection(categoryId, promptType, 'summary');
      if (!promptResult.data?.prompt) {
        throw new Error('AI summary prompt not found.');
      }
      
      const prompt = this.constructPrompt(promptResult.data.prompt, consultationData);
      const aiResponse = await generateStructuredContent(prompt, 'json');
      const parsed = JSON.parse(aiResponse);

      // Save summary to database
      await dbService.create('ai_summaries', {
        consultationId: consultationData.patientId, // Placeholder
        summary: parsed.summary,
        type: 'summary',
        metadata: {
          keywords: parsed.keywords,
          sentiment: parsed.sentiment,
          promptUsed: promptResult.data.id
        }
      });
      
      return parsed;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw new Error('Failed to generate AI summary.');
    }
  }

  /**
   * Generate a clinical assessment based on consultation data.
   */
  async generateAssessment(consultationData: ConsultationData, categoryId: string, promptType: string = 'initial'): Promise<AIAssessment> {
    try {
      const promptResult = await getPromptByCategoryTypeAndSection(categoryId, promptType, 'assessment');
      if (!promptResult.data?.prompt) {
        throw new Error('AI assessment prompt not found.');
      }

      const prompt = this.constructPrompt(promptResult.data.prompt, consultationData);
      const aiResponse = await generateStructuredContent(prompt, 'json');
      
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Error generating AI assessment:', error);
      throw new Error('Failed to generate AI assessment.');
    }
  }

  /**
   * Generate a treatment plan based on consultation data.
   */
  async generatePlan(consultationData: ConsultationData, categoryId: string, promptType: string = 'initial'): Promise<AIPlan> {
    try {
      const promptResult = await getPromptByCategoryTypeAndSection(categoryId, promptType, 'plan');
      if (!promptResult.data?.prompt) {
        throw new Error('AI treatment plan prompt not found.');
      }

      const prompt = this.constructPrompt(promptResult.data.prompt, consultationData);
      const aiResponse = await generateStructuredContent(prompt, 'json');
      
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error('Error generating AI plan:', error);
      throw new Error('Failed to generate AI treatment plan.');
    }
  }

  /**
   * Constructs a comprehensive prompt for the AI model.
   */
  private constructPrompt(basePrompt: string, consultationData: ConsultationData): string {
    const intakeSummary = JSON.stringify(consultationData.intakeData, null, 2);
    
    return `
      ${basePrompt}

      --- Patient Data ---
      Intake Form:
      ${intakeSummary}

      Provider Notes:
      ${consultationData.notes || 'No provider notes added yet.'}
      ---
    `;
  }
}

export const consultationAIService = new ConsultationAIService();
