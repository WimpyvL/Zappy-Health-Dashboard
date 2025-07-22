import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleError, ErrorType, ErrorSeverity } from '@/lib/error-handler';
import { z } from 'zod';

// Initialize Stripe with proper error handling
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const CreateCustomerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

const UpdateCustomerSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  phone: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

const GetCustomerSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
});

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // requests per minute for customer operations
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
        component: 'stripe-customers',
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
    const validationResult = CreateCustomerSchema.safeParse(requestData);
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

    const { email, name, phone, metadata } = validationResult.data;

    // Create customer in Stripe - handle optional fields properly
    const customerData: Stripe.CustomerCreateParams = {
      email,
      name,
      metadata: metadata || {},
    };

    if (phone) {
      customerData.phone = phone;
    }

    const customer = await stripe.customers.create(customerData);

    const processingTime = Date.now() - startTime;
    console.log(`Customer created successfully in ${processingTime}ms: ${customer.id}`);

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-customers',
      action: 'create-customer',
      metadata: { ip },
    });

    // Don't expose sensitive error details
    return NextResponse.json(
      { error: 'Failed to create customer' },
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
        component: 'stripe-customers',
        action: 'validate-config',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    // Validate input
    const validationResult = GetCustomerSchema.safeParse({ customer_id: customerId });
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

    // Retrieve customer from Stripe
    const customer = await stripe.customers.retrieve(validationResult.data.customer_id);

    const processingTime = Date.now() - startTime;
    console.log(`Customer retrieved successfully in ${processingTime}ms: ${customer.id}`);

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-customers',
      action: 'get-customer',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve customer' },
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
        component: 'stripe-customers',
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
    const validationResult = UpdateCustomerSchema.safeParse(requestData);
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

    const { customer_id, ...updateData } = validationResult.data;

    // Update customer in Stripe - handle optional fields properly
    const customerUpdateData: Stripe.CustomerUpdateParams = {};
    
    if (updateData.email !== undefined) {
      customerUpdateData.email = updateData.email;
    }
    if (updateData.name !== undefined) {
      customerUpdateData.name = updateData.name;
    }
    if (updateData.phone !== undefined) {
      customerUpdateData.phone = updateData.phone;
    }
    if (updateData.metadata !== undefined) {
      customerUpdateData.metadata = updateData.metadata;
    }

    const customer = await stripe.customers.update(customer_id, customerUpdateData);

    const processingTime = Date.now() - startTime;
    console.log(`Customer updated successfully in ${processingTime}ms: ${customer.id}`);

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-customers',
      action: 'update-customer',
      metadata: { ip },
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Customer not found or invalid data' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}
