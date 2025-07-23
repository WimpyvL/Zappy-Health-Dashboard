/**
 * @fileoverview Service for orchestrating logic between categories, products, and subscriptions.
 */
import { dbService } from '@/services/database/index';

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category_id?: string;
  [key: string]: any;
}

export interface SubscriptionDuration {
  id: string;
  name: string;
  discount_percent?: number;
  duration_months?: number;
  [key: string]: any;
}

export interface PricingSnapshot {
  base_price: number;
  final_price: number;
  total_savings: number;
  subscription_details: {
    name: string;
    discount_percentage: number;
  } | null;
  currency: string;
}

export interface ProductRecommendation {
  product: {
    id: string;
    name: string;
    price: number;
  };
  recommendation_reason: string;
  recommendation_score: number;
}

class CategoryProductOrchestrator {
  /**
   * Calculates pricing for a product, optionally with a subscription.
   */
  async calculatePricing(productId: string, subscriptionDurationId?: string): Promise<PricingSnapshot> {
    const productRes = await dbService.products.getById(productId);
    if (!productRes.success || !productRes.data) {
      throw new Error(productRes.error || "Product not found");
    }

    const product = productRes.data;
    let finalPrice = product.price;
    let savings = 0;
    let subscriptionDetails: { name: string; discount_percentage: number } | null = null;

    if (subscriptionDurationId) {
        // This logic needs to be adapted based on how subscription durations are stored.
        // Assuming a simple discount for now.
        const discountPercentage = 10; // Mock 10% discount
        savings = product.price * (discountPercentage / 100);
        finalPrice = product.price - savings;
        subscriptionDetails = {
          name: 'Subscription',
          discount_percentage: discountPercentage,
        };
    }

    return {
      base_price: product.price,
      final_price: finalPrice,
      total_savings: savings,
      subscription_details: subscriptionDetails,
      currency: 'USD',
    };
  }

  /**
   * Gets product recommendations for a given category.
   */
  async getProductRecommendations(categoryId: string): Promise<ProductRecommendation[]> {
    // This is a placeholder for a more complex recommendation engine.
    // In a real app, this would involve rules or AI.
    // For now, it returns a mock recommendation.
    console.log(`Fetching recommendations for category: ${categoryId}`);
    
    return [
      {
        product: { id: "prod_1", name: "Recommended Product A", price: 79.99 },
        recommendation_reason: "Popular with this category.",
        recommendation_score: 0.9,
      },
      {
        product: { id: "prod_2", name: "Recommended Product B", price: 59.99 },
        recommendation_reason: "Complements primary treatments.",
        recommendation_score: 0.85,
      },
    ];
  }
}

export const categoryProductOrchestrator = new CategoryProductOrchestrator();
