import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Version, Stripe-Signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Content-Type': 'application/json'
};

// For Stripe-specific resources
const STRIPE_RESOURCE_HEADERS = {
  ...CORS_HEADERS,
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Timing-Allow-Origin': '*',
  'Cache-Control': 'max-age=60, stale-while-revalidate=900'
};

export const handler = async (event) => {
  // Add initial invocation log
  console.log('🚀 create-payment-intent function invoked:', {
    httpMethod: event.httpMethod,
    timestamp: new Date().toISOString(),
    origin: event.headers.origin,
    referer: event.headers.referer
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS
    };
  }

  // Handle Stripe resource requests
  if (event.path.includes('stripe.com')) {
    return {
      statusCode: 200,
      headers: STRIPE_RESOURCE_HEADERS
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 299,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        service: 'contract_signing'
      },
      description: 'Contract Signing Service'
    });

    console.log('✅ Payment Intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Cross-Origin-Resource-Policy': 'same-site'
      },
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret
      })
    };
  } catch (error) {
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