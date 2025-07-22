/**
 * Bundle Optimization Service
 * 
 * Optimizes product bundles and treatment packages for performance and cost-effectiveness.
 * Handles bundle creation, pricing optimization, and performance analytics.
 * Adapted from the old repository to work with Firebase and modern TypeScript.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

// Bundle optimization interfaces
export interface ProductBundle {
  id: string;
  name: string;
  description: string;
  bundleType: 'treatment_package' | 'product_combo' | 'subscription_bundle' | 'seasonal_offer';
  status: 'active' | 'inactive' | 'draft' | 'optimizing';
  products: BundleProduct[];
  pricing: BundlePricing;
  optimization: OptimizationSettings;
  performance: BundlePerformance;
  targetAudience: TargetAudience;
  restrictions?: BundleRestrictions;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface BundleProduct {
  productId: string;
  productName: string;
  quantity: number;
  originalPrice: number;
  bundlePrice: number;
  discountPercentage: number;
  isRequired: boolean;
  isOptional: boolean;
  category: string;
  weight: number; // For optimization scoring
  metadata?: Record<string, any>;
}

export interface BundlePricing {
  originalTotalPrice: number;
  bundlePrice: number;
  totalSavings: number;
  savingsPercentage: number;
  currency: 'USD' | 'EUR' | 'GBP';
  pricingStrategy: 'fixed_discount' | 'percentage_discount' | 'value_based' | 'competitive';
  dynamicPricing: boolean;
  priceHistory: PriceHistoryEntry[];
}

export interface PriceHistoryEntry {
  price: number;
  date: Timestamp;
  reason: string;
  performanceImpact?: number;
}

export interface OptimizationSettings {
  enabled: boolean;
  optimizationGoals: OptimizationGoal[];
  constraints: OptimizationConstraint[];
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  lastOptimized?: Timestamp;
  nextOptimization?: Timestamp;
  optimizationHistory: OptimizationResult[];
}

export interface OptimizationGoal {
  type: 'maximize_revenue' | 'maximize_conversion' | 'maximize_margin' | 'minimize_cost' | 'maximize_satisfaction';
  weight: number;
  target?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface OptimizationConstraint {
  type: 'min_margin' | 'max_discount' | 'min_price' | 'max_price' | 'inventory_limit';
  value: number;
  description: string;
}

export interface OptimizationResult {
  id: string;
  timestamp: Timestamp;
  previousConfiguration: Partial<ProductBundle>;
  newConfiguration: Partial<ProductBundle>;
  expectedImpact: {
    revenueChange: number;
    conversionChange: number;
    marginChange: number;
  };
  actualImpact?: {
    revenueChange: number;
    conversionChange: number;
    marginChange: number;
    measurementPeriod: number; // days
  };
  status: 'pending' | 'applied' | 'reverted' | 'measuring';
}

export interface BundlePerformance {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageOrderValue: number;
  customerSatisfaction?: number;
  returnRate?: number;
  profitMargin: number;
  lastUpdated: Timestamp;
  trends: PerformanceTrend[];
}

export interface PerformanceTrend {
  metric: string;
  period: 'daily' | 'weekly' | 'monthly';
  values: { date: Timestamp; value: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}

export interface TargetAudience {
  demographics: {
    ageRange?: { min: number; max: number };
    gender?: 'male' | 'female' | 'all';
    location?: string[];
  };
  conditions?: string[];
  purchaseHistory?: {
    minOrders?: number;
    categories?: string[];
    priceRange?: { min: number; max: number };
  };
  preferences?: string[];
}

export interface BundleRestrictions {
  maxQuantity?: number;
  validFrom?: Timestamp;
  validUntil?: Timestamp;
  geographicRestrictions?: string[];
  customerRestrictions?: string[];
  inventoryDependent?: boolean;
}

export interface BundleRecommendation {
  bundleId: string;
  score: number;
  reasons: string[];
  expectedSavings: number;
  matchingProducts: string[];
  confidence: number;
}

export interface OptimizationSuggestion {
  type: 'pricing' | 'product_mix' | 'targeting' | 'timing';
  description: string;
  expectedImpact: number;
  confidence: number;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Bundle Optimization Service Class
 */
export class BundleOptimizationService {
  private db = getFirebaseFirestore();

  /**
   * Create a new product bundle
   */
  async createProductBundle(bundleData: Omit<ProductBundle, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductBundle> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate initial pricing
      const optimizedPricing = this.calculateOptimalPricing(bundleData.products, bundleData.pricing.pricingStrategy);
      
      const bundle: ProductBundle = {
        id: bundleId,
        ...bundleData,
        pricing: {
          ...bundleData.pricing,
          ...optimizedPricing,
          priceHistory: [{
            price: optimizedPricing.bundlePrice,
            date: Timestamp.now(),
            reason: 'Initial bundle creation'
          }]
        },
        performance: {
          views: 0,
          conversions: 0,
          conversionRate: 0,
          revenue: 0,
          averageOrderValue: 0,
          profitMargin: optimizedPricing.savingsPercentage,
          lastUpdated: Timestamp.now(),
          trends: []
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(this.db, 'product_bundles', bundleId), bundle);

      console.log('Created product bundle:', bundleId);
      return bundle;
    } catch (error) {
      console.error('Error creating product bundle:', error);
      throw new Error(`Failed to create bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize bundle pricing and composition
   */
  async optimizeBundle(bundleId: string, goals?: OptimizationGoal[]): Promise<OptimizationResult> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const bundle = await this.getProductBundle(bundleId);
      if (!bundle) {
        throw new Error('Bundle not found');
      }

      // Get performance data for optimization
      const performanceData = await this.getBundlePerformanceData(bundleId);
      
      // Run optimization algorithm
      const optimizationResult = await this.runOptimizationAlgorithm(bundle, performanceData, goals);
      
      // Apply optimization if beneficial
      if (optimizationResult.expectedImpact.revenueChange > 0) {
        await this.applyOptimization(bundleId, optimizationResult);
      }

      return optimizationResult;
    } catch (error) {
      console.error('Error optimizing bundle:', error);
      throw new Error(`Failed to optimize bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get bundle recommendations for a customer
   */
  async getBundleRecommendations(
    customerId: string,
    context?: {
      currentCart?: string[];
      purchaseHistory?: any[];
      preferences?: string[];
    }
  ): Promise<BundleRecommendation[]> {
    try {
      if (!this.db) return [];

      // Get customer data
      const customerDoc = await getDoc(doc(this.db, 'patients', customerId));
      if (!customerDoc.exists()) {
        return [];
      }

      const customer = customerDoc.data();
      
      // Get active bundles
      const activeBundles = await this.getProductBundles({ status: 'active' });
      
      const recommendations: BundleRecommendation[] = [];

      for (const bundle of activeBundles) {
        const score = this.calculateRecommendationScore(customer, bundle, context);
        
        if (score > 0.3) { // Minimum threshold
          const recommendation: BundleRecommendation = {
            bundleId: bundle.id,
            score,
            reasons: this.generateRecommendationReasons(customer, bundle, context),
            expectedSavings: bundle.pricing.totalSavings,
            matchingProducts: this.getMatchingProducts(customer, bundle, context),
            confidence: this.calculateConfidence(customer, bundle, context)
          };
          
          recommendations.push(recommendation);
        }
      }

      // Sort by score descending
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting bundle recommendations:', error);
      return [];
    }
  }

  /**
   * Get optimization suggestions for a bundle
   */
  async getOptimizationSuggestions(bundleId: string): Promise<OptimizationSuggestion[]> {
    try {
      if (!this.db) return [];

      const bundle = await this.getProductBundle(bundleId);
      if (!bundle) {
        return [];
      }

      const performanceData = await this.getBundlePerformanceData(bundleId);
      const suggestions: OptimizationSuggestion[] = [];

      // Pricing suggestions
      if (bundle.performance.conversionRate < 0.05) {
        suggestions.push({
          type: 'pricing',
          description: 'Consider reducing bundle price to improve conversion rate',
          expectedImpact: 0.15,
          confidence: 0.8,
          implementation: 'Reduce bundle price by 10-15%',
          priority: 'high'
        });
      }

      // Product mix suggestions
      const lowPerformingProducts = bundle.products.filter(p => p.weight < 0.3);
      if (lowPerformingProducts.length > 0) {
        suggestions.push({
          type: 'product_mix',
          description: 'Replace low-performing products with better alternatives',
          expectedImpact: 0.25,
          confidence: 0.7,
          implementation: `Consider replacing: ${lowPerformingProducts.map(p => p.productName).join(', ')}`,
          priority: 'medium'
        });
      }

      // Targeting suggestions
      if (bundle.performance.views < 100) {
        suggestions.push({
          type: 'targeting',
          description: 'Expand target audience to increase visibility',
          expectedImpact: 0.3,
          confidence: 0.6,
          implementation: 'Broaden demographic targeting or add new customer segments',
          priority: 'medium'
        });
      }

      return suggestions.sort((a, b) => b.expectedImpact - a.expectedImpact);
    } catch (error) {
      console.error('Error getting optimization suggestions:', error);
      return [];
    }
  }

  /**
   * Track bundle performance
   */
  async trackBundlePerformance(
    bundleId: string,
    event: 'view' | 'conversion' | 'purchase',
    value?: number
  ): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const bundleRef = doc(this.db, 'product_bundles', bundleId);
      const bundleDoc = await getDoc(bundleRef);

      if (!bundleDoc.exists()) {
        throw new Error('Bundle not found');
      }

      const bundle = bundleDoc.data() as ProductBundle;
      const currentPerformance = bundle.performance;

      let updatedPerformance = { ...currentPerformance };

      switch (event) {
        case 'view':
          updatedPerformance.views += 1;
          break;
        case 'conversion':
          updatedPerformance.conversions += 1;
          updatedPerformance.conversionRate = updatedPerformance.conversions / updatedPerformance.views;
          break;
        case 'purchase':
          if (value) {
            updatedPerformance.revenue += value;
            updatedPerformance.averageOrderValue = updatedPerformance.revenue / updatedPerformance.conversions;
          }
          break;
      }

      updatedPerformance.lastUpdated = Timestamp.now();

      await updateDoc(bundleRef, {
        performance: updatedPerformance,
        updatedAt: Timestamp.now()
      });

      console.log('Tracked bundle performance:', { bundleId, event, value });
    } catch (error) {
      console.error('Error tracking bundle performance:', error);
      throw new Error(`Failed to track performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get product bundle by ID
   */
  async getProductBundle(bundleId: string): Promise<ProductBundle | null> {
    try {
      if (!this.db) return null;

      const bundleDoc = await getDoc(doc(this.db, 'product_bundles', bundleId));
      
      if (!bundleDoc.exists()) {
        return null;
      }

      return { id: bundleDoc.id, ...bundleDoc.data() } as ProductBundle;
    } catch (error) {
      console.error('Error getting product bundle:', error);
      return null;
    }
  }

  /**
   * Get product bundles with filtering
   */
  async getProductBundles(filters?: {
    status?: string;
    bundleType?: string;
    limit?: number;
  }): Promise<ProductBundle[]> {
    try {
      if (!this.db) return [];

      let bundlesQuery = query(
        collection(this.db, 'product_bundles'),
        orderBy('createdAt', 'desc')
      );

      if (filters?.status) {
        bundlesQuery = query(
          collection(this.db, 'product_bundles'),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.bundleType) {
        bundlesQuery = query(
          collection(this.db, 'product_bundles'),
          where('bundleType', '==', filters.bundleType),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.limit) {
        bundlesQuery = query(bundlesQuery, limit(filters.limit));
      }

      const bundlesSnapshot = await getDocs(bundlesQuery);
      return bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductBundle));
    } catch (error) {
      console.error('Error getting product bundles:', error);
      return [];
    }
  }

  /**
   * Get bundle analytics
   */
  async getBundleAnalytics(timeRange = 30): Promise<{
    totalBundles: number;
    activeBundles: number;
    totalRevenue: number;
    averageConversionRate: number;
    topPerformingBundles: { bundleId: string; revenue: number; conversionRate: number }[];
    optimizationImpact: number;
  }> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const bundles = await this.getProductBundles();
      
      const totalBundles = bundles.length;
      const activeBundles = bundles.filter(b => b.status === 'active').length;
      const totalRevenue = bundles.reduce((sum, b) => sum + b.performance.revenue, 0);
      const averageConversionRate = bundles.reduce((sum, b) => sum + b.performance.conversionRate, 0) / bundles.length;

      const topPerformingBundles = bundles
        .map(b => ({
          bundleId: b.id,
          revenue: b.performance.revenue,
          conversionRate: b.performance.conversionRate
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate optimization impact
      const optimizationImpact = bundles.reduce((sum, bundle) => {
        const optimizationResults = bundle.optimization.optimizationHistory || [];
        return sum + optimizationResults.reduce((impactSum, result) => {
          return impactSum + (result.actualImpact?.revenueChange || 0);
        }, 0);
      }, 0);

      return {
        totalBundles,
        activeBundles,
        totalRevenue,
        averageConversionRate,
        topPerformingBundles,
        optimizationImpact
      };
    } catch (error) {
      console.error('Error getting bundle analytics:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private calculateOptimalPricing(products: BundleProduct[], strategy: string): Partial<BundlePricing> {
    const originalTotalPrice = products.reduce((sum, p) => sum + (p.originalPrice * p.quantity), 0);
    
    let bundlePrice: number;
    let savingsPercentage: number;

    switch (strategy) {
      case 'fixed_discount':
        savingsPercentage = 15; // 15% default discount
        bundlePrice = originalTotalPrice * (1 - savingsPercentage / 100);
        break;
      case 'percentage_discount':
        savingsPercentage = 20; // 20% discount
        bundlePrice = originalTotalPrice * (1 - savingsPercentage / 100);
        break;
      case 'value_based':
        // Calculate based on perceived value
        savingsPercentage = 12;
        bundlePrice = originalTotalPrice * (1 - savingsPercentage / 100);
        break;
      default:
        savingsPercentage = 10;
        bundlePrice = originalTotalPrice * (1 - savingsPercentage / 100);
    }

    const totalSavings = originalTotalPrice - bundlePrice;

    return {
      originalTotalPrice,
      bundlePrice,
      totalSavings,
      savingsPercentage
    };
  }

  private async getBundlePerformanceData(bundleId: string): Promise<any> {
    // Get historical performance data for optimization
    // This would typically query analytics data
    return {
      conversionTrends: [],
      revenueTrends: [],
      customerFeedback: [],
      competitorPricing: []
    };
  }

  private async runOptimizationAlgorithm(
    bundle: ProductBundle,
    performanceData: any,
    goals?: OptimizationGoal[]
  ): Promise<OptimizationResult> {
    // Simplified optimization algorithm
    const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate new pricing based on performance
    let newPrice = bundle.pricing.bundlePrice;
    if (bundle.performance.conversionRate < 0.05) {
      newPrice = bundle.pricing.bundlePrice * 0.9; // Reduce by 10%
    } else if (bundle.performance.conversionRate > 0.15) {
      newPrice = bundle.pricing.bundlePrice * 1.05; // Increase by 5%
    }

    const expectedImpact = {
      revenueChange: (newPrice - bundle.pricing.bundlePrice) * bundle.performance.conversions,
      conversionChange: newPrice < bundle.pricing.bundlePrice ? 0.02 : -0.01,
      marginChange: (newPrice - bundle.pricing.bundlePrice) / bundle.pricing.bundlePrice
    };

    return {
      id: optimizationId,
      timestamp: Timestamp.now(),
      previousConfiguration: {
        pricing: bundle.pricing
      },
      newConfiguration: {
        pricing: {
          ...bundle.pricing,
          bundlePrice: newPrice,
          totalSavings: bundle.pricing.originalTotalPrice - newPrice,
          savingsPercentage: ((bundle.pricing.originalTotalPrice - newPrice) / bundle.pricing.originalTotalPrice) * 100
        }
      },
      expectedImpact,
      status: 'pending'
    };
  }

  private async applyOptimization(bundleId: string, optimization: OptimizationResult): Promise<void> {
    if (!this.db) return;

    const bundleRef = doc(this.db, 'product_bundles', bundleId);
    
    await updateDoc(bundleRef, {
      ...optimization.newConfiguration,
      'optimization.lastOptimized': Timestamp.now(),
      'optimization.optimizationHistory': optimization,
      updatedAt: Timestamp.now()
    });

    console.log('Applied optimization:', { bundleId, optimizationId: optimization.id });
  }

  private calculateRecommendationScore(customer: any, bundle: ProductBundle, context?: any): number {
    let score = 0.5; // Base score

    // Add scoring logic based on customer data and bundle characteristics
    if (context?.currentCart) {
      const matchingProducts = bundle.products.filter(p => 
        context.currentCart.includes(p.productId)
      );
      score += matchingProducts.length * 0.1;
    }

    // Performance-based scoring
    score += bundle.performance.conversionRate * 0.3;
    score += (bundle.pricing.savingsPercentage / 100) * 0.2;

    return Math.min(1, Math.max(0, score));
  }

  private generateRecommendationReasons(customer: any, bundle: ProductBundle, context?: any): string[] {
    const reasons: string[] = [];
    
    reasons.push(`Save ${bundle.pricing.savingsPercentage.toFixed(0)}% with this bundle`);
    
    if (bundle.performance.conversionRate > 0.1) {
      reasons.push('Popular choice among customers');
    }

    if (context?.currentCart) {
      const matchingProducts = bundle.products.filter(p => 
        context.currentCart.includes(p.productId)
      );
      if (matchingProducts.length > 0) {
        reasons.push(`Includes ${matchingProducts.length} items from your cart`);
      }
    }

    return reasons;
  }

  private getMatchingProducts(customer: any, bundle: ProductBundle, context?: any): string[] {
    if (!context?.currentCart) return [];
    
    return bundle.products
      .filter(p => context.currentCart.includes(p.productId))
      .map(p => p.productId);
  }

  private calculateConfidence(customer: any, bundle: ProductBundle, context?: any): number {
    let confidence = 0.5;
    
    // Increase confidence based on data quality and matching
    if (context?.purchaseHistory?.length > 5) {
      confidence += 0.2;
    }
    
    if (bundle.performance.conversions > 50) {
      confidence += 0.2;
    }

    return Math.min(1, confidence);
  }
}

// Export singleton instance
export const bundleOptimizationService = new BundleOptimizationService();
export default bundleOptimizationService;
