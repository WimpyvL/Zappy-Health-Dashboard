/**
 * Integration Service for Post-Form Recommendations
 * 
 * This service bridges the gap between your existing intake flow and the new
 * recommendation system, following the Eden-style pattern you showed.
 */

import { mockRecommendationService } from './mockRecommendationService';
import { intakeIntegrationService } from './intakeIntegrationService';

export class IntakeRecommendationIntegration {
  /**
   * Process completed intake form and generate recommendations
   * This replaces the direct flow to consultation with AI analysis step
   */
  async processIntakeCompletion(formData, flowId) {
    try {
      console.log('🔄 Processing intake completion with recommendations...', { formData, flowId });

      // Step 1: Generate AI recommendations based on form data
      const recommendations = await mockRecommendationService.generateRecommendations(formData, {
        maxRecommendations: 3,
        categories: ['treatment', 'subscription', 'supplement', 'lifestyle']
      });

      // Step 2: Create enhanced intake record with recommendations
      const intakeRecord = {
        ...formData,
        flowId,
        status: 'pending_recommendation_selection',
        aiRecommendations: recommendations,
        recommendationGeneratedAt: new Date().toISOString(),
        nextStep: 'recommendation_selection'
      };

      // Step 3: Store intake with recommendations (using your existing service)
      const savedIntake = await intakeIntegrationService.createIntakeRecord(intakeRecord);

      return {
        success: true,
        intakeId: savedIntake.id,
        recommendations,
        nextStep: 'recommendation_selection',
        data: savedIntake
      };

    } catch (error) {
      console.error('❌ Error processing intake with recommendations:', error);
      throw new Error(`Failed to process intake completion: ${error.message}`);
    }
  }

  /**
   * Process selected recommendations and continue to consultation
   * This is called after user selects their preferred treatment plans
   */
  async processRecommendationSelection(intakeId, selectedRecommendations, formData) {
    try {
      console.log('🎯 Processing recommendation selection...', { 
        intakeId, 
        selectedCount: selectedRecommendations.length 
      });

      // Step 1: Update intake record with selected recommendations
      const updatedIntake = await intakeIntegrationService.updateIntakeRecord(intakeId, {
        selectedRecommendations,
        status: 'ready_for_consultation',
        recommendationSelectedAt: new Date().toISOString(),
        nextStep: 'provider_review'
      });

      // Step 2: Create consultation request with pre-selected plans
      const consultationData = this.buildConsultationRequest(formData, selectedRecommendations);
      
      // Step 3: Use your existing consultation creation flow
      const consultation = await intakeIntegrationService.createConsultationFromIntake(
        updatedIntake,
        consultationData
      );

      // Step 4: Prepare checkout data with selected plans
      const checkoutData = this.buildCheckoutData(selectedRecommendations, formData);

      return {
        success: true,
        consultationId: consultation.id,
        intakeId,
        checkoutData,
        nextStep: 'checkout',
        selectedPlans: selectedRecommendations.map(rec => ({
          id: rec.id,
          title: rec.title,
          price: rec.price,
          category: rec.category
        }))
      };

    } catch (error) {
      console.error('❌ Error processing recommendation selection:', error);
      throw new Error(`Failed to process recommendation selection: ${error.message}`);
    }
  }

  /**
   * Build consultation request with AI recommendations context
   */
  buildConsultationRequest(formData, selectedRecommendations) {
    return {
      patientInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        email: formData.email,
        weight: formData.weight,
        height: formData.heightFeet && formData.heightInches 
          ? `${formData.heightFeet}'${formData.heightInches}"` 
          : null
      },
      healthProfile: {
        primaryGoal: formData.primaryGoal,
        duration: formData.duration,
        goals: formData.goals || [],
        conditions: formData.conditions || [],
        medications: formData.medications
      },
      aiRecommendations: selectedRecommendations.map(rec => ({
        id: rec.id,
        title: rec.title,
        category: rec.category,
        confidence: rec.confidence,
        reasoning: rec.reasoning,
        price: rec.price,
        selected: true
      })),
      consultationType: 'ai_assisted',
      priority: this.calculatePriority(selectedRecommendations),
      requestedAt: new Date().toISOString()
    };
  }

  /**
   * Build checkout data for selected recommendations
   */
  buildCheckoutData(selectedRecommendations, formData) {
    const totalMonthly = selectedRecommendations.reduce((sum, rec) => sum + (rec.price || 0), 0);
    
    return {
      items: selectedRecommendations.map(rec => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        price: rec.price || 0,
        category: rec.category,
        type: 'subscription',
        billingCycle: 'monthly'
      })),
      pricing: {
        subtotal: totalMonthly,
        discount: totalMonthly > 200 ? 25 : 0, // $25 off for comprehensive plans
        total: Math.max(0, totalMonthly - (totalMonthly > 200 ? 25 : 0)),
        dueToday: 0, // Following your "Due Today: $0" pattern
        dueIfPrescribed: Math.max(0, totalMonthly - (totalMonthly > 200 ? 25 : 0))
      },
      patientInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      },
      metadata: {
        source: 'ai_recommendation',
        recommendationCount: selectedRecommendations.length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Calculate consultation priority based on selected recommendations
   */
  calculatePriority(selectedRecommendations) {
    const hasUrgentConditions = selectedRecommendations.some(rec => 
      rec.category === 'treatment' && rec.confidence > 0.8
    );
    
    const hasMultiplePlans = selectedRecommendations.length > 1;
    
    if (hasUrgentConditions) return 'high';
    if (hasMultiplePlans) return 'medium';
    return 'normal';
  }

  /**
   * Get intake status with recommendation context
   */
  async getIntakeStatus(intakeId) {
    try {
      const intake = await intakeIntegrationService.getIntakeRecord(intakeId);
      
      if (!intake) {
        throw new Error('Intake record not found');
      }

      return {
        id: intake.id,
        status: intake.status,
        currentStep: intake.nextStep,
        hasRecommendations: !!intake.aiRecommendations,
        recommendationCount: intake.aiRecommendations?.length || 0,
        selectedRecommendationCount: intake.selectedRecommendations?.length || 0,
        createdAt: intake.createdAt,
        updatedAt: intake.updatedAt
      };

    } catch (error) {
      console.error('❌ Error getting intake status:', error);
      throw error;
    }
  }

  /**
   * Resume intake flow from any step
   */
  async resumeIntakeFlow(intakeId) {
    try {
      const intake = await intakeIntegrationService.getIntakeRecord(intakeId);
      
      if (!intake) {
        throw new Error('Intake record not found');
      }

      switch (intake.status) {
        case 'pending_recommendation_selection':
          return {
            step: 'recommendation_selection',
            data: {
              formData: intake,
              recommendations: intake.aiRecommendations
            }
          };
          
        case 'ready_for_consultation':
          return {
            step: 'checkout',
            data: {
              selectedRecommendations: intake.selectedRecommendations,
              checkoutData: this.buildCheckoutData(intake.selectedRecommendations, intake)
            }
          };
          
        default:
          return {
            step: 'completed',
            data: intake
          };
      }

    } catch (error) {
      console.error('❌ Error resuming intake flow:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const intakeRecommendationIntegration = new IntakeRecommendationIntegration();
export default intakeRecommendationIntegration;
