import fetch from 'node-fetch';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const documentId = event.queryStringParameters?.documentId;
  if (!documentId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Document ID is required' })
    };
  }

  try {
    const response = await fetch(
      `${process.env.BOLDSIGN_API_URL}/documents/${documentId}/status`,
      {
        headers: {
          'X-API-KEY': process.env.BOLDSIGN_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`BoldSign API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: data.status.toLowerCase(),
        message: data.message
      })
    };
  } catch (error) {
    console.error('BoldSign Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to check document status',
        message: error.message
      })
    };
  }
};