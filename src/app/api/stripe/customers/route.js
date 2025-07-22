import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const { email, name, phone, metadata } = await request.json();

    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata: metadata || {},
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Retrieve customer from Stripe
    const customer = await stripe.customers.retrieve(customerId);

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customer', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { customer_id, ...updateData } = await request.json();

    if (!customer_id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Update customer in Stripe
    const customer = await stripe.customers.update(customer_id, updateData);

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    console.error('Error updating Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer', details: error.message },
      { status: 500 }
    );
  }
}