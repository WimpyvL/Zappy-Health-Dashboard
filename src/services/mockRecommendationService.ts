import { FormRecommendation, RecommendationConfig } from './formRecommendationService';

/**
 * Mock Recommendation Service for Testing
 * 
 * Provides static recommendations based on form data without requiring AI services.
 * This allows testing the form-integrated recommendation system without external dependencies.
 */
export class MockRecommendationService {
  private cache = new Map<string, FormRecommendation[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate mock recommendations based on form data
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
      
      // Generate mock recommendations based on profile
      const recommendations = this.generateMockRecommendations(healthProfile, config);
      
      // Cache the results
      this.cache.set(cacheKey, recommendations);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      return recommendations;
    } catch (error) {
      console.error('Error generating mock recommendations:', error);
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
      return true; // Show recommendations by default if no triggers
    }

    const results = config.triggers.map(trigger => 
      this.evaluateTrigger(formData, trigger)
    );

    return config.logic === 'and' 
      ? results.every(result => result)
      : results.some(result => result);
  }

  /**
   * Generate mock recommendations based on health profile
   */
  private generateMockRecommendations(
    healthProfile: any,
    config?: RecommendationConfig
  ): FormRecommendation[] {
    const recommendations: FormRecommendation[] = [];
    const categories = config?.categories || ['treatment', 'subscription', 'lifestyle'];
    const maxRecs = config?.maxRecommendations || 3;

    // BMI-based recommendations
    if (healthProfile.bmi) {
      if (healthProfile.bmi > 25 && categories.includes('treatment')) {
        recommendations.push({
          id: 'weight_management_program',
          title: 'Comprehensive Weight Management Program',
          description: 'A structured program combining nutrition counseling, exercise planning, and medical supervision.',
          reasoning: `Based on your BMI of ${healthProfile.bmi}, this program provides evidence-based support for sustainable weight management. Studies show 78% of participants achieve their target weight within 6 months.`,
          confidence: 0.85,
          category: 'treatment',
          priority: 1,
          price: 299,
          actionable: true
        });
      }

      if (healthProfile.bmi > 30 && categories.includes('subscription')) {
        recommendations.push({
          id: 'premium_plan',
          title: 'Premium Plan with Weekly Consultations',
          description: 'Weekly one-on-one sessions with healthcare providers, priority scheduling, and 24/7 support.',
          reasoning: `Given your health goals and BMI, weekly consultations provide the intensive support needed for optimal results. This plan is chosen by 65% of patients with similar profiles.`,
          confidence: 0.78,
          category: 'subscription',
          priority: 2,
          price: 79,
          actionable: true
        });
      }
    }

    // Goal-based recommendations
    if (healthProfile.goals.includes('weight_loss') && categories.includes('lifestyle')) {
      recommendations.push({
        id: 'mediterranean_diet',
        title: 'Mediterranean Diet with Exercise Plan',
        description: 'Personalized meal plans and workout routines based on Mediterranean diet principles.',
        reasoning: 'The Mediterranean diet has shown superior results for sustainable weight loss and cardiovascular health. Combined with your exercise preferences, this approach fits your lifestyle.',
        confidence: 0.72,
        category: 'lifestyle',
        priority: 3,
        actionable: true
      });
    }

    if (healthProfile.goals.includes('energy_boost') && categories.includes('supplement')) {
      recommendations.push({
        id: 'b_complex_vitamin_d',
        title: 'B-Complex and Vitamin D Supplements',
        description: 'High-quality B-complex vitamins and Vitamin D3 to support energy metabolism and mood.',
        reasoning: 'Based on your energy goals and lifestyle factors, these supplements address common deficiencies that impact energy levels. 82% of users report improved energy within 4 weeks.',
        confidence: 0.68,
        category: 'supplement',
        priority: 4,
        price: 49,
        actionable: true
      });
    }

    if (healthProfile.goals.includes('stress_management') && categories.includes('treatment')) {
      recommendations.push({
        id: 'mindfulness_therapy',
        title: 'Mindfulness-Based Stress Reduction Therapy',
        description: 'Evidence-based therapy combining mindfulness meditation with cognitive behavioral techniques.',
        reasoning: 'Your stress management goals align perfectly with MBSR therapy. Clinical studies show significant stress reduction and improved quality of life in 89% of participants.',
        confidence: 0.81,
        category: 'treatment',
        priority: 2,
        price: 150,
        actionable: true
      });
    }

    // Condition-based recommendations
    if (healthProfile.conditions.includes('anxiety') && categories.includes('subscription')) {
      recommendations.push({
        id: 'mental_health_plan',
        title: 'Mental Health Support Plan',
        description: 'Specialized plan with licensed therapists, anxiety management tools, and crisis support.',
        reasoning: 'Given your anxiety concerns, this specialized plan provides comprehensive mental health support with immediate access to licensed professionals when needed.',
        confidence: 0.88,
        category: 'subscription',
        priority: 1,
        price: 99,
        actionable: true
      });
    }

    if (healthProfile.conditions.includes('diabetes') && categories.includes('treatment')) {
      recommendations.push({
        id: 'diabetes_management',
        title: 'Comprehensive Diabetes Management Program',
        description: 'Continuous glucose monitoring, nutrition counseling, and medication optimization.',
        reasoning: 'Your diabetes requires specialized care coordination. This program integrates all aspects of diabetes management with proven outcomes in HbA1c reduction.',
        confidence: 0.92,
        category: 'treatment',
        priority: 1,
        price: 199,
        actionable: true
      });
    }

    // Age-based recommendations
    if (healthProfile.age && healthProfile.age > 50 && categories.includes('supplement')) {
      recommendations.push({
        id: 'senior_wellness_pack',
        title: 'Senior Wellness Supplement Pack',
        description: 'Comprehensive vitamins and minerals tailored for adults over 50, including calcium, magnesium, and omega-3.',
        reasoning: 'Adults over 50 have increased nutritional needs. This pack addresses common deficiencies and supports bone health, cognitive function, and cardiovascular wellness.',
        confidence: 0.75,
        category: 'supplement',
        priority: 3,
        price: 69,
        actionable: true
      });
    }

    // Default recommendations if no specific matches
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'standard_wellness_plan',
        title: 'Standard Wellness Plan',
        description: 'Bi-weekly consultations, health tracking, and personalized wellness recommendations.',
        reasoning: 'Based on your health profile, this plan provides comprehensive wellness support with regular check-ins and personalized guidance.',
        confidence: 0.65,
        category: 'subscription',
        priority: 2,
        price: 49,
        actionable: true
      });
    }

    // Limit to max recommendations and sort by priority
    return recommendations
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxRecs);
  }

  private extractHealthProfile(formData: Record<string, any>) {
    // Calculate BMI if height and weight are available
    const bmi = this.calculateBMI(formData);
    
    // Extract various health-related fields
    const goals = this.extractArray(formData, ['goals', 'healthGoals', 'treatmentGoals']);
    const conditions = this.extractArray(formData, ['conditions', 'medicalConditions', 'healthConditions']);
    const medications = this.extractArray(formData, ['medications', 'currentMedications', 'prescriptions']);
    
    return {
      bmi,
      age: formData.age || formData.dateOfBirth ? this.calculateAge(formData.dateOfBirth) : null,
      goals,
      conditions,
      medications,
      consultationFrequency: formData.consultationFrequency || formData.preferredFrequency,
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

  private evaluateTrigger(formData: Record<string, any>, trigger: any): boolean {
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
}

// Export singleton instance
export const mockRecommendationService = new MockRecommendationService();
export default mockRecommendationService;
