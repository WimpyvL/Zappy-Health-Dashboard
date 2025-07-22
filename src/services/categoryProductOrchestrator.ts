/**
 * @fileoverview Service for orchestrating logic between categories, products, and subscriptions.
 */
<<<<<<< HEAD
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
=======
import { getFirebaseFirestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Types
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
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
  base_price: number;
  final_price: number;
  total_savings: number;
  subscription_details: {
    name: string;
    discount_percentage: number;
  } | null;
  currency: string;
}

<<<<<<< HEAD
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
=======
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
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }

    const product = productSnap.data() as Product;
    let finalPrice = product.price;
    let savings = 0;
    let subscriptionDetails: { name: string; discount_percentage: number } | null = null;

    if (subscriptionDurationId) {
      // This is a simplified logic. In a real scenario, we would query the
      // product_subscription_mappings table.
      // For now, let's assume a simple discount.
      const durationRef = doc(db, "subscription_durations", subscriptionDurationId);
      const durationSnap = await getDoc(durationRef);
      
      if (durationSnap.exists()) {
        const duration = durationSnap.data() as SubscriptionDuration;
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
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

<<<<<<< HEAD
  async getProductRecommendations(categoryId: string): Promise<any[]> {
    console.log(`Fetching recommendations for category: ${categoryId}`);
    // This remains a placeholder for a more complex recommendation engine.
=======
  /**
   * Gets product recommendations for a given category.
   */
  async getProductRecommendations(categoryId: string): Promise<ProductRecommendation[]> {
    // This is a placeholder for a more complex recommendation engine.
    // In a real app, this would involve rules or AI.
    // For now, it returns a mock recommendation.
    console.log(`Fetching recommendations for category: ${categoryId}`);
    
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
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
<<<<<<< HEAD
}

export const categoryProductOrchestrator = new CategoryProductOrchestrator();
=======

  // Future methods:
  // async getProductFormModifications(productId: string): Promise<any> {}
  // async getSubscriptionOptionsForProduct(productId: string): Promise<SubscriptionDuration[]> {}
}

export const categoryProductOrchestrator = new CategoryProductOrchestrator();
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
