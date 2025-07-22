import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleError, ErrorType, ErrorSeverity } from '@/lib/error-handler';
import { z } from 'zod';

// Initialize Stripe with proper error handling
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const CreateSubscriptionSchema = z.object({
  customer: z.string().min(1, 'Customer ID is required'),
  price_id: z.string().min(1, 'Price ID is required'),
  metadata: z.record(z.string()).optional(),
  payment_behavior: z.enum(['default_incomplete', 'allow_incomplete', 'error_if_incomplete']).optional().default('default_incomplete'),
});

const UpdateSubscriptionSchema = z.object({
  subscription_id: z.string().min(1, 'Subscription ID is required'),
  metadata: z.record(z.string()).optional(),
  proration_behavior: z.enum(['create_prorations', 'none', 'always_invoice']).optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    price: z.string().optional(),
    quantity: z.number().min(1).optional(),
  })).optional(),
});

const GetSubscriptionSchema = z.object({
  subscription_id: z.string().min(1, 'Subscription ID is required').optional(),
  customer_id: z.string().min(1, 'Customer ID is required').optional(),
}).refine(data => data.subscription_id || data.customer_id, {
  message: 'Either subscription_id or customer_id is required',
});

const DeleteSubscriptionSchema = z.object({
  subscription_id: z.string().min(1, 'Subscription ID is required'),
});

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute for subscription operations (most restrictive)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  
  try {
    // Rate limiting (most restrictive for subscription operations)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      handleError(new Error('Missing Stripe configuration'), {
        type: ErrorType.API,
        severity: ErrorSeverity.CRITICAL,
        component: 'stripe-subscriptions',
        action: 'validate-config',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input data
    const validationResult = CreateSubscriptionSchema.safeParse(requestData);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { customer, price_id, metadata, payment_behavior } = validationResult.data;

    // Create subscription in Stripe with proper parameters
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer,
      items: [{ price: price_id }],
      payment_behavior,
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: metadata || {},
    };

    const subscription = await stripe.subscriptions.create(subscriptionData);

    const processingTime = Date.now() - startTime;
    console.log(`Subscription created successfully in ${processingTime}ms: ${subscription.id}`);

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-subscriptions',
      action: 'create-subscription',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid subscription parameters' },
        { status: 400 }
      );
    }

    // Don't expose sensitive error details
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      handleError(new Error('Missing Stripe configuration'), {
        type: ErrorType.API,
        severity: ErrorSeverity.CRITICAL,
        component: 'stripe-subscriptions',
        action: 'validate-config',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const customerId = searchParams.get('customer_id');

    // Validate input
    const validationResult = GetSubscriptionSchema.safeParse({ 
      subscription_id: subscriptionId, 
      customer_id: customerId 
    });
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { subscription_id, customer_id } = validationResult.data;

    if (subscription_id) {
      // Retrieve specific subscription
      const subscription = await stripe.subscriptions.retrieve(subscription_id);
      
      const processingTime = Date.now() - startTime;
      console.log(`Subscription retrieved successfully in ${processingTime}ms: ${subscription.id}`);
      
      return NextResponse.json({ subscription }, { status: 200 });
    } else if (customer_id) {
      // List subscriptions for a customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer_id,
        status: 'all',
        expand: ['data.default_payment_method'],
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`Customer subscriptions retrieved successfully in ${processingTime}ms: ${subscriptions.data.length} subscriptions`);
      
      return NextResponse.json({ subscriptions: subscriptions.data }, { status: 200 });
    }

    // This should never happen due to validation, but TypeScript safety
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-subscriptions',
      action: 'get-subscription',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      handleError(new Error('Missing Stripe configuration'), {
        type: ErrorType.API,
        severity: ErrorSeverity.CRITICAL,
        component: 'stripe-subscriptions',
        action: 'validate-config',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate input data
    const validationResult = UpdateSubscriptionSchema.safeParse(requestData);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { subscription_id, ...updateData } = validationResult.data;

    // Update subscription in Stripe - handle optional fields properly
    const subscriptionUpdateData: Stripe.SubscriptionUpdateParams = {};
    
    if (updateData.metadata !== undefined) {
      subscriptionUpdateData.metadata = updateData.metadata;
    }
    if (updateData.proration_behavior !== undefined) {
      subscriptionUpdateData.proration_behavior = updateData.proration_behavior;
    }
    if (updateData.items !== undefined) {
      // Filter out items with undefined values to satisfy Stripe's type requirements
      const validItems = updateData.items.map(item => {
        const validItem: any = {};
        if (item.id !== undefined) validItem.id = item.id;
        if (item.price !== undefined) validItem.price = item.price;
        if (item.quantity !== undefined) validItem.quantity = item.quantity;
        return validItem;
      }).filter(item => Object.keys(item).length > 0);
      
      if (validItems.length > 0) {
        subscriptionUpdateData.items = validItems;
      }
    }

    const subscription = await stripe.subscriptions.update(subscription_id, subscriptionUpdateData);

    const processingTime = Date.now() - startTime;
    console.log(`Subscription updated successfully in ${processingTime}ms: ${subscription.id}`);

    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-subscriptions',
      action: 'update-subscription',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Subscription not found or invalid data' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      handleError(new Error('Missing Stripe configuration'), {
        type: ErrorType.API,
        severity: ErrorSeverity.CRITICAL,
        component: 'stripe-subscriptions',
        action: 'validate-config',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');

    // Validate input
    const validationResult = DeleteSubscriptionSchema.safeParse({ subscription_id: subscriptionId });
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    // Cancel subscription in Stripe
    const subscription = await stripe.subscriptions.cancel(validationResult.data.subscription_id);

    const processingTime = Date.now() - startTime;
    console.log(`Subscription cancelled successfully in ${processingTime}ms: ${subscription.id}`);

    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-subscriptions',
      action: 'cancel-subscription',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
