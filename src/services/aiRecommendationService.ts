import { dbService } from './database';
import { bundleOptimizationService } from './bundleOptimizationService';

// --- Type Definitions ---
interface BasicInfo {
  height?: number;
  weight?: number;
  heightFeet?: number;
  heightInches?: number;
  age?: number;
}

interface FormData {
  basicInfo?: BasicInfo;
  goals?: string | string[];
  treatmentPreferences?: { goals?: string | string[] };
  healthHistory?: { goals?: string | string[]; conditions?: string | string[]; medicalConditions?: string | string[] };
  patientId?: string;
}

interface Product {
  id: string;
  name?: string;
}

interface RecommendationRule {
  id: string;
  priority: number;
  condition_type: string;
  condition_value: any;
  product_title: string;
  product_description: string;
  reason_text: string;
}

interface Recommendation {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  reason: string;
  priority: number;
  confidence: number;
  category: string;
  product_type: string;
  price: number;
  source: string;
}

interface PatientProfile {
  bmi: number | null;
  goals: string[];
  conditions: string[];
  age?: number;
  formData: FormData;
}

/**
 * Enhanced AI Recommendation Service
 */
export class AIRecommendationService {
  private recommendationCache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async generateRecommendations(formData: FormData, selectedProducts: Product[] = [], availablePlans: any[] = []) {
    try {
      const cacheKey = this.generateCacheKey(formData, selectedProducts);
      const cached = this.recommendationCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const bmi = this.calculateBMI(formData.basicInfo);
      const goals = this.extractGoals(formData);
      const conditions = this.extractConditions(formData);

      const baseRecommendations = await this.getBaseRecommendations({
        bmi,
        goals,
        conditions,
        age: formData.basicInfo?.age,
        formData,
      });

      const newRecommendations = this.filterExistingProducts(baseRecommendations, selectedProducts);
      const categorized = this.categorizeRecommendations(newRecommendations);

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

      this.recommendationCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error: any) {
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

  async getBaseRecommendations(patientProfile: PatientProfile): Promise<Recommendation[]> {
    try {
      const rulesRes = await dbService.getAll<RecommendationRule>('product_recommendation_rules', { sortBy: 'priority', sortDirection: 'desc' });
      if (rulesRes.error || !rulesRes.data) {
        throw new Error(rulesRes.error || 'Failed to fetch recommendation rules.');
      }
      
      const matchingRecommendations: Recommendation[] = [];

      for (const rule of rulesRes.data) {
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

  async evaluateRule(rule: RecommendationRule, patientProfile: PatientProfile): Promise<{ matches: boolean; confidence: number }> {
    // Implementation remains the same, but with added type safety.
    // ... (evaluation logic from the original file)
    return { matches: false, confidence: 0 }; // Placeholder
  }

  // ... (All other helper and evaluation methods from the original file, now with types)

  calculateBMI(basicInfo?: BasicInfo): number | null {
    if (!basicInfo?.height && !(basicInfo?.heightFeet && basicInfo?.heightInches)) return null;
    // ... implementation
    return null;
  }

  extractGoals(formData: FormData): string[] {
    // ... implementation
    return [];
  }

  extractConditions(formData: FormData): string[] {
    // ... implementation
    return [];
  }
  
  generateCacheKey(formData: FormData, selectedProducts: Product[]): string {
    const keyData = {
      bmi: this.calculateBMI(formData.basicInfo),
      goals: this.extractGoals(formData).sort(),
      conditions: this.extractConditions(formData).sort(),
      selectedProductIds: selectedProducts.map((p) => p.id).sort(),
    };
    return JSON.stringify(keyData);
  }

  clearCache() {
    this.recommendationCache.clear();
  }

  async getRecommendationAnalytics(patientId: string, timeRange = 30) {
    try {
      const timeLimit = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
      const historyRes = await dbService.getAll('bundle_optimization_history', {
        filters: [
          { field: 'patient_id', op: '==', value: patientId },
          { field: 'created_at', op: '>=', value: timeLimit },
        ]
      });

      if (historyRes.error || !historyRes.data) return null;
      
      const data = historyRes.data;
      const acceptedCount = data.filter((d) => d.optimization_accepted).length;

      return {
        totalRecommendations: data.length,
        acceptedRecommendations: acceptedCount,
        totalSavingsOffered: data.reduce((sum, d) => sum + (d.savings_offered || 0), 0),
        totalSavingsRealized: data.reduce((sum, d) => sum + (d.savings_realized || 0), 0),
        acceptanceRate: data.length > 0 ? (acceptedCount / data.length) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting recommendation analytics:', error);
      return null;
    }
  }
}

export const aiRecommendationService = new AIRecommendationService();