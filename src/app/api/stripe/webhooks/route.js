import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, updateDoc, addDoc, collection, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata.invoice_id;
    
    if (invoiceId) {
      // Update invoice status to paid
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        status: 'Paid',
        payment_status: 'succeeded',
        paid_at: Timestamp.now(),
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: Timestamp.now()
      });

      // Get invoice data to find patient
      const invoiceSnap = await getDoc(invoiceRef);
      const invoice = invoiceSnap.data();

      // Create payment transaction record
      await addDoc(collection(db, 'payment_transactions'), {
        invoice_id: invoiceId,
        patient_id: invoice.patientId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: 'succeeded',
        payment_method: paymentIntent.payment_method_types[0],
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
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata.invoice_id;
    
    if (invoiceId) {
      // Update invoice status to overdue
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        status: 'Overdue',
        payment_status: 'failed',
        payment_failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        updated_at: Timestamp.now()
      });

      // Create failed payment record
      await addDoc(collection(db, 'payment_transactions'), {
        invoice_id: invoiceId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        processed_at: Timestamp.now(),
        created_at: Timestamp.now()
      });

      console.log(`Payment failed for invoice ${invoiceId}`);
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleInvoicePaymentSucceeded(stripeInvoice) {
  try {
    // Handle subscription invoice payments
    const subscriptionId = stripeInvoice.subscription;
    
    if (subscriptionId) {
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
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(stripeInvoice) {
  try {
    const subscriptionId = stripeInvoice.subscription;
    
    if (subscriptionId) {
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
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    // Update existing subscription record or create new one
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('stripe_subscription_id', '==', subscription.id)
    );
    const subscriptionSnap = await getDocs(subscriptionsQuery);
    
    if (!subscriptionSnap.empty) {
      const subscriptionDoc = subscriptionSnap.docs[0];
      await updateDoc(subscriptionDoc.ref, {
        status: subscription.status,
        current_period_start: Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
        current_period_end: Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
        updated_at: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    // Find and update subscription in Firebase
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('stripe_subscription_id', '==', subscription.id)
    );
    const subscriptionSnap = await getDocs(subscriptionsQuery);
    
    if (!subscriptionSnap.empty) {
      const subscriptionDoc = subscriptionSnap.docs[0];
      await updateDoc(subscriptionDoc.ref, {
        status: subscription.status,
        current_period_start: Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
        current_period_end: Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
        updated_at: Timestamp.now()
      });

      // Update patient subscription status
      const subscriptionData = subscriptionDoc.data();
      if (subscriptionData.patient_id) {
        const patientRef = doc(db, 'patients', subscriptionData.patient_id);
        await updateDoc(patientRef, {
          subscription_status: subscription.status,
          updated_at: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    // Update subscription status to cancelled
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('stripe_subscription_id', '==', subscription.id)
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
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleSetupIntentSucceeded(setupIntent) {
  try {
    // Handle successful payment method setup
    console.log('Setup intent succeeded:', setupIntent.id);
    
    // You can update customer's default payment method here if needed
    const customerId = setupIntent.customer;
    const paymentMethodId = setupIntent.payment_method;
    
    if (customerId && paymentMethodId) {
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
    }
  } catch (error) {
    console.error('Error handling setup intent succeeded:', error);
  }
}