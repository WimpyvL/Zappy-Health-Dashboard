import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleError, ErrorType, ErrorSeverity } from '@/lib/error-handler';
import { z } from 'zod';

// Initialize Stripe with proper error handling
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const CreatePaymentIntentSchema = z.object({
  amount: z.number().min(50, 'Amount must be at least $0.50').max(999999999, 'Amount too large'), // Stripe minimum is 50 cents
  currency: z.string().length(3, 'Currency must be 3 characters').optional().default('usd'),
  customer: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

const UpdatePaymentIntentSchema = z.object({
  payment_intent_id: z.string().min(1, 'Payment Intent ID is required'),
  amount: z.number().min(50, 'Amount must be at least $0.50').max(999999999, 'Amount too large').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  customer: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

const GetPaymentIntentSchema = z.object({
  payment_intent_id: z.string().min(1, 'Payment Intent ID is required'),
});

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute for payment operations (more restrictive)
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
    // Rate limiting (more restrictive for payment operations)
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
        component: 'stripe-payment-intents',
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
    const validationResult = CreatePaymentIntentSchema.safeParse(requestData);
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

    const { amount, currency, customer, metadata } = validationResult.data;

    // Create payment intent in Stripe with proper parameters
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount), // Amount should be in cents
      currency,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    };

    if (customer) {
      paymentIntentData.customer = customer;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    const processingTime = Date.now() - startTime;
    console.log(`Payment intent created successfully in ${processingTime}ms: ${paymentIntent.id}`);

    return NextResponse.json({ paymentIntent }, { status: 201 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-payment-intents',
      action: 'create-payment-intent',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Card error occurred' },
        { status: 402 }
      );
    }

    // Don't expose sensitive error details
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
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
        component: 'stripe-payment-intents',
        action: 'validate-config',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    // Validate input
    const validationResult = GetPaymentIntentSchema.safeParse({ payment_intent_id: paymentIntentId });
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

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(validationResult.data.payment_intent_id);

    const processingTime = Date.now() - startTime;
    console.log(`Payment intent retrieved successfully in ${processingTime}ms: ${paymentIntent.id}`);

    return NextResponse.json({ paymentIntent }, { status: 200 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-payment-intents',
      action: 'get-payment-intent',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve payment intent' },
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
        component: 'stripe-payment-intents',
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
    const validationResult = UpdatePaymentIntentSchema.safeParse(requestData);
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

    const { payment_intent_id, ...updateData } = validationResult.data;

    // Update payment intent in Stripe - handle optional fields properly
    const paymentIntentUpdateData: Stripe.PaymentIntentUpdateParams = {};
    
    if (updateData.amount !== undefined) {
      paymentIntentUpdateData.amount = Math.round(updateData.amount);
    }
    if (updateData.currency !== undefined) {
      paymentIntentUpdateData.currency = updateData.currency;
    }
    if (updateData.customer !== undefined) {
      paymentIntentUpdateData.customer = updateData.customer;
    }
    if (updateData.metadata !== undefined) {
      paymentIntentUpdateData.metadata = updateData.metadata;
    }

    const paymentIntent = await stripe.paymentIntents.update(payment_intent_id, paymentIntentUpdateData);

    const processingTime = Date.now() - startTime;
    console.log(`Payment intent updated successfully in ${processingTime}ms: ${paymentIntent.id}`);

    return NextResponse.json({ paymentIntent }, { status: 200 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-payment-intents',
      action: 'update-payment-intent',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Payment intent not found or invalid data' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}
