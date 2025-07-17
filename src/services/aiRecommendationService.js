import { supabase } from '../lib/supabase';
import { bundleOptimizationService } from './bundleOptimizationService';

/**
 * Enhanced AI Recommendation Service
 *
 * Generates personalized product recommendations and integrates with
 * bundle optimization to provide smart cart suggestions.
 */
export class AIRecommendationService {
  constructor() {
    this.recommendationCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate comprehensive recommendations including bundles and optimizations
   */
  async generateRecommendations(
    formData,
    selectedProducts = [],
    availablePlans = []
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

      // Get base AI recommendations from existing rule engine
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
        bundleOptimization = await bundleOptimizationService.optimizeCart(
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
        metadata: { error: error.message },
      };
    }
  }

  /**
   * Get base recommendations from the product recommendation rules
   */
  async getBaseRecommendations(patientProfile) {
    try {
      const { data: rules, error } = await supabase
        .from('product_recommendation_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;

      const matchingRecommendations = [];

      for (const rule of rules) {
        const isMatch = await this.evaluateRule(rule, patientProfile);

        if (isMatch.matches) {
          matchingRecommendations.push({
            id: `recommendation_${rule.id}`,
            ruleId: rule.id,
            name: rule.product_title,
            description: rule.product_description,
            reason: rule.reason_text,
            priority: rule.priority,
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
      return [];
    }
  }

  /**
   * Evaluate if a recommendation rule matches the patient profile
   */
  async evaluateRule(rule, patientProfile) {
    try {
      const conditionValue =
        typeof rule.condition_value === 'string'
          ? JSON.parse(rule.condition_value)
          : rule.condition_value;

      switch (rule.condition_type) {
        case 'bmi':
          return this.evaluateBMICondition(conditionValue, patientProfile.bmi);

        case 'goal':
          return this.evaluateGoalCondition(
            conditionValue,
            patientProfile.goals
          );

        case 'condition':
          return this.evaluateConditionCondition(
            conditionValue,
            patientProfile.conditions
          );

        case 'age':
          return this.evaluateAgeCondition(conditionValue, patientProfile.age);

        case 'combination':
          return this.evaluateCombinationCondition(
            conditionValue,
            patientProfile
          );

        default:
          return { matches: false, confidence: 0 };
      }
    } catch (error) {
      console.error('Error evaluating rule:', rule.id, error);
      return { matches: false, confidence: 0 };
    }
  }

  evaluateBMICondition(condition, bmi) {
    if (!bmi || !condition.value) return { matches: false, confidence: 0 };

    let matches = false;
    let confidence = 0;

    switch (condition.operator) {
      case 'gt':
        matches = bmi > condition.value;
        confidence = matches
          ? Math.min(0.9, 0.5 + (bmi - condition.value) / 10)
          : 0;
        break;
      case 'lt':
        matches = bmi < condition.value;
        confidence = matches
          ? Math.min(0.9, 0.5 + (condition.value - bmi) / 10)
          : 0;
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

  evaluateGoalCondition(condition, goals) {
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
        matches =
          condition.values?.some((value) =>
            goalString.includes(value.toLowerCase())
          ) || false;
        confidence = matches ? 0.7 : 0;
        break;
      case 'all':
        matches =
          condition.values?.every((value) =>
            goalString.includes(value.toLowerCase())
          ) || false;
        confidence = matches ? 0.9 : 0;
        break;
    }

    return { matches, confidence };
  }

  evaluateConditionCondition(condition, conditions) {
    if (!conditions || !conditions.length)
      return { matches: false, confidence: 0 };

    const conditionString = conditions.join(' ').toLowerCase();

    switch (condition.operator) {
      case 'includes':
        const matches = conditionString.includes(condition.value.toLowerCase());
        return { matches, confidence: matches ? 0.9 : 0 };
      default:
        return { matches: false, confidence: 0 };
    }
  }

  evaluateAgeCondition(condition, age) {
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

  evaluateCombinationCondition(condition, patientProfile) {
    if (!condition.conditions || !condition.conditions.length) {
      return { matches: false, confidence: 0 };
    }

    const results = condition.conditions.map((cond) => {
      switch (cond.type) {
        case 'bmi':
          return this.evaluateBMICondition(cond, patientProfile.bmi);
        case 'goal':
          return this.evaluateGoalCondition(cond, patientProfile.goals);
        case 'condition':
          return this.evaluateConditionCondition(
            cond,
            patientProfile.conditions
          );
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
      confidence =
        matchingResults.length > 0
          ? Math.max(...matchingResults.map((r) => r.confidence))
          : 0;
    }

    return { matches, confidence };
  }

  /**
   * Helper methods
   */
  calculateBMI(basicInfo) {
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

  extractGoals(formData) {
    const goals = [];

    // Check various locations where goals might be stored
    if (formData.goals) {
      goals.push(
        ...(Array.isArray(formData.goals) ? formData.goals : [formData.goals])
      );
    }

    if (formData.treatmentPreferences?.goals) {
      goals.push(
        ...(Array.isArray(formData.treatmentPreferences.goals)
          ? formData.treatmentPreferences.goals
          : [formData.treatmentPreferences.goals])
      );
    }

    if (formData.healthHistory?.goals) {
      goals.push(
        ...(Array.isArray(formData.healthHistory.goals)
          ? formData.healthHistory.goals
          : [formData.healthHistory.goals])
      );
    }

    return [...new Set(goals.filter(Boolean))]; // Remove duplicates and falsy values
  }

  extractConditions(formData) {
    const conditions = [];

    if (formData.healthHistory?.conditions) {
      conditions.push(
        ...(Array.isArray(formData.healthHistory.conditions)
          ? formData.healthHistory.conditions
          : [formData.healthHistory.conditions])
      );
    }

    if (formData.healthHistory?.medicalConditions) {
      conditions.push(
        ...(Array.isArray(formData.healthHistory.medicalConditions)
          ? formData.healthHistory.medicalConditions
          : [formData.healthHistory.medicalConditions])
      );
    }

    return [...new Set(conditions.filter(Boolean))];
  }

  filterExistingProducts(recommendations, selectedProducts) {
    const selectedIds = selectedProducts.map((p) => p.id);
    const selectedNames = selectedProducts.map((p) => p.name?.toLowerCase());

    return recommendations.filter(
      (rec) =>
        !selectedIds.includes(rec.id) &&
        !selectedNames.includes(rec.name?.toLowerCase())
    );
  }

  categorizeRecommendations(recommendations) {
    const subscriptionUpgrades = recommendations.filter(
      (r) => r.product_type === 'subscription' || r.category === 'prescription'
    );

    const oneTimeAddons = recommendations.filter(
      (r) => r.product_type === 'one_time' || r.category === 'supplement'
    );

    const bundleOptimizations = recommendations.filter(
      (r) =>
        r.product_type === 'bundle' || r.name?.toLowerCase().includes('bundle')
    );

    return {
      subscriptionUpgrades,
      oneTimeAddons,
      bundleOptimizations,
    };
  }

  inferCategoryFromRule(rule) {
    const title = rule.product_title?.toLowerCase() || '';
    const description = rule.product_description?.toLowerCase() || '';

    if (title.includes('weight') || description.includes('weight'))
      return 'weight_management';
    if (title.includes('energy') || description.includes('energy'))
      return 'energy';
    if (title.includes('hair') || description.includes('hair'))
      return 'hair_loss';
    if (title.includes('heart') || description.includes('heart'))
      return 'cardiovascular';
    if (title.includes('vitamin') || description.includes('vitamin'))
      return 'supplements';

    return 'general';
  }

  inferProductType(rule) {
    const title = rule.product_title?.toLowerCase() || '';

    if (
      title.includes('bundle') ||
      title.includes('program') ||
      title.includes('plan')
    ) {
      return 'subscription';
    }
    if (
      title.includes('supplement') ||
      title.includes('vitamin') ||
      title.includes('mineral')
    ) {
      return 'one_time';
    }

    return 'one_time'; // Default
  }

  estimatePrice(rule) {
    const title = rule.product_title?.toLowerCase() || '';

    // Basic price estimation based on product type
    if (title.includes('premium') || title.includes('complete')) return 399;
    if (title.includes('basic') || title.includes('starter')) return 299;
    if (title.includes('supplement') || title.includes('vitamin')) return 49;
    if (title.includes('bundle')) return 349;

    return 99; // Default price
  }

  generateCacheKey(formData, selectedProducts) {
    const keyData = {
      bmi: this.calculateBMI(formData.basicInfo),
      goals: this.extractGoals(formData).sort(),
      conditions: this.extractConditions(formData).sort(),
      selectedProductIds: selectedProducts.map((p) => p.id).sort(),
    };

    return JSON.stringify(keyData);
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
  async getRecommendationAnalytics(patientId, timeRange = 30) {
    try {
      const { data, error } = await supabase
        .from('bundle_optimization_history')
        .select('*')
        .eq('patient_id', patientId)
        .gte(
          'created_at',
          new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString()
        );

      if (error) throw error;

      const analytics = {
        totalRecommendations: data.length,
        acceptedRecommendations: data.filter((d) => d.optimization_accepted)
          .length,
        totalSavingsOffered: data.reduce(
          (sum, d) => sum + (d.savings_offered || 0),
          0
        ),
        totalSavingsRealized: data.reduce(
          (sum, d) => sum + (d.savings_realized || 0),
          0
        ),
        acceptanceRate:
          data.length > 0
            ? (data.filter((d) => d.optimization_accepted).length /
                data.length) *
              100
            : 0,
      };

      return analytics;
    } catch (error) {
      console.error('Error getting recommendation analytics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const aiRecommendationService = new AIRecommendationService();
export default aiRecommendationService;
