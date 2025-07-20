/**
 * @fileoverview Service for orchestrating logic between categories, products, and subscriptions.
 */
import { dbService } from './database';

interface Product {
  id: string;
  price: number;
  [key: string]: any;
}

interface SubscriptionDuration {
  id: string;
  name: string;
  discount_percent?: number;
  [key: string]: any;
}

interface PricingSnapshot {
  base_price: number;
  final_price: number;
  total_savings: number;
  subscription_details: {
    name: string;
    discount_percentage: number;
  } | null;
  currency: string;
}

class CategoryProductOrchestrator {
  async calculatePricing(productId: string, subscriptionDurationId?: string): Promise<PricingSnapshot> {
    const productRes = await dbService.getById<Product>("products", productId);
    if (productRes.error || !productRes.data) {
      throw new Error(productRes.error || "Product not found");
    }

    const product = productRes.data;
    let finalPrice = product.price;
    let savings = 0;
    let subscriptionDetails = null;

    if (subscriptionDurationId) {
      const durationRes = await dbService.getById<SubscriptionDuration>("subscription_durations", subscriptionDurationId);
      if (durationRes.data) {
        const duration = durationRes.data;
        const discountPercentage = duration.discount_percent || 0;
        savings = product.price * (discountPercentage / 100);
        finalPrice = product.price - savings;
        subscriptionDetails = {
          name: duration.name,
          discount_percentage: discountPercentage,
        };
      }
    }

    return {
      base_price: product.price,
      final_price: finalPrice,
      total_savings: savings,
      subscription_details: subscriptionDetails,
      currency: 'USD',
    };
  }

  async getProductRecommendations(categoryId: string): Promise<any[]> {
    console.log(`Fetching recommendations for category: ${categoryId}`);
    // This remains a placeholder for a more complex recommendation engine.
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