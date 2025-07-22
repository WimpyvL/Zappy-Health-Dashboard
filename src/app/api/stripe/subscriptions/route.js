import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const { customer, price_id, metadata, payment_behavior } = await request.json();

    if (!customer || !price_id) {
      return NextResponse.json(
        { error: 'Customer and price_id are required' },
        { status: 400 }
      );
    }

    // Create subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer,
      items: [{ price: price_id }],
      payment_behavior: payment_behavior || 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: metadata || {},
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const customerId = searchParams.get('customer_id');

    if (subscriptionId) {
      // Retrieve specific subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return NextResponse.json({ subscription }, { status: 200 });
    } else if (customerId) {
      // List subscriptions for a customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.default_payment_method'],
      });
      return NextResponse.json({ subscriptions: subscriptions.data }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Subscription ID or Customer ID is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error retrieving subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscriptions', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { subscription_id, ...updateData } = await request.json();

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Update subscription in Stripe
    const subscription = await stripe.subscriptions.update(subscription_id, updateData);

    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Cancel subscription in Stripe
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    );
  }
}