import { createHmac } from 'crypto';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 204, 
      headers: CORS_HEADERS 
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verify webhook signature
  const signature = event.headers['x-boldsign-signature'];
  if (!signature) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing signature' })
    };
  }

  try {
    // Verify the webhook signature
    const webhookSecret = process.env.BOLDSIGN_WEBHOOK_SECRET;
    const hmac = createHmac('sha256', webhookSecret);
    const calculatedSignature = hmac
      .update(event.body)
      .digest('hex');

    if (signature !== calculatedSignature) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const payload = JSON.parse(event.body);
    console.log('Received BoldSign webhook:', payload.eventType);

    switch (payload.eventType) {
      case 'DocumentCompleted':
        console.log('Document completed:', payload.documentId);
        // Handle document completion
        break;

      case 'SignerCompleted':
        console.log('Signer completed:', {
          documentId: payload.documentId,
          signerEmail: payload.signerEmail
        });
        // Handle signer completion
        break;

      case 'DocumentDeclined':
        console.log('Document declined:', {
          documentId: payload.documentId,
          signerEmail: payload.signerEmail,
          reason: payload.reason
        });
        // Handle document declined
        break;

      case 'DocumentExpired':
        console.log('Document expired:', payload.documentId);
        // Handle document expiration
        break;
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Webhook processing failed',
        message: error.message 
      })
    };
  }
};