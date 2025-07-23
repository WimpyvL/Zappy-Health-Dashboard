/**
 * @fileoverview Service for integrating intake forms with the broader patient workflow.
 * This service processes raw intake form data, structures it for clinical use,
 * and integrates it with other services like AI recommendations and consultation prep.
 */

import { dynamicFormService } from './dynamicFormService';
import { aiRecommendationService } from './aiRecommendationService';
import { dbService } from '@/services/database/index';

// --- Type Definitions ---
interface IntakeProcessingResult {
  success: boolean;
  processedData?: Record<string, any>;
  recommendations?: any[];
  error?: string;
}

// --- Service Implementation ---
class IntakeIntegrationService {
  /**
   * Processes the completed intake form data.
   * This is the main entry point for handling a submitted intake form.
   */
  async processIntakeCompletion(
    rawFormData: Record<string, any>,
    flowId: string
  ): Promise<IntakeProcessingResult> {
    try {
      // 1. Structure the form data using the dynamic form service logic
      const processedData = dynamicFormService.processFormSubmission(
        { pages: [] }, // We don't need the full schema here, just the data
        rawFormData
      );

      // 2. Generate AI-powered recommendations based on the structured data
      const recommendations = await aiRecommendationService.generateRecommendations(
        processedData,
        [],
        [] // No plans available at this stage
      );
      
      // 3. Persist the structured data and recommendations to the patient's record (optional)
      // This might involve updating a 'patient_profile' or a related collection.
      // For now, we'll log it as this is handled by the telehealth flow orchestrator.
      console.log(`Processed intake for flow ${flowId} with ${recommendations.subscriptionUpgrades.length} recommendations.`);

      return {
        success: true,
        processedData,
        recommendations: recommendations.subscriptionUpgrades,
      };
    } catch (error: any) {
      console.error('Error during intake processing:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during intake processing.',
      };
    }
  }

  /**
   * Retrieves and prepares intake data for a provider's review.
   */
  async getIntakeDataForReview(flowId: string): Promise<any> {
    const flowResult = await dbService.getById('enhanced_telehealth_flows', flowId);
    
    if (!flowResult.success || !flowResult.data) {
      throw new Error('Could not retrieve telehealth flow data for review.');
    }

    // In a real scenario, this would format the data into a clean, readable summary for the provider.
    return {
      patientId: flowResult.data.patientId,
      intakeData: flowResult.data.intake_form_data,
      submittedAt: flowResult.data.updatedAt, // Assuming last update is submission time
    };
  }
}

export const intakeIntegrationService = new IntakeIntegrationService();
