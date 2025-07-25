/**
 * Payment Sandbox Service
 * 
 * Mock payment processing for development and testing.
 * Simulates various payment scenarios without real charges.
 * Adapted from the old repository to work with Firebase and modern TypeScript.
 */

import { CheckoutSessionOptions, PaymentDetails, DiscountValidation, PaymentRecovery, PaymentMethod } from './enhancedPaymentService';

// Mock data for testing
const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_mock_card_visa',
    type: 'card',
    name: 'Visa ending in 4242',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 'pm_mock_card_mastercard',
    type: 'card',
    name: 'Mastercard ending in 5555',
    last4: '5555',
    brand: 'mastercard',
    expiryMonth: 10,
    expiryYear: 2024,
    isDefault: false,
  },
];

const MOCK_DISCOUNT_CODES = [
  {
    code: 'SAVE20',
    type: 'percentage',
    value: 20,
    description: '20% off your order',
    active: true,
    usageLimit: 100,
    usageCount: 25,
    minimumAmount: 50,
  },
  {
    code: 'WELCOME10',
    type: 'fixed_amount',
    value: 10,
    description: '$10 off your first order',
    active: true,
    usageLimit: 1000,
    usageCount: 150,
    minimumAmount: 25,
  },
  {
    code: 'EXPIRED',
    type: 'percentage',
    value: 50,
    description: 'Expired discount',
    active: true,
    usageLimit: 50,
    usageCount: 10,
    expiresAt: new Date('2023-01-01'),
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Payment Sandbox Service - Mock implementation for development
 */
export const paymentSandbox = {
  /**
   * Create a mock checkout session
   */
  createCheckoutSession: async (
    cartItems: any[],
    customerInfo: any,
    options: CheckoutSessionOptions = {}
  ): Promise<any> => {
    console.log('🧪 SANDBOX: Creating checkout session', { cartItems, customerInfo, options });
    
    await delay(500); // Simulate API delay

    const sessionId = `cs_sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      sessionId,
      url: `${window.location.origin}/sandbox/checkout/${sessionId}`,
      status: 'open',
      amount_total: totalAmount * 100, // Convert to cents
      currency: 'usd',
      mode: options.mode || 'payment',
      metadata: options.metadata || {},
    };
  },

  /**
   * Process a mock payment
   */
  processPayment: async (sessionId: string, paymentDetails: PaymentDetails): Promise<any> => {
    console.log('🧪 SANDBOX: Processing payment', { sessionId, paymentDetails });
    
    await delay(1000); // Simulate processing time

    // Simulate different payment outcomes based on payment method
    const paymentMethodId = paymentDetails.paymentMethodId || 'pm_mock_card_visa';
    
    if (paymentMethodId.includes('fail')) {
      return {
        status: 'failed',
        error: {
          type: 'card_error',
          code: 'card_declined',
          message: 'Your card was declined.',
        },
      };
    }

    if (paymentMethodId.includes('require_action')) {
      return {
        status: 'requires_action',
        next_action: {
          type: 'use_stripe_sdk',
          use_stripe_sdk: {
            type: 'three_d_secure_redirect',
            stripe_js: 'https://js.stripe.com/v3/',
          },
        },
      };
    }

    return {
      status: 'succeeded',
      payment_intent: {
        id: `pi_sandbox_${Date.now()}`,
        status: 'succeeded',
        amount: 5000, // $50.00
        currency: 'usd',
        payment_method: paymentMethodId,
      },
    };
  },

  /**
   * Verify mock payment status
   */
  verifyPaymentStatus: async (sessionId: string): Promise<any> => {
    console.log('🧪 SANDBOX: Verifying payment status', { sessionId });
    
    await delay(300);

    return {
      status: 'complete',
      payment_status: 'paid',
      payment_intent: {
        id: `pi_sandbox_${sessionId}`,
        status: 'succeeded',
        amount: 5000,
        currency: 'usd',
      },
    };
  },

  /**
   * Handle mock payment failure
   */
  handlePaymentFailure: async (sessionId: string, errorType: string): Promise<PaymentRecovery> => {
    console.log('🧪 SANDBOX: Handling payment failure', { sessionId, errorType });
    
    await delay(200);

    const recoveryOptions: Record<string, PaymentRecovery> = {
      card_declined: {
        canRetry: true,
        suggestedActions: [
          'Check your card details and try again',
          'Try a different card',
          'Contact your bank',
        ],
        alternativePaymentMethods: MOCK_PAYMENT_METHODS.filter(pm => pm.id !== 'pm_mock_card_visa'),
        retryDelay: 3000,
        maxRetries: 3,
        currentRetryCount: 0,
      },
      insufficient_funds: {
        canRetry: true,
        suggestedActions: [
          'Add funds to your account',
          'Try a different payment method',
          'Contact your bank',
        ],
        alternativePaymentMethods: MOCK_PAYMENT_METHODS,
        retryDelay: 5000,
        maxRetries: 2,
        currentRetryCount: 0,
      },
      expired_card: {
        canRetry: false,
        suggestedActions: [
          'Update your card information',
          'Use a different payment method',
        ],
        alternativePaymentMethods: MOCK_PAYMENT_METHODS.filter(pm => pm.expiryYear && pm.expiryYear > 2024),
        retryDelay: 0,
        maxRetries: 0,
        currentRetryCount: 0,
      },
    };

    return recoveryOptions[errorType] || {
      canRetry: true,
      suggestedActions: ['Please try again or contact support'],
      retryDelay: 5000,
      maxRetries: 3,
      currentRetryCount: 0,
    };
  },

  /**
   * Validate mock discount code
   */
  validateDiscountCode: async (code: string, amount: number): Promise<DiscountValidation> => {
    console.log('🧪 SANDBOX: Validating discount code', { code, amount });
    
    await delay(400);

    const discount = MOCK_DISCOUNT_CODES.find(d => d.code === code.toUpperCase());

    if (!discount) {
      return {
        valid: false,
        error: 'Invalid discount code',
      };
    }

    if (!discount.active) {
      return {
        valid: false,
        error: 'Discount code is not active',
      };
    }

    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return {
        valid: false,
        error: 'Discount code has expired',
      };
    }

    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return {
        valid: false,
        error: 'Discount code usage limit reached',
      };
    }

    if (discount.minimumAmount && amount < discount.minimumAmount) {
      return {
        valid: false,
        error: `Minimum order amount of $${discount.minimumAmount} required`,
      };
    }

    const result: DiscountValidation = {
      valid: true,
      code: discount.code,
      type: discount.type as 'percentage' | 'fixed_amount',
      value: discount.value,
      description: discount.description,
      usageLimit: discount.usageLimit,
      usageCount: discount.usageCount,
    };

    if (discount.expiresAt) {
      result.expiresAt = discount.expiresAt;
    }

    return result;
  },

  /**
   * Get mock available payment methods
   */
  getAvailablePaymentMethods: async (customerId?: string): Promise<PaymentMethod[]> => {
    console.log('🧪 SANDBOX: Getting available payment methods', { customerId });
    
    await delay(300);

    return MOCK_PAYMENT_METHODS;
  },

  /**
   * Create mock subscription
   */
  createSubscription: async (
    customerId: string,
    priceId: string,
    options: any = {}
  ): Promise<any> => {
    console.log('🧪 SANDBOX: Creating subscription', { customerId, priceId, options });
    
    await delay(800);

    return {
      id: `sub_sandbox_${Date.now()}`,
      status: 'active',
      customer: customerId,
      items: {
        data: [
          {
            id: `si_sandbox_${Date.now()}`,
            price: {
              id: priceId,
              unit_amount: 2999, // $29.99
              currency: 'usd',
              recurring: {
                interval: 'month',
                interval_count: 1,
              },
            },
          },
        ],
      },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      latest_invoice: {
        id: `in_sandbox_${Date.now()}`,
        status: 'paid',
        amount_paid: 2999,
        payment_intent: {
          id: `pi_sandbox_${Date.now()}`,
          status: 'succeeded',
        },
      },
    };
  },

  /**
   * Cancel mock subscription
   */
  cancelSubscription: async (subscriptionId: string): Promise<any> => {
    console.log('🧪 SANDBOX: Canceling subscription', { subscriptionId });
    
    await delay(500);

    return {
      id: subscriptionId,
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000),
      cancel_at_period_end: false,
    };
  },
};

export default paymentSandbox;
