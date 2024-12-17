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
    const { paymentIntentId } = JSON.parse(event.body);

    if (!paymentIntentId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Payment intent ID is required' })
      };
    }

    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: paymentIntent.status,
        amount_captured: paymentIntent.amount_captured
      })
    };
  } catch (error) {
    console.error('Payment Capture Error:', {
      type: error.type,
      message: error.message,
      code: error.code
    });
    
    const errorMessage = error.type === 'StripeCardError' ? error.message :
      error.type === 'StripeInvalidRequestError' ? 'Invalid capture request' :
      error.type === 'StripeAPIError' ? 'Payment service temporarily unavailable' :
      'An unexpected error occurred';

    return {
      statusCode: error.type === 'StripeAPIError' ? 503 : 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: errorMessage,
        code: error.code || 'unknown_error'
      })
    };
  }
};