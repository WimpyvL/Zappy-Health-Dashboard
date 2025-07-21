/**
 * Stripe Service - Handles all Stripe API interactions
 * Integrates with existing Firebase billing infrastructure
 */
import { loadStripe } from '@stripe/stripe-js';
import { collection, doc, updateDoc, addDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

class StripeService {
  constructor() {
    this.stripe = null;
    this.init();
  }

  async init() {
    this.stripe = await stripePromise;
  }

  /**
   * Creates or retrieves a Stripe customer for a patient
   */
  async createOrGetCustomer(patientId, patientData) {
    try {
      // Check if customer already exists in Firebase
      const patientRef = doc(db, 'patients', patientId);
      const patientSnap = await getDoc(patientRef);
      const patient = patientSnap.data();

      if (patient?.stripe_customer_id) {
        return { customerId: patient.stripe_customer_id, isNew: false };
      }

      // Create new Stripe customer via API route
      const response = await fetch('/api/stripe/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: patientData.email,
          name: `${patientData.firstName} ${patientData.lastName}`,
          phone: patientData.phone,
          metadata: { patient_id: patientId }
        })
      });

      const { customer } = await response.json();

      // Save customer ID to patient record
      await updateDoc(patientRef, {
        stripe_customer_id: customer.id,
        billing_address: patientData.address || null,
        updated_at: Timestamp.now()
      });

      return { customerId: customer.id, isNew: true };
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Creates a payment intent for an invoice
   */
  async createPaymentIntent(invoiceId, customerId, amount) {
    try {
      const response = await fetch('/api/stripe/payment-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          customer: customerId,
          metadata: { invoice_id: invoiceId }
        })
      });

      const { paymentIntent } = await response.json();

      // Update invoice with payment intent ID
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
        updated_at: Timestamp.now()
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Processes a one-time payment for an invoice
   */
  async processInvoicePayment(invoiceId, patientId) {
    try {
      // Get invoice and patient data
      const [invoiceSnap, patientSnap] = await Promise.all([
        getDoc(doc(db, 'invoices', invoiceId)),
        getDoc(doc(db, 'patients', patientId))
      ]);

      if (!invoiceSnap.exists() || !patientSnap.exists()) {
        throw new Error('Invoice or patient not found');
      }

      const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() };
      const patient = { id: patientSnap.id, ...patientSnap.data() };

      // Create or get Stripe customer
      const { customerId } = await this.createOrGetCustomer(patientId, patient);

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(invoiceId, customerId, invoice.amount);

      // Confirm payment with Stripe Elements
      const result = await this.stripe.confirmPayment({
        elements: null, // Will be provided by the payment form
        clientSecret: paymentIntent.client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/billing/success`,
        },
      });

      return result;
    } catch (error) {
      console.error('Error processing invoice payment:', error);
      throw error;
    }
  }

  /**
   * Creates a subscription for recurring billing
   */
  async createSubscription(patientId, productId, priceId) {
    try {
      const patientSnap = await getDoc(doc(db, 'patients', patientId));
      const patient = { id: patientSnap.id, ...patientSnap.data() };

      // Create or get Stripe customer
      const { customerId } = await this.createOrGetCustomer(patientId, patient);

      // Create subscription via API route
      const response = await fetch('/api/stripe/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerId,
          price_id: priceId,
          metadata: { 
            patient_id: patientId,
            product_id: productId
          }
        })
      });

      const { subscription } = await response.json();

      // Save subscription to Firebase
      const subscriptionRef = await addDoc(collection(db, 'subscriptions'), {
        patient_id: patientId,
        product_id: productId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: subscription.status,
        current_period_start: Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
        current_period_end: Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });

      // Update patient with subscription info
      await updateDoc(doc(db, 'patients', patientId), {
        active_subscription_id: subscriptionRef.id,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        updated_at: Timestamp.now()
      });

      return { subscription, subscriptionId: subscriptionRef.id };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Updates payment method for a customer
   */
  async updatePaymentMethod(customerId, paymentMethodId) {
    try {
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          payment_method_id: paymentMethodId
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  /**
   * Retrieves payment methods for a customer
   */
  async getPaymentMethods(customerId) {
    try {
      const response = await fetch(`/api/stripe/payment-methods?customer_id=${customerId}`);
      const { paymentMethods } = await response.json();
      return paymentMethods;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw error;
    }
  }

  /**
   * Handles webhook events from Stripe
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSuccess(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Handles successful payment intent
   */
  async handlePaymentSuccess(paymentIntent) {
    const invoiceId = paymentIntent.metadata.invoice_id;
    if (invoiceId) {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        status: 'Paid',
        payment_status: 'succeeded',
        paid_at: Timestamp.now(),
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: Timestamp.now()
      });

      // Log payment transaction
      await addDoc(collection(db, 'payment_transactions'), {
        invoice_id: invoiceId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: 'succeeded',
        processed_at: Timestamp.now()
      });
    }
  }

  /**
   * Handles failed payment intent
   */
  async handlePaymentFailure(paymentIntent) {
    const invoiceId = paymentIntent.metadata.invoice_id;
    if (invoiceId) {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        payment_status: 'failed',
        status: 'Overdue',
        updated_at: Timestamp.now()
      });
    }
  }

  /**
   * Handles successful invoice payment (for subscriptions)
   */
  async handleInvoicePaymentSuccess(stripeInvoice) {
    // Handle subscription invoice payments
    const subscriptionId = stripeInvoice.subscription;
    if (subscriptionId) {
      // Update subscription status in Firebase
      // This would query subscriptions collection by stripe_subscription_id
      // and update the status accordingly
    }
  }

  /**
   * Handles subscription updates
   */
  async handleSubscriptionUpdate(subscription) {
    // Update subscription record in Firebase
    console.log('Subscription updated:', subscription.id);
  }

  /**
   * Handles subscription cancellation
   */
  async handleSubscriptionCancellation(subscription) {
    // Update subscription status to cancelled in Firebase
    console.log('Subscription cancelled:', subscription.id);
  }
}

export const stripeService = new StripeService();