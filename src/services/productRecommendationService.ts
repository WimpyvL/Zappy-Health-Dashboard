"use client";

import { adminServices, BaseDocument } from '@/services/database/hooks';
import { FormRecommendation } from '@/services/formRecommendationService';
import { mockRecommendationService } from '@/services/mockRecommendationService';

// Types based on your existing product structure
export interface Product extends BaseDocument {
  name: string;
  sku: string;
  category: string;
  price: number;
  status: string;
  isActive: boolean;
  description?: string;
  features?: string[];
  billingCycles?: BillingCycle[];
  bundles?: Bundle[];
  services?: Service[];
}

export interface BillingCycle extends BaseDocument {
  name: string;
  duration: number; // in months
  discount: number; // percentage
  isActive: boolean;
}

export interface Bundle extends BaseDocument {
  name: string;
  description: string;
  products: string[]; // product IDs
  price: number;
  discount: number;
  isActive: boolean;
}

export interface Service extends BaseDocument {
  name: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
}

export interface ProductRecommendation extends FormRecommendation {
  productId: string;
  product: Product;
  billingOptions: BillingOption[];
  addOnServices: Service[];
  bundles: Bundle[];
}

export interface BillingOption {
  id: string;
  name: string;
  duration: number; // months
  price: number;
  originalPrice?: number;
  discount?: number;
  savings?: number;
  isRecommended?: boolean;
}

class ProductRecommendationService {
  private productsCache: Product[] = [];
  private servicesCache: Service[] = [];
  private bundlesCache: Bundle[] = [];
  private billingCyclesCache: BillingCycle[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async ensureDataLoaded(): Promise<void> {
    const now = Date.now();
    if (this.cacheTimestamp && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return; // Cache is still valid
    }

    try {
      // Load all data in parallel
      const [products, services, bundles, billingCycles] = await Promise.all([
        adminServices.fetchCollection<Product>('products', {
          filters: [{ field: 'isActive', op: '==', value: true }],
          sortBy: 'name',
          sortDirection: 'asc'
        }),
        adminServices.fetchCollection<Service>('services', {
          filters: [{ field: 'isActive', op: '==', value: true }],
          sortBy: 'name',
          sortDirection: 'asc'
        }),
        adminServices.fetchCollection<Bundle>('bundles', {
          filters: [{ field: 'isActive', op: '==', value: true }],
          sortBy: 'name',
          sortDirection: 'asc'
        }),
        adminServices.fetchCollection<BillingCycle>('billing_cycles', {
          filters: [{ field: 'isActive', op: '==', value: true }],
          sortBy: 'duration',
          sortDirection: 'asc'
        })
      ]);

      this.productsCache = products;
      this.servicesCache = services;
      this.bundlesCache = bundles;
      this.billingCyclesCache = billingCycles;
      this.cacheTimestamp = now;

      console.log('📦 Product data loaded:', {
        products: products.length,
        services: services.length,
        bundles: bundles.length,
        billingCycles: billingCycles.length
      });
    } catch (error) {
      console.error('❌ Error loading product data:', error);
      throw error;
    }
  }

  async generateProductRecommendations(
    formData: Record<string, any>,
    options: {
      maxRecommendations?: number;
      categories?: string[];
      includeServices?: boolean;
      includeBundles?: boolean;
    } = {}
  ): Promise<ProductRecommendation[]> {
    await this.ensureDataLoaded();

    const {
      maxRecommendations = 3,
      categories = [],
      includeServices = true,
      includeBundles = true
    } = options;

    try {
      // First, get AI recommendations to understand user needs
      const aiRecommendations = await mockRecommendationService.generateRecommendations(formData, {
        maxRecommendations,
        categories: categories.length > 0 ? categories : ['treatment', 'subscription', 'supplement', 'lifestyle']
      });

      // Map AI recommendations to actual products
      const productRecommendations: ProductRecommendation[] = [];

      for (const aiRec of aiRecommendations) {
        // Find matching products based on category and AI recommendation
        const matchingProducts = this.findMatchingProducts(aiRec, categories);
        
        for (const product of matchingProducts.slice(0, maxRecommendations - productRecommendations.length)) {
          // Generate billing options for this product
          const billingOptions = this.generateBillingOptions(product);
          
          // Find relevant add-on services
          const addOnServices = includeServices ? this.findRelevantServices(product, aiRec) : [];
          
          // Find relevant bundles
          const bundles = includeBundles ? this.findRelevantBundles(product) : [];

          const productRecommendation: ProductRecommendation = {
            id: `${product.id}-${aiRec.id}`,
            title: product.name,
            description: product.description || aiRec.description,
            price: product.price,
            category: this.mapCategoryToRecommendationType(product.category),
            confidence: aiRec.confidence,
            priority: aiRec.priority,
            actionable: true,
            reasoning: this.generateReasoningForProduct(product, aiRec, formData),
            productId: product.id,
            product,
            billingOptions,
            addOnServices,
            bundles
          };

          productRecommendations.push(productRecommendation);
        }

        if (productRecommendations.length >= maxRecommendations) {
          break;
        }
      }

      // If we don't have enough recommendations, add popular products
      if (productRecommendations.length < maxRecommendations) {
        const remainingSlots = maxRecommendations - productRecommendations.length;
        const popularProducts = this.getPopularProducts(remainingSlots, categories);
        
        for (const product of popularProducts) {
          if (!productRecommendations.some(pr => pr.productId === product.id)) {
            const billingOptions = this.generateBillingOptions(product);
            const addOnServices = includeServices ? this.findRelevantServices(product) : [];
            const bundles = includeBundles ? this.findRelevantBundles(product) : [];

            productRecommendations.push({
              id: `popular-${product.id}`,
              title: product.name,
              description: product.description || `Popular ${product.category.toLowerCase()} treatment`,
              price: product.price,
              category: this.mapCategoryToRecommendationType(product.category),
              confidence: 0.75, // Lower confidence for popular items
              priority: 2,
              actionable: true,
              reasoning: `Popular choice for ${product.category.toLowerCase()} treatments`,
              productId: product.id,
              product,
              billingOptions,
              addOnServices,
              bundles
            });
          }
        }
      }

      return productRecommendations.slice(0, maxRecommendations);
    } catch (error) {
      console.error('❌ Error generating product recommendations:', error);
      throw error;
    }
  }

  private findMatchingProducts(aiRec: FormRecommendation, categories: string[]): Product[] {
    const categoryMap: Record<string, string[]> = {
      'treatment': ['Prescriptions', 'Telehealth'],
      'subscription': ['Prescriptions', 'Supplements', 'Telehealth'],
      'supplement': ['Supplements'],
      'lifestyle': ['Mental Health', 'Women\'s Health']
    };

    const targetCategories = categoryMap[aiRec.category] || [aiRec.category];
    
    return this.productsCache.filter(product => {
      // Match by category
      const categoryMatch = targetCategories.some(cat => 
        product.category.toLowerCase().includes(cat.toLowerCase())
      );
      
      // Match by name/description keywords
      const keywords = aiRec.title.toLowerCase().split(' ');
      const nameMatch = keywords.some(keyword => 
        product.name.toLowerCase().includes(keyword)
      );

      return categoryMatch || nameMatch;
    }).sort((a, b) => b.price - a.price); // Sort by price descending
  }

  private generateBillingOptions(product: Product): BillingOption[] {
    const basePrice = product.price;
    const options: BillingOption[] = [];

    // Monthly option (default)
    options.push({
      id: 'monthly',
      name: 'Monthly',
      duration: 1,
      price: basePrice,
      isRecommended: false
    });

    // Generate options based on available billing cycles
    for (const cycle of this.billingCyclesCache) {
      if (cycle.duration > 1) {
        const totalPrice = basePrice * cycle.duration;
        const discountAmount = totalPrice * (cycle.discount / 100);
        const finalPrice = Math.round(totalPrice - discountAmount);
        
        options.push({
          id: cycle.id,
          name: cycle.name,
          duration: cycle.duration,
          price: finalPrice,
          originalPrice: totalPrice,
          discount: cycle.discount,
          savings: Math.round(discountAmount),
          isRecommended: cycle.duration === 3 // Recommend quarterly
        });
      }
    }

    return options;
  }

  private findRelevantServices(product: Product, aiRec?: FormRecommendation): Service[] {
    // Find services that complement the product
    const relevantServices = this.servicesCache.filter(service => {
      // Match by category
      if (service.category === product.category) return true;
      
      // Match by complementary categories
      const complementaryMap: Record<string, string[]> = {
        'Prescriptions': ['Mental Health', 'Telehealth'],
        'Supplements': ['Mental Health', 'Telehealth'],
        'Telehealth': ['Mental Health'],
        'Mental Health': ['Telehealth']
      };
      
      const complementary = complementaryMap[product.category] || [];
      return complementary.includes(service.category);
    });

    // Sort by price and return top 3
    return relevantServices
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  }

  private findRelevantBundles(product: Product): Bundle[] {
    // Find bundles that include this product
    return this.bundlesCache.filter(bundle => 
      bundle.products.includes(product.id)
    ).slice(0, 2);
  }

  private getPopularProducts(count: number, categories: string[]): Product[] {
    let products = this.productsCache;
    
    // Filter by categories if specified
    if (categories.length > 0) {
      products = products.filter(product => 
        categories.some(cat => 
          product.category.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    // Sort by price (assuming higher price = more premium/popular)
    return products
      .sort((a, b) => b.price - a.price)
      .slice(0, count);
  }

  private mapCategoryToRecommendationType(category: string): FormRecommendation['category'] {
    const categoryMap: Record<string, FormRecommendation['category']> = {
      'Prescriptions': 'treatment',
      'Telehealth': 'treatment',
      'Supplements': 'supplement',
      'Mental Health': 'lifestyle',
      'Women\'s Health': 'lifestyle',
      'Hair': 'treatment'
    };

    return categoryMap[category] || 'treatment';
  }

  private generateReasoningForProduct(
    product: Product, 
    aiRec: FormRecommendation, 
    formData: Record<string, any>
  ): string {
    const reasons = [];
    
    // Base reasoning from AI
    if (aiRec.reasoning) {
      reasons.push(aiRec.reasoning);
    }
    
    // Product-specific reasoning
    if (product.category === 'Prescriptions') {
      reasons.push('Clinically proven treatment option');
    }
    
    if (product.price > 200) {
      reasons.push('Premium treatment with comprehensive support');
    }
    
    // Form-based reasoning
    if (formData.goals?.includes('weight_loss') && product.category.includes('weight')) {
      reasons.push('Specifically designed for weight management goals');
    }
    
    return reasons.join('. ') || `Recommended ${product.category.toLowerCase()} treatment`;
  }

  // Public methods for getting cached data
  async getProducts(category?: string): Promise<Product[]> {
    await this.ensureDataLoaded();
    if (category) {
      return this.productsCache.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    return this.productsCache;
  }

  async getServices(category?: string): Promise<Service[]> {
    await this.ensureDataLoaded();
    if (category) {
      return this.servicesCache.filter(s => 
        s.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    return this.servicesCache;
  }

  async getBundles(): Promise<Bundle[]> {
    await this.ensureDataLoaded();
    return this.bundlesCache;
  }

  async getBillingCycles(): Promise<BillingCycle[]> {
    await this.ensureDataLoaded();
    return this.billingCyclesCache;
  }

  // Clear cache (useful for admin updates)
  clearCache(): void {
    this.cacheTimestamp = 0;
    this.productsCache = [];
    this.servicesCache = [];
    this.bundlesCache = [];
    this.billingCyclesCache = [];
  }
}

export const productRecommendationService = new ProductRecommendationService();
