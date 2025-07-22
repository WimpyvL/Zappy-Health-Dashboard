import { databaseService } from '@/lib/database';
import { generateContent, generateStructuredContent } from '@/ai/generate';

/**
 * Enhanced AI Recommendation Service - Migrated from Supabase to Firebase
 * 
 * Generates personalized product recommendations and integrates with
 * bundle optimization to provide smart cart suggestions.
 */
export class AIRecommendationService {
  private recommendationCache = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate hybrid recommendations (Eden-style: Popular + Personalized)
   */
  async getHybridRecommendation(formData: any, category = 'weight_management') {
    try {
      // Get subscription plans
      const plans = await this.getSubscriptionPlans();

      // Find the most popular plan
      const popularPlan = plans.find((plan) => plan.isPopular) || plans[1]; // Default to second plan if none marked popular

      // Generate personalized reasoning for why the popular plan fits
      const personalizedReasoning = await this.generateHybridReasoning(
        formData,
        popularPlan,
        category
      );

      return {
        recommendedPlan: popularPlan,
        personalizedReasoning,
        reasoning: personalizedReasoning,
        isHybridApproach: true,
        metadata: {
          category,
          planCount: plans.length,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error('Error generating hybrid recommendation:', error);
      return {
        recommendedPlan: null,
        personalizedReasoning: null,
        reasoning: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate comprehensive recommendations including bundles and optimizations
   */
  async generateRecommendations(
    formData: any,
    selectedProducts: any[] = [],
    availablePlans: any[] = []
  ) {
    try {
      const cacheKey = this.generateCacheKey(formData, selectedProducts);
      const cached = this.recommendationCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Calculate BMI if height and weight are available
      const bmi = this.calculateBMI(formData.basicInfo);

      // Extract health goals and conditions
      const goals = this.extractGoals(formData);
      const conditions = this.extractConditions(formData);

      // Get base AI recommendations using Firebase and AI
      const baseRecommendations = await this.getBaseRecommendations({
        bmi,
        goals,
        conditions,
        age: formData.basicInfo?.age,
        formData,
      });

      // Filter out already selected products
      const newRecommendations = this.filterExistingProducts(
        baseRecommendations,
        selectedProducts
      );

      // Categorize recommendations
      const categorized = this.categorizeRecommendations(newRecommendations);

      // Generate bundle optimizations if there are selected products
      let bundleOptimization = null;
      if (selectedProducts.length > 0 && availablePlans.length > 0) {
        bundleOptimization = await this.optimizeCart(
          selectedProducts,
          availablePlans,
          { id: formData.patientId, goals, conditions, bmi }
        );
      }

      const result = {
        ...categorized,
        bundleOptimization,
        metadata: {
          bmi,
          goals,
          conditions,
          recommendationCount: newRecommendations.length,
          optimizationAvailable: !!bundleOptimization,
        },
      };

      // Cache the result
      this.recommendationCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return {
        subscriptionUpgrades: [],
        oneTimeAddons: [],
        bundleOptimizations: [],
        bundleOptimization: null,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Get base recommendations using Firebase and AI
   */
  async getBaseRecommendations(patientProfile: any) {
    try {
      // Get product recommendation rules from Firebase
      const rulesResponse = await databaseService.products.getMany({
        filters: [
          { field: 'type', operator: '==', value: 'recommendation_rule' }
        ],
        orderBy: { field: 'priority', direction: 'desc' }
      });

      if (!rulesResponse.success || !rulesResponse.data) {
        // Fallback to AI-generated recommendations
        return await this.generateAIRecommendations(patientProfile);
      }

      const rules = rulesResponse.data;
      const matchingRecommendations = [];

      for (const rule of rules) {
        const isMatch = await this.evaluateRule(rule, patientProfile);

        if (isMatch.matches) {
          matchingRecommendations.push({
            id: `recommendation_${rule.id}`,
            ruleId: rule.id,
            name: rule.product_title || rule.name,
            description: rule.product_description || rule.description,
            reason: rule.reason_text || rule.reason,
            priority: rule.priority || 1,
            confidence: isMatch.confidence,
            category: this.inferCategoryFromRule(rule),
            product_type: this.inferProductType(rule),
            price: this.estimatePrice(rule),
            source: 'ai_recommendation',
          });
        }
      }

      return matchingRecommendations;
    } catch (error) {
      console.error('Error fetching base recommendations:', error);
      // Fallback to AI-generated recommendations
      return await this.generateAIRecommendations(patientProfile);
    }
  }

  /**
   * Generate AI-powered recommendations when database rules are not available
   */
  async generateAIRecommendations(patientProfile: any) {
    try {
      const prompt = `
        Generate personalized healthcare product recommendations for a patient with the following profile:
        - BMI: ${patientProfile.bmi || 'Not provided'}
        - Health Goals: ${patientProfile.goals?.join(', ') || 'General wellness'}
        - Medical Conditions: ${patientProfile.conditions?.join(', ') || 'None specified'}
        - Age: ${patientProfile.age || 'Not provided'}

        Please provide 3-5 specific product recommendations in JSON format with the following structure:
        {
          "recommendations": [
            {
              "name": "Product Name",
              "description": "Brief description",
              "reason": "Why this is recommended for this patient",
              "category": "weight_management|supplements|cardiovascular|general",
              "product_type": "subscription|one_time",
              "priority": 1-10,
              "confidence": 0.1-1.0,
              "price": estimated_price_number
            }
          ]
        }
      `;

      const aiResponse = await generateStructuredContent(prompt, 'json');
      const parsedResponse = JSON.parse(aiResponse);
      
      return parsedResponse.recommendations?.map((rec: any, index: number) => ({
        id: `ai_recommendation_${index}`,
        ...rec,
        source: 'ai_generated'
      })) || [];
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return [];
    }
  }

  /**
   * Evaluate if a recommendation rule matches the patient profile
   */
  async evaluateRule(rule: any, patientProfile: any) {
    try {
      const conditionValue = typeof rule.condition_value === 'string'
        ? JSON.parse(rule.condition_value)
        : rule.condition_value;

      switch (rule.condition_type) {
        case 'bmi':
          return this.evaluateBMICondition(conditionValue, patientProfile.bmi);
        case 'goal':
          return this.evaluateGoalCondition(conditionValue, patientProfile.goals);
        case 'condition':
          return this.evaluateConditionCondition(conditionValue, patientProfile.conditions);
        case 'age':
          return this.evaluateAgeCondition(conditionValue, patientProfile.age);
        case 'combination':
          return this.evaluateCombinationCondition(conditionValue, patientProfile);
        default:
          return { matches: false, confidence: 0 };
      }
    } catch (error) {
      console.error('Error evaluating rule:', rule.id, error);
      return { matches: false, confidence: 0 };
    }
  }

  private evaluateBMICondition(condition: any, bmi: number) {
    if (!bmi || !condition.value) return { matches: false, confidence: 0 };

    let matches = false;
    let confidence = 0;

    switch (condition.operator) {
      case 'gt':
        matches = bmi > condition.value;
        confidence = matches ? Math.min(0.9, 0.5 + (bmi - condition.value) / 10) : 0;
        break;
      case 'lt':
        matches = bmi < condition.value;
        confidence = matches ? Math.min(0.9, 0.5 + (condition.value - bmi) / 10) : 0;
        break;
      case 'eq':
        matches = Math.abs(bmi - condition.value) <= 1;
        confidence = matches ? 0.8 : 0;
        break;
      case 'between':
        matches = bmi >= condition.min && bmi <= condition.max;
        confidence = matches ? 0.8 : 0;
        break;
    }

    return { matches, confidence };
  }

  private evaluateGoalCondition(condition: any, goals: string[]) {
    if (!goals || !goals.length) return { matches: false, confidence: 0 };

    const goalString = goals.join(' ').toLowerCase();
    let matches = false;
    let confidence = 0;

    switch (condition.operator) {
      case 'includes':
        matches = goalString.includes(condition.value.toLowerCase());
        confidence = matches ? 0.8 : 0;
        break;
      case 'any':
        matches = condition.values?.some((value: string) =>
          goalString.includes(value.toLowerCase())
        ) || false;
        confidence = matches ? 0.7 : 0;
        break;
      case 'all':
        matches = condition.values?.every((value: string) =>
          goalString.includes(value.toLowerCase())
        ) || false;
        confidence = matches ? 0.9 : 0;
        break;
    }

    return { matches, confidence };
  }

  private evaluateConditionCondition(condition: any, conditions: string[]) {
    if (!conditions || !conditions.length) return { matches: false, confidence: 0 };

    const conditionString = conditions.join(' ').toLowerCase();

    switch (condition.operator) {
      case 'includes':
        const matches = conditionString.includes(condition.value.toLowerCase());
        return { matches, confidence: matches ? 0.9 : 0 };
      default:
        return { matches: false, confidence: 0 };
    }
  }

  private evaluateAgeCondition(condition: any, age: number) {
    if (!age) return { matches: false, confidence: 0 };

    let matches = false;

    switch (condition.operator) {
      case 'gt':
        matches = age > condition.value;
        break;
      case 'lt':
        matches = age < condition.value;
        break;
      case 'between':
        matches = age >= condition.min && age <= condition.max;
        break;
    }

    return { matches, confidence: matches ? 0.7 : 0 };
  }

  private evaluateCombinationCondition(condition: any, patientProfile: any) {
    if (!condition.conditions || !condition.conditions.length) {
      return { matches: false, confidence: 0 };
    }

    const results = condition.conditions.map((cond: any) => {
      switch (cond.type) {
        case 'bmi':
          return this.evaluateBMICondition(cond, patientProfile.bmi);
        case 'goal':
          return this.evaluateGoalCondition(cond, patientProfile.goals);
        case 'condition':
          return this.evaluateConditionCondition(cond, patientProfile.conditions);
        case 'age':
          return this.evaluateAgeCondition(cond, patientProfile.age);
        default:
          return { matches: false, confidence: 0 };
      }
    });

    const logic = condition.logic || 'and';
    let matches = false;
    let confidence = 0;

    if (logic === 'and') {
      matches = results.every((r) => r.matches);
      confidence = matches
        ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        : 0;
    } else if (logic === 'or') {
      matches = results.some((r) => r.matches);
      const matchingResults = results.filter((r) => r.matches);
      confidence = matchingResults.length > 0
        ? Math.max(...matchingResults.map((r) => r.confidence))
        : 0;
    }

    return { matches, confidence };
  }

  /**
   * Helper methods
   */
  private calculateBMI(basicInfo: any) {
    if (!basicInfo?.height || !basicInfo?.weight) return null;

    try {
      // Handle different height formats
      let heightInches;
      if (basicInfo.heightFeet && basicInfo.heightInches) {
        heightInches = basicInfo.heightFeet * 12 + basicInfo.heightInches;
      } else if (basicInfo.height) {
        // Assume height is in inches if single value
        heightInches = parseFloat(basicInfo.height);
      } else {
        return null;
      }

      const weightLbs = parseFloat(basicInfo.weight);
      const heightMeters = heightInches * 0.0254;
      const weightKg = weightLbs * 0.453592;

      return Math.round((weightKg / (heightMeters * heightMeters)) * 10) / 10;
    } catch (error) {
      console.error('Error calculating BMI:', error);
      return null;
    }
  }

  private extractGoals(formData: any): string[] {
    const goals: string[] = [];

    // Check various locations where goals might be stored
    if (formData.goals) {
      goals.push(...(Array.isArray(formData.goals) ? formData.goals : [formData.goals]));
    }

    if (formData.treatmentPreferences?.goals) {
      goals.push(...(Array.isArray(formData.treatmentPreferences.goals)
        ? formData.treatmentPreferences.goals
        : [formData.treatmentPreferences.goals]));
    }

    if (formData.healthHistory?.goals) {
      goals.push(...(Array.isArray(formData.healthHistory.goals)
        ? formData.healthHistory.goals
        : [formData.healthHistory.goals]));
    }

    return [...new Set(goals.filter(Boolean))]; // Remove duplicates and falsy values
  }

  private extractConditions(formData: any): string[] {
    const conditions: string[] = [];

    if (formData.healthHistory?.conditions) {
      conditions.push(...(Array.isArray(formData.healthHistory.conditions)
        ? formData.healthHistory.conditions
        : [formData.healthHistory.conditions]));
    }

    if (formData.healthHistory?.medicalConditions) {
      conditions.push(...(Array.isArray(formData.healthHistory.medicalConditions)
        ? formData.healthHistory.medicalConditions
        : [formData.healthHistory.medicalConditions]));
    }

    return [...new Set(conditions.filter(Boolean))];
  }

  private filterExistingProducts(recommendations: any[], selectedProducts: any[]) {
    const selectedIds = selectedProducts.map((p) => p.id);
    const selectedNames = selectedProducts.map((p) => p.name?.toLowerCase());

    return recommendations.filter(
      (rec) =>
        !selectedIds.includes(rec.id) &&
        !selectedNames.includes(rec.name?.toLowerCase())
    );
  }

  private categorizeRecommendations(recommendations: any[]) {
    const subscriptionUpgrades = recommendations.filter(
      (r) => r.product_type === 'subscription' || r.category === 'prescription'
    );

    const oneTimeAddons = recommendations.filter(
      (r) => r.product_type === 'one_time' || r.category === 'supplement'
    );

    const bundleOptimizations = recommendations.filter(
      (r) => r.product_type === 'bundle' || r.name?.toLowerCase().includes('bundle')
    );

    return {
      subscriptionUpgrades,
      oneTimeAddons,
      bundleOptimizations,
    };
  }

  private inferCategoryFromRule(rule: any) {
    const title = rule.product_title?.toLowerCase() || rule.name?.toLowerCase() || '';
    const description = rule.product_description?.toLowerCase() || rule.description?.toLowerCase() || '';

    if (title.includes('weight') || description.includes('weight')) return 'weight_management';
    if (title.includes('energy') || description.includes('energy')) return 'energy';
    if (title.includes('hair') || description.includes('hair')) return 'hair_loss';
    if (title.includes('heart') || description.includes('heart')) return 'cardiovascular';
    if (title.includes('vitamin') || description.includes('vitamin')) return 'supplements';

    return 'general';
  }

  private inferProductType(rule: any) {
    const title = rule.product_title?.toLowerCase() || rule.name?.toLowerCase() || '';

    if (title.includes('bundle') || title.includes('program') || title.includes('plan')) {
      return 'subscription';
    }
    if (title.includes('supplement') || title.includes('vitamin') || title.includes('mineral')) {
      return 'one_time';
    }

    return 'one_time'; // Default
  }

  private estimatePrice(rule: any) {
    const title = rule.product_title?.toLowerCase() || rule.name?.toLowerCase() || '';

    // Basic price estimation based on product type
    if (title.includes('premium') || title.includes('complete')) return 399;
    if (title.includes('basic') || title.includes('starter')) return 299;
    if (title.includes('supplement') || title.includes('vitamin')) return 49;
    if (title.includes('bundle')) return 349;

    return 99; // Default price
  }

  private generateCacheKey(formData: any, selectedProducts: any[]) {
    const keyData = {
      bmi: this.calculateBMI(formData.basicInfo),
      goals: this.extractGoals(formData).sort(),
      conditions: this.extractConditions(formData).sort(),
      selectedProductIds: selectedProducts.map((p) => p.id).sort(),
    };

    return JSON.stringify(keyData);
  }

  /**
   * Bundle optimization logic (simplified version)
   */
  private async optimizeCart(selectedProducts: any[], availablePlans: any[], patientProfile: any) {
    try {
      // Use AI to generate bundle optimization suggestions
      const prompt = `
        Analyze the following cart and suggest optimizations:
        
        Selected Products: ${selectedProducts.map(p => p.name).join(', ')}
        Available Plans: ${availablePlans.map(p => p.name).join(', ')}
        Patient Goals: ${patientProfile.goals?.join(', ') || 'General wellness'}
        
        Suggest bundle optimizations that could save money or provide better value.
        Respond in JSON format:
        {
          "optimization": {
            "suggestedPlan": "plan_name",
            "potentialSavings": number,
            "reasoning": "explanation",
            "confidence": 0.1-1.0
          }
        }
      `;

      const aiResponse = await generateStructuredContent(prompt, 'json');
      const parsedResponse = JSON.parse(aiResponse);
      
      return parsedResponse.optimization;
    } catch (error) {
      console.error('Error optimizing cart:', error);
      return null;
    }
  }

  /**
   * Clear recommendation cache
   */
  clearCache() {
    this.recommendationCache.clear();
  }

  /**
   * Get recommendation analytics
   */
  async getRecommendationAnalytics(patientId: string, timeRange = 30) {
    try {
      // Get analytics from Firebase
      const analyticsResponse = await databaseService.auditLogs.getMany({
        filters: [
          { field: 'patientId', operator: '==', value: patientId },
          { field: 'action', operator: '==', value: 'recommendation_generated' },
          { field: 'createdAt', operator: '>=', value: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000) }
        ]
      });

      if (!analyticsResponse.success) {
        return null;
      }

      const data = analyticsResponse.data;
      const analytics = {
        totalRecommendations: data.length,
        acceptedRecommendations: data.filter((d: any) => d.optimization_accepted).length,
        totalSavingsOffered: data.reduce((sum: number, d: any) => sum + (d.savings_offered || 0), 0),
        totalSavingsRealized: data.reduce((sum: number, d: any) => sum + (d.savings_realized || 0), 0),
        acceptanceRate: data.length > 0
          ? (data.filter((d: any) => d.optimization_accepted).length / data.length) * 100
          : 0,
      };

      return analytics;
    } catch (error) {
      console.error('Error getting recommendation analytics:', error);
      return null;
    }
  }

  /**
   * Get subscription plans with popularity indicators
   */
  async getSubscriptionPlans() {
    try {
      // Try to get plans from Firebase first
      const plansResponse = await databaseService.products.getMany({
        filters: [
          { field: 'type', operator: '==', value: 'subscription_plan' }
        ]
      });

      if (plansResponse.success && plansResponse.data.length > 0) {
        return plansResponse.data;
      }

      // Fallback to mock subscription plans for testing
      return [
        {
          id: 'basic',
          name: 'Basic Plan',
          price: 29,
          billingCycle: 'monthly',
          isPopular: false,
          features: [
            'Monthly health check-ins',
            'Basic medication management',
            'Email support',
          ],
        },
        {
          id: 'standard',
          name: 'Standard Plan',
          price: 49,
          billingCycle: 'monthly',
          isPopular: true,
          features: [
            'Bi-weekly consultations',
            'Advanced medication tracking',
            '24/7 chat support',
            'Personalized health insights',
          ],
        },
        {
          id: 'premium',
          name: 'Premium Plan',
          price: 79,
          billingCycle: 'monthly',
          isPopular: false,
          features: [
            'Weekly consultations',
            'Priority specialist referrals',
            'Dedicated care coordinator',
            'Emergency consultations',
          ],
        },
      ];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  /**
   * Generate hybrid reasoning that connects popularity with personalization
   */
  async generateHybridReasoning(formData: any, recommendedPlan: any, category: string) {
    try {
      const userGoals = formData.healthGoals || ['weight_management'];
      const userAge = formData.age || 28;
      const consultationPreference = formData.preferences?.consultationFrequency || 'bi-weekly';

      // Use AI to generate personalized reasoning
      const prompt = `
        Generate personalized reasoning for why the ${recommendedPlan.name} is recommended for a patient with:
        - Health Goals: ${userGoals.join(' and ')}
        - Age: ${userAge}
        - Consultation Preference: ${consultationPreference}
        - Category: ${category}
        - Plan Price: $${recommendedPlan.price}/month
        
        The reasoning should mention both popularity and personalization. Keep it under 100 words.
      `;

      const reasoning = await generateContent(prompt);
      return reasoning;
    } catch (error) {
      console.error('Error generating hybrid reasoning:', error);
      return `The ${recommendedPlan?.name || 'Standard Plan'} is our most popular choice and provides the best value for your health goals.`;
    }
  }
}

// Export singleton instance
export const aiRecommendationService = new AIRecommendationService();
export default aiRecommendationService;
