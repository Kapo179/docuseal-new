import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
  // Add initial invocation log
  console.log('🚀 create-payment-intent function invoked:', {
    httpMethod: event.httpMethod,
    timestamp: new Date().toISOString()
  });

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS
    };
  }

  try {
    // Create a PaymentIntent with the fixed amount for contract signing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 299, // Amount in cents ($2.99)
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        service: 'contract_signing'
      },
      description: 'Contract Signing Service'
    });

    // Log successful creation
    console.log('✅ Payment Intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret
      })
    };
  } catch (error) {
    // Enhanced error logging
    console.error('❌ Error creating payment intent:', {
      message: error.message,
      type: error.type,
      code: error.code,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: error.message || 'Invalid payment request',
        code: error.code || 'unknown_error',
        type: error.constructor.name
      })
    };
  }
};