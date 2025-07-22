/**
 * Enhanced Payment Service
 * 
 * Advanced payment processing service with environment detection,
 * payment recovery, discount validation, and comprehensive error handling.
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

// Environment detection
const isProductionMode = (): boolean => {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_PAYMENT_MODE === 'production'
  );
};

const isDevelopmentMode = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_PAYMENT_MODE === 'development'
  );
};

const isSandboxMode = (): boolean => {
  return (
    process.env.NEXT_PUBLIC_PAYMENT_MODE === 'sandbox' ||
    (isDevelopmentMode() && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  );
};

// Validate Stripe configuration
const validateStripeConfig = (): void => {
  if (isProductionMode()) {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      throw new Error(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required for production'
      );
    }
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL is required for production');
    }
  }
};

// Payment interfaces
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  name: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  metadata?: Record<string, any>;
}

export interface CheckoutSessionOptions {
  successUrl?: string;
  cancelUrl?: string;
  discountCode?: string;
  metadata?: Record<string, any>;
  paymentMethodTypes?: string[];
  mode?: 'payment' | 'subscription' | 'setup';
}

export interface PaymentDetails {
  paymentMethodId?: string;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  savePaymentMethod?: boolean;
}

export interface DiscountValidation {
  valid: boolean;
  code?: string;
  type?: 'percentage' | 'fixed_amount';
  value?: number;
  description?: string;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount?: number;
  error?: string;
}

export interface PaymentRecovery {
  canRetry: boolean;
  suggestedActions: string[];
  alternativePaymentMethods?: PaymentMethod[];
  retryDelay?: number;
  maxRetries?: number;
  currentRetryCount?: number;
}

/**
 * Production payment service using real Stripe integration
 */
const productionPaymentService = {
  /**
   * Create a checkout session for processing payment
   */
  createCheckoutSession: async (
    cartItems: any[],
    customerInfo: any,
    options: CheckoutSessionOptions = {}
  ): Promise<any> => {
    try {
      validateStripeConfig();

      const response = await fetch('/api/stripe/checkout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems,
          customerInfo,
          options: {
            mode: options.mode || 'payment',
            success_url: options.successUrl || `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: options.cancelUrl || `${window.location.origin}/payment/cancel`,
            payment_method_types: options.paymentMethodTypes || ['card'],
            ...options,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.sessionId) {
        throw new Error('Invalid response from payment service');
      }

      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  /**
   * Process a payment with the selected payment method
   */
  processPayment: async (sessionId: string, paymentDetails: PaymentDetails): Promise<any> => {
    try {
      validateStripeConfig();

      const response = await fetch('/api/stripe/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          paymentDetails,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data) {
        throw new Error('Invalid response from payment service');
      }

      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  /**
   * Verify the status of a payment
   */
  verifyPaymentStatus: async (sessionId: string): Promise<any> => {
    try {
      validateStripeConfig();

      const response = await fetch(`/api/stripe/verify-status/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data) {
        throw new Error('Invalid response from payment service');
      }

      return data;
    } catch (error) {
      console.error('Error verifying payment status:', error);
      throw error;
    }
  },

  /**
   * Handle payment failure recovery
   */
  handlePaymentFailure: async (sessionId: string, errorType: string): Promise<PaymentRecovery> => {
    try {
      validateStripeConfig();

      const response = await fetch('/api/stripe/handle-failure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          errorType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling payment failure:', error);
      
      // Return default recovery options
      return {
        canRetry: true,
        suggestedActions: [
          'Check your card details and try again',
          'Try a different payment method',
          'Contact your bank if the issue persists'
        ],
        retryDelay: 5000,
        maxRetries: 3,
        currentRetryCount: 0
      };
    }
  },

  /**
   * Validate a discount or referral code
   */
  validateDiscountCode: async (code: string, amount: number): Promise<DiscountValidation> => {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Check discount codes in Firebase
      const discountQuery = query(
        collection(db, 'discount_codes'),
        where('code', '==', code.toUpperCase()),
        where('active', '==', true),
        limit(1)
      );

      const discountSnapshot = await getDocs(discountQuery);

      if (discountSnapshot.empty) {
        return {
          valid: false,
          error: 'Invalid discount code'
        };
      }

      const discountDoc = discountSnapshot.docs[0];
      const discount = discountDoc.data();

      // Check expiration
      if (discount.expiresAt && discount.expiresAt.toDate() < new Date()) {
        return {
          valid: false,
          error: 'Discount code has expired'
        };
      }

      // Check usage limit
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        return {
          valid: false,
          error: 'Discount code usage limit reached'
        };
      }

      // Check minimum amount
      if (discount.minimumAmount && amount < discount.minimumAmount) {
        return {
          valid: false,
          error: `Minimum order amount of $${discount.minimumAmount} required`
        };
      }

      return {
        valid: true,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description,
        expiresAt: discount.expiresAt?.toDate(),
        usageLimit: discount.usageLimit,
        usageCount: discount.usageCount || 0
      };
    } catch (error) {
      console.error('Error validating discount code:', error);
      return {
        valid: false,
        error: 'Error validating discount code'
      };
    }
  },

  /**
   * Get available payment methods for the current user
   */
  getAvailablePaymentMethods: async (customerId?: string): Promise<PaymentMethod[]> => {
    try {
      const response = await fetch(`/api/stripe/payment-methods${customerId ? `?customer_id=${customerId}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.paymentMethods || [];
    } catch (error) {
      console.error('Error getting available payment methods:', error);
      return [];
    }
  },

  /**
   * Create subscription with Stripe
   */
  createSubscription: async (
    customerId: string,
    priceId: string,
    options: any = {}
  ): Promise<any> => {
    try {
      validateStripeConfig();

      const response = await fetch('/api/stripe/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerId,
          price_id: priceId,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (subscriptionId: string): Promise<any> => {
    try {
      validateStripeConfig();

      const response = await fetch(`/api/stripe/subscriptions?subscription_id=${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },
};

// Import sandbox service only when needed
let sandboxService: any = null;
const getSandboxService = async () => {
  if (!sandboxService) {
    const { paymentSandbox } = await import('./paymentSandbox');
    sandboxService = paymentSandbox;
  }
  return sandboxService;
};

/**
 * Get the appropriate payment service based on environment
 */
export const getPaymentService = async () => {
  if (isSandboxMode()) {
    console.warn(
      'Using payment sandbox mode. This should not be used in production.'
    );
    return getSandboxService();
  }

  if (isProductionMode()) {
    return productionPaymentService;
  }

  // Development mode with real Stripe keys
  return productionPaymentService;
};

/**
 * Main enhanced payment service export - automatically chooses the right implementation
 */
export const enhancedPaymentService = {
  /**
   * Create a checkout session for processing payment
   */
  createCheckoutSession: async (...args: Parameters<typeof productionPaymentService.createCheckoutSession>) => {
    const service = await getPaymentService();
    return service.createCheckoutSession(...args);
  },

  /**
   * Process a payment with the selected payment method
   */
  processPayment: async (...args: Parameters<typeof productionPaymentService.processPayment>) => {
    const service = await getPaymentService();
    return service.processPayment(...args);
  },

  /**
   * Verify the status of a payment
   */
  verifyPaymentStatus: async (...args: Parameters<typeof productionPaymentService.verifyPaymentStatus>) => {
    const service = await getPaymentService();
    return service.verifyPaymentStatus(...args);
  },

  /**
   * Handle payment failure recovery
   */
  handlePaymentFailure: async (...args: Parameters<typeof productionPaymentService.handlePaymentFailure>) => {
    const service = await getPaymentService();
    return service.handlePaymentFailure(...args);
  },

  /**
   * Validate a discount or referral code
   */
  validateDiscountCode: async (...args: Parameters<typeof productionPaymentService.validateDiscountCode>) => {
    const service = await getPaymentService();
    return service.validateDiscountCode(...args);
  },

  /**
   * Get available payment methods for the current user
   */
  getAvailablePaymentMethods: async (...args: Parameters<typeof productionPaymentService.getAvailablePaymentMethods>) => {
    const service = await getPaymentService();
    return service.getAvailablePaymentMethods(...args);
  },

  /**
   * Create subscription with Stripe
   */
  createSubscription: async (...args: Parameters<typeof productionPaymentService.createSubscription>) => {
    const service = await getPaymentService();
    return service.createSubscription(...args);
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (...args: Parameters<typeof productionPaymentService.cancelSubscription>) => {
    const service = await getPaymentService();
    return service.cancelSubscription(...args);
  },
};

// Export utility functions
export {
  isProductionMode,
  isDevelopmentMode,
  isSandboxMode,
  validateStripeConfig,
};

export default enhancedPaymentService;
