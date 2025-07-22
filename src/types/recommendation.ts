import { BaseDocument } from '@/lib/database';

export interface SubscriptionPlan extends BaseDocument {
  name: string;
  price: number;
  billingCycle: string;
  isPopular: boolean;
  features: string[];
  type?: string;
}

export interface ProductRecommendationRule extends BaseDocument {
  product_title?: string;
  name?: string;
  product_description?: string;
  description?: string;
  reason_text?: string;
  reason?: string;
  priority?: number;
  condition_type?: string;
  condition_value?: any;
  type?: string;
}

export interface RecommendationItem {
  id: string;
  ruleId?: string;
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

export interface PatientProfile {
  id?: string;
  bmi?: number;
  goals?: string[];
  conditions?: string[];
  age?: number;
  formData?: any;
}

export interface RecommendationResponse {
  subscriptionUpgrades: RecommendationItem[];
  oneTimeAddons: RecommendationItem[];
  bundleOptimizations: RecommendationItem[];
  bundleOptimization?: BundleOptimization | null;
  metadata: {
    bmi?: number;
    goals?: string[];
    conditions?: string[];
    recommendationCount?: number;
    optimizationAvailable?: boolean;
    error?: string;
  };
}

export interface BundleOptimization {
  suggestedPlan: string;
  potentialSavings: number;
  reasoning: string;
  confidence: number;
}

export interface HybridRecommendationResponse {
  recommendedPlan: SubscriptionPlan | null;
  personalizedReasoning: string | null;
  reasoning: string | null;
  isHybridApproach?: boolean;
  metadata?: {
    category: string;
    planCount: number;
    timestamp: number;
  };
  error?: string;
}

export interface RecommendationAnalytics {
  totalRecommendations: number;
  acceptedRecommendations: number;
  totalSavingsOffered: number;
  totalSavingsRealized: number;
  acceptanceRate: number;
}

export interface RuleEvaluationResult {
  matches: boolean;
  confidence: number;
}
