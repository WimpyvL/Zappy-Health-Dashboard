import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc, addDoc, collection, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleError, ErrorType, ErrorSeverity } from '@/lib/error-handler';
import { z } from 'zod';

// Initialize Stripe with proper error handling
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Validation schemas
const PaymentIntentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  metadata: z.object({
    invoice_id: z.string().optional(),
  }),
  payment_method_types: z.array(z.string()),
  last_payment_error: z.object({
    message: z.string(),
  }).optional(),
});

const SubscriptionSchema = z.object({
  id: z.string(),
  status: z.string(),
  current_period_start: z.number(),
  current_period_end: z.number(),
});

const InvoiceSchema = z.object({
  id: z.string(),
  subscription: z.string().optional(),
});

const SetupIntentSchema = z.object({
  id: z.string(),
  customer: z.string().optional(),
  payment_method: z.string().optional(),
});

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.ip || 'unknown';
  
  try {
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate required environment variables
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      handleError(new Error('Missing required Stripe configuration'), {
        type: ErrorType.API,
        severity: ErrorSeverity.CRITICAL,
        component: 'stripe-webhook',
        action: 'validate-config',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      handleError(err, {
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        component: 'stripe-webhook',
        action: 'verify-signature',
        metadata: { ip, error: err.message },
      });
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Log webhook received
    console.log(`Webhook received: ${event.type} (${event.id})`);

    // Handle the event with proper error handling
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'setup_intent.succeeded':
          await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      const processingTime = Date.now() - startTime;
      console.log(`Webhook ${event.type} processed successfully in ${processingTime}ms`);

      return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
      handleError(error, {
        type: ErrorType.API,
        severity: ErrorSeverity.HIGH,
        component: 'stripe-webhook',
        action: `handle-${event.type}`,
        metadata: { eventId: event.id, ip },
      });
      
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.API,
      severity: ErrorSeverity.CRITICAL,
      component: 'stripe-webhook',
      action: 'process-request',
      metadata: { ip },
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    // Validate input
    const validatedPaymentIntent = PaymentIntentSchema.parse(paymentIntent);
    const invoiceId = validatedPaymentIntent.metadata.invoice_id;
    
    if (!invoiceId) {
      console.log('Payment intent succeeded but no invoice_id in metadata');
      return;
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Update invoice status to paid
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await updateDoc(invoiceRef, {
      status: 'Paid',
      payment_status: 'succeeded',
      paid_at: Timestamp.now(),
      stripe_payment_intent_id: validatedPaymentIntent.id,
      updated_at: Timestamp.now()
    });

    // Get invoice data to find patient
    const invoiceSnap = await getDoc(invoiceRef);
    if (!invoiceSnap.exists()) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    const invoice = invoiceSnap.data();

    // Create payment transaction record
    await addDoc(collection(db, 'payment_transactions'), {
      invoice_id: invoiceId,
      patient_id: invoice.patientId,
      stripe_payment_intent_id: validatedPaymentIntent.id,
      amount: validatedPaymentIntent.amount / 100, // Convert from cents
      currency: validatedPaymentIntent.currency,
      status: 'succeeded',
      payment_method: validatedPaymentIntent.payment_method_types[0],
      processed_at: Timestamp.now(),
      created_at: Timestamp.now()
    });

    // Update related order if exists
    if (invoice.orderId) {
      const orderRef = doc(db, 'orders', invoice.orderId);
      await updateDoc(orderRef, {
        status: 'paid',
        payment_status: 'succeeded',
        updated_at: Timestamp.now()
      });
    }

    // Update telehealth flow if exists
    if (invoice.flow_id) {
      const flowRef = doc(db, 'enhanced_telehealth_flows', invoice.flow_id);
      await updateDoc(flowRef, {
        current_status: 'payment_completed',
        payment_completed_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    }

    console.log(`Payment succeeded for invoice ${invoiceId}`);
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-webhook',
      action: 'handle-payment-succeeded',
      metadata: { paymentIntentId: paymentIntent.id },
    });
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const validatedPaymentIntent = PaymentIntentSchema.parse(paymentIntent);
    const invoiceId = validatedPaymentIntent.metadata.invoice_id;
    
    if (!invoiceId) {
      console.log('Payment intent failed but no invoice_id in metadata');
      return;
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Update invoice status to overdue
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await updateDoc(invoiceRef, {
      status: 'Overdue',
      payment_status: 'failed',
      payment_failure_reason: validatedPaymentIntent.last_payment_error?.message || 'Payment failed',
      updated_at: Timestamp.now()
    });

    // Create failed payment record
    await addDoc(collection(db, 'payment_transactions'), {
      invoice_id: invoiceId,
      stripe_payment_intent_id: validatedPaymentIntent.id,
      amount: validatedPaymentIntent.amount / 100,
      currency: validatedPaymentIntent.currency,
      status: 'failed',
      failure_reason: validatedPaymentIntent.last_payment_error?.message || 'Payment failed',
      processed_at: Timestamp.now(),
      created_at: Timestamp.now()
    });

    console.log(`Payment failed for invoice ${invoiceId}`);
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-webhook',
      action: 'handle-payment-failed',
      metadata: { paymentIntentId: paymentIntent.id },
    });
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(stripeInvoice: Stripe.Invoice): Promise<void> {
  try {
    const validatedInvoice = InvoiceSchema.parse(stripeInvoice);
    const subscriptionId = validatedInvoice.subscription;
    
    if (!subscriptionId) {
      console.log('Invoice payment succeeded but no subscription');
      return;
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Find subscription in Firebase by stripe_subscription_id
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('stripe_subscription_id', '==', subscriptionId)
    );
    const subscriptionSnap = await getDocs(subscriptionsQuery);
    
    if (!subscriptionSnap.empty) {
      const subscriptionDoc = subscriptionSnap.docs[0];
      await updateDoc(subscriptionDoc.ref, {
        status: 'active',
        last_payment_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });

      // Update patient subscription status
      const subscription = subscriptionDoc.data();
      if (subscription.patient_id) {
        const patientRef = doc(db, 'patients', subscription.patient_id);
        await updateDoc(patientRef, {
          subscription_status: 'active',
          updated_at: Timestamp.now()
        });
      }
    }
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-webhook',
      action: 'handle-invoice-payment-succeeded',
      metadata: { invoiceId: stripeInvoice.id },
    });
    throw error;
  }
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice): Promise<void> {
  try {
    const validatedInvoice = InvoiceSchema.parse(stripeInvoice);
    const subscriptionId = validatedInvoice.subscription;
    
    if (!subscriptionId) {
      console.log('Invoice payment failed but no subscription');
      return;
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Find subscription in Firebase
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('stripe_subscription_id', '==', subscriptionId)
    );
    const subscriptionSnap = await getDocs(subscriptionsQuery);
    
    if (!subscriptionSnap.empty) {
      const subscriptionDoc = subscriptionSnap.docs[0];
      await updateDoc(subscriptionDoc.ref, {
        status: 'past_due',
        last_payment_failure_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    }
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-webhook',
      action: 'handle-invoice-payment-failed',
      metadata: { invoiceId: stripeInvoice.id },
    });
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  try {
    const validatedSubscription = SubscriptionSchema.parse(subscription);

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Update existing subscription record or create new one
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('stripe_subscription_id', '==', validatedSubscription.id)
    );
    const subscriptionSnap = await getDocs(subscriptionsQuery);
    
    if (!subscriptionSnap.empty) {
      const subscriptionDoc = subscriptionSnap.docs[0];
      await updateDoc(subscriptionDoc.ref, {
        status: validatedSubscription.status,
        current_period_start: Timestamp.fromDate(new Date(validatedSubscription.current_period_start * 1000)),
        current_period_end: Timestamp.fromDate(new Date(validatedSubscription.current_period_end * 1000)),
        updated_at: Timestamp.now()
      });
    }
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-webhook',
      action: 'handle-subscription-created',
      metadata: { subscriptionId: subscription.id },
    });
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  try {
    const validatedSubscription = SubscriptionSchema.parse(subscription);

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Find and update subscription in Firebase
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('stripe_subscription_id', '==', validatedSubscription.id)
    );
    const subscriptionSnap = await getDocs(subscriptionsQuery);
    
    if (!subscriptionSnap.empty) {
      const subscriptionDoc = subscriptionSnap.docs[0];
      await updateDoc(subscriptionDoc.ref, {
        status: validatedSubscription.status,
        current_period_start: Timestamp.fromDate(new Date(validatedSubscription.current_period_start * 1000)),
        current_period_end: Timestamp.fromDate(new Date(validatedSubscription.current_period_end * 1000)),
        updated_at: Timestamp.now()
      });

      // Update patient subscription status
      const subscriptionData = subscriptionDoc.data();
      if (subscriptionData.patient_id) {
        const patientRef = doc(db, 'patients', subscriptionData.patient_id);
        await updateDoc(patientRef, {
          subscription_status: validatedSubscription.status,
          updated_at: Timestamp.now()
        });
      }
    }
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-webhook',
      action: 'handle-subscription-updated',
      metadata: { subscriptionId: subscription.id },
    });
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    const validatedSubscription = SubscriptionSchema.parse(subscription);

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Update subscription status to cancelled
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('stripe_subscription_id', '==', validatedSubscription.id)
    );
    const subscriptionSnap = await getDocs(subscriptionsQuery);
    
    if (!subscriptionSnap.empty) {
      const subscriptionDoc = subscriptionSnap.docs[0];
      await updateDoc(subscriptionDoc.ref, {
        status: 'cancelled',
        cancelled_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });

      // Update patient subscription status
      const subscriptionData = subscriptionDoc.data();
      if (subscriptionData.patient_id) {
        const patientRef = doc(db, 'patients', subscriptionData.patient_id);
        await updateDoc(patientRef, {
          subscription_status: 'cancelled',
          updated_at: Timestamp.now()
        });
      }
    }
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.HIGH,
      component: 'stripe-webhook',
      action: 'handle-subscription-deleted',
      metadata: { subscriptionId: subscription.id },
    });
    throw error;
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent): Promise<void> {
  try {
    const validatedSetupIntent = SetupIntentSchema.parse(setupIntent);
    
    console.log('Setup intent succeeded:', validatedSetupIntent.id);
    
    const customerId = validatedSetupIntent.customer;
    const paymentMethodId = validatedSetupIntent.payment_method;
    
    if (!customerId || !paymentMethodId) {
      console.log('Setup intent succeeded but missing customer or payment method');
      return;
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    // Find patient by stripe_customer_id and update default payment method
    const patientsQuery = query(
      collection(db, 'patients'),
      where('stripe_customer_id', '==', customerId)
    );
    const patientSnap = await getDocs(patientsQuery);
    
    if (!patientSnap.empty) {
      const patientDoc = patientSnap.docs[0];
      await updateDoc(patientDoc.ref, {
        default_payment_method: paymentMethodId,
        updated_at: Timestamp.now()
      });
    }
  } catch (error: any) {
    handleError(error, {
      type: ErrorType.DATABASE,
      severity: ErrorSeverity.MEDIUM,
      component: 'stripe-webhook',
      action: 'handle-setup-intent-succeeded',
      metadata: { setupIntentId: setupIntent.id },
    });
    throw error;
  }
}
