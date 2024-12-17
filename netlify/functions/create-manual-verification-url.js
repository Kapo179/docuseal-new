import fetch from 'node-fetch';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
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

  if (!process.env.BOLDSIGN_API_KEY || !process.env.BOLDSIGN_API_URL) {
    console.error('Missing BoldSign configuration');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    const { documentId, emailId, order, redirectUrl } = JSON.parse(event.body);

    const response = await fetch(
      `${process.env.BOLDSIGN_API_URL}/v1-beta/identityVerification/createEmbeddedVerificationUrl?documentId=${documentId}`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.BOLDSIGN_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          emailId,
          order,
          redirectUrl
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `BoldSign API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('BoldSign Manual Verification Error:', error);

    return {
      statusCode: error.response?.status || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to create manual verification URL',
        message: error.message,
        details: error.response ? await error.response.text() : undefined
      })
    };
  }
};