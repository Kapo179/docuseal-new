import fetch from 'node-fetch';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { documentId, signerId } = JSON.parse(event.body);

    if (!documentId || !signerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Document ID and Signer ID are required' })
      };
    }

    const response = await fetch(
      `${process.env.BOLDSIGN_API_URL}/documents/${documentId}/signers/${signerId}/embeddedSign`,
      {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.BOLDSIGN_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUrl: `${process.env.URL || 'http://localhost:5173'}/signing-status`,
        }),
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
        signerId: data.signerId,
        signingUrl: data.signingUrl,
        expiresAt: data.expiresAt
      })
    };
  } catch (error) {
    console.error('BoldSign Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get embedded signing URL',
        message: error.message
      })
    };
  }
};