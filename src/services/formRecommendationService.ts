import { generateContent, generateStructuredContent } from '@/ai/generate';
import { databaseService } from '@/lib/database';

export interface FormRecommendation {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  category: 'treatment' | 'subscription' | 'supplement' | 'lifestyle';
  priority: number;
  price?: number;
  savings?: number;
  actionable: boolean;
  metadata?: Record<string, any>;
}

export interface RecommendationTrigger {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  additionalValue?: any; // For 'between' operator
}

export interface RecommendationConfig {
  triggers?: RecommendationTrigger[];
  logic?: 'and' | 'or';
  maxRecommendations?: number;
  categories?: string[];
}

/**
 * Form-Integrated Recommendation Service
 * 
 * Generates contextual recommendations based on form data as users fill out forms.
 * Integrates seamlessly with the existing dynamic form system.
 */
export class FormRecommendationService {
  private cache = new Map<string, FormRecommendation[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate recommendations based on current form data
   */
  async generateRecommendations(
    formData: Record<string, any>,
    config?: RecommendationConfig
  ): Promise<FormRecommendation[]> {
    try {
      const cacheKey = this.generateCacheKey(formData, config);
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Extract key health indicators from form data
      const healthProfile = this.extractHealthProfile(formData);
      
      // Generate AI-powered recommendations
      const recommendations = await this.generateAIRecommendations(healthProfile, config);
      
      // Cache the results
      this.cache.set(cacheKey, recommendations);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      return recommendations;
    } catch (error) {
      console.error('Error generating form recommendations:', error);
      return [];
    }
  }

  /**
   * Check if recommendations should be triggered based on form data
   */
  shouldTriggerRecommendations(
    formData: Record<string, any>,
    config: RecommendationConfig
  ): boolean {
    if (!config.triggers || config.triggers.length === 0) {
      return false;
    }

    const results = config.triggers.map(trigger => 
      this.evaluateTrigger(formData, trigger)
    );

    return config.logic === 'and' 
      ? results.every(result => result)
      : results.some(result => result);
  }

  /**
   * Get real-time recommendations as form is being filled
   */
  async getRealtimeRecommendations(
    formData: Record<string, any>,
    changedField: string,
    config?: RecommendationConfig
  ): Promise<FormRecommendation[]> {
    // Only generate recommendations if the changed field is relevant
    const relevantFields = ['weight', 'height', 'age', 'goals', 'conditions', 'medications'];
    
    if (!relevantFields.some(field => changedField.includes(field))) {
      return [];
    }

    return this.generateRecommendations(formData, config);
  }

  /**
   * Generate subscription plan recommendations
   */
  async generatePlanRecommendations(
    formData: Record<string, any>
  ): Promise<FormRecommendation[]> {
    try {
      const healthProfile = this.extractHealthProfile(formData);
      
      const prompt = `
        Based on this patient profile, recommend the most suitable subscription plan:
        
        Health Profile:
        - BMI: ${healthProfile.bmi || 'Not calculated'}
        - Age: ${healthProfile.age || 'Not provided'}
        - Goals: ${healthProfile.goals.join(', ') || 'General wellness'}
        - Conditions: ${healthProfile.conditions.join(', ') || 'None specified'}
        - Consultation Preference: ${healthProfile.consultationFrequency || 'Not specified'}
        
        Available Plans:
        - Basic Plan ($29/month): Monthly check-ins, basic support
        - Standard Plan ($49/month): Bi-weekly consultations, 24/7 chat, personalized insights
        - Premium Plan ($79/month): Weekly consultations, priority access, dedicated coordinator
        
        Provide 1-2 plan recommendations in JSON format:
        {
          "recommendations": [
            {
              "title": "Plan Name",
              "description": "Brief description of what's included",
              "reasoning": "Why this plan fits this patient's needs",
              "confidence": 0.8,
              "category": "subscription",
              "priority": 1,
              "price": 49,
              "savings": 0,
              "actionable": true
            }
          ]
        }
      `;

      const response = await generateStructuredContent(prompt, 'json');
      const parsed = JSON.parse(response);
      
      return parsed.recommendations?.map((rec: any, index: number) => ({
        id: `plan_rec_${index}`,
        ...rec
      })) || [];
    } catch (error) {
      console.error('Error generating plan recommendations:', error);
      return [];
    }
  }

  /**
   * Generate treatment recommendations based on health data
   */
  async generateTreatmentRecommendations(
    formData: Record<string, any>
  ): Promise<FormRecommendation[]> {
    try {
      const healthProfile = this.extractHealthProfile(formData);
      
      const prompt = `
        Based on this patient profile, suggest appropriate treatments or interventions:
        
        Health Profile:
        - BMI: ${healthProfile.bmi || 'Not calculated'}
        - Age: ${healthProfile.age || 'Not provided'}
        - Goals: ${healthProfile.goals.join(', ') || 'General wellness'}
        - Conditions: ${healthProfile.conditions.join(', ') || 'None specified'}
        - Current Medications: ${healthProfile.medications.join(', ') || 'None'}
        
        Provide 2-3 treatment recommendations in JSON format:
        {
          "recommendations": [
            {
              "title": "Treatment/Intervention Name",
              "description": "What this treatment involves",
              "reasoning": "Why this is recommended for this patient",
              "confidence": 0.7,
              "category": "treatment",
              "priority": 1,
              "actionable": true
            }
          ]
        }
      `;

      const response = await generateStructuredContent(prompt, 'json');
      const parsed = JSON.parse(response);
      
      return parsed.recommendations?.map((rec: any, index: number) => ({
        id: `treatment_rec_${index}`,
        ...rec
      })) || [];
    } catch (error) {
      console.error('Error generating treatment recommendations:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private async generateAIRecommendations(
    healthProfile: any,
    config?: RecommendationConfig
  ): Promise<FormRecommendation[]> {
    try {
      const categories = config?.categories || ['treatment', 'subscription', 'lifestyle'];
      const maxRecs = config?.maxRecommendations || 3;
      
      const prompt = `
        Generate personalized healthcare recommendations for a patient with this profile:
        
        Health Profile:
        - BMI: ${healthProfile.bmi || 'Not calculated'}
        - Age: ${healthProfile.age || 'Not provided'}
        - Goals: ${healthProfile.goals.join(', ') || 'General wellness'}
        - Medical Conditions: ${healthProfile.conditions.join(', ') || 'None specified'}
        - Current Medications: ${healthProfile.medications.join(', ') || 'None'}
        - Lifestyle Factors: ${healthProfile.lifestyle.join(', ') || 'Not specified'}
        
        Focus on these categories: ${categories.join(', ')}
        
        Provide up to ${maxRecs} recommendations in JSON format:
        {
          "recommendations": [
            {
              "title": "Recommendation Title",
              "description": "Brief description of the recommendation",
              "reasoning": "Why this is recommended for this specific patient",
              "confidence": 0.8,
              "category": "treatment|subscription|supplement|lifestyle",
              "priority": 1,
              "price": 0,
              "savings": 0,
              "actionable": true,
              "metadata": {}
            }
          ]
        }
      `;

      const response = await generateStructuredContent(prompt, 'json');
      const parsed = JSON.parse(response);
      
      return parsed.recommendations?.map((rec: any, index: number) => ({
        id: `ai_rec_${index}`,
        ...rec
      })) || [];
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return [];
    }
  }

  private extractHealthProfile(formData: Record<string, any>) {
    // Calculate BMI if height and weight are available
    const bmi = this.calculateBMI(formData);
    
    // Extract various health-related fields
    const goals = this.extractArray(formData, ['goals', 'healthGoals', 'treatmentGoals']);
    const conditions = this.extractArray(formData, ['conditions', 'medicalConditions', 'healthConditions']);
    const medications = this.extractArray(formData, ['medications', 'currentMedications', 'prescriptions']);
    const lifestyle = this.extractArray(formData, ['lifestyle', 'habits', 'activities']);
    
    return {
      bmi,
      age: formData.age || formData.dateOfBirth ? this.calculateAge(formData.dateOfBirth) : null,
      goals,
      conditions,
      medications,
      lifestyle,
      consultationFrequency: formData.consultationFrequency || formData.preferredFrequency,
      urgency: formData.urgency || formData.priority,
    };
  }

  private calculateBMI(formData: Record<string, any>): number | null {
    const weight = parseFloat(formData.weight || formData.currentWeight || '0');
    const height = parseFloat(formData.height || '0');
    const heightFeet = parseFloat(formData.heightFeet || '0');
    const heightInches = parseFloat(formData.heightInches || '0');
    
    if (!weight) return null;
    
    let heightInInches = height;
    if (heightFeet && heightInches) {
      heightInInches = heightFeet * 12 + heightInches;
    }
    
    if (!heightInInches) return null;
    
    // Convert to metric and calculate BMI
    const heightMeters = heightInInches * 0.0254;
    const weightKg = weight * 0.453592;
    
    return Math.round((weightKg / (heightMeters * heightMeters)) * 10) / 10;
  }

  private calculateAge(dateOfBirth: string): number | null {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private extractArray(formData: Record<string, any>, fieldNames: string[]): string[] {
    const values: string[] = [];
    
    fieldNames.forEach(fieldName => {
      const value = formData[fieldName];
      if (Array.isArray(value)) {
        values.push(...value);
      } else if (typeof value === 'string' && value.trim()) {
        values.push(value);
      }
    });
    
    return [...new Set(values)]; // Remove duplicates
  }

  private evaluateTrigger(formData: Record<string, any>, trigger: RecommendationTrigger): boolean {
    const fieldValue = formData[trigger.field];
    
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }
    
    switch (trigger.operator) {
      case 'equals':
        return fieldValue === trigger.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(trigger.value).toLowerCase());
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(trigger.value);
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(trigger.value);
      case 'between':
        const numValue = parseFloat(fieldValue);
        return numValue >= parseFloat(trigger.value) && numValue <= parseFloat(trigger.additionalValue || 0);
      default:
        return false;
    }
  }

  private generateCacheKey(formData: Record<string, any>, config?: RecommendationConfig): string {
    const relevantData = {
      weight: formData.weight,
      height: formData.height,
      age: formData.age,
      goals: formData.goals,
      conditions: formData.conditions,
      medications: formData.medications,
      config: config ? JSON.stringify(config) : null
    };
    
    return JSON.stringify(relevantData);
  }

  /**
   * Clear the recommendation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached recommendations count (for debugging)
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const formRecommendationService = new FormRecommendationService();
export default formRecommendationService;
