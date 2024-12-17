import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Creating payment intent');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 299,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        service: 'vehicle_agreement_signing',
        timestamp: new Date().toISOString()
      },
      description: 'Vehicle Sales Agreement Digital Signing Service',
      statement_descriptor: 'SMART CONTRACTS',
      statement_descriptor_suffix: 'VEHICLE AGR',
      capture_method: 'automatic',
      setup_future_usage: 'off_session',
      confirm: false,
    });

    console.log('Payment intent created:', paymentIntent.id);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        }
      })
    };
  } catch (error) {
    console.error('Payment Intent Creation Error:', {
      type: error.type,
      message: error.message,
      code: error.code,
      requestId: error.requestId
    });
    
    const errorMessage = error.type === 'StripeCardError' ? error.message :
      error.type === 'StripeInvalidRequestError' ? 'Invalid payment request' :
      error.type === 'StripeAPIError' ? 'Payment service temporarily unavailable' :
      'An unexpected error occurred';

    return {
      statusCode: error.type === 'StripeAPIError' ? 503 : 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: errorMessage,
        code: error.code || 'unknown_error',
        type: error.type
      })
    };
  }
};