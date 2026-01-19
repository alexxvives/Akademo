import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe with your secret key (lazy initialization)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });
    
    const { priceId, successUrl, cancelUrl } = await request.json();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // Use 'subscription' for recurring payments or 'payment' for one-time
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
