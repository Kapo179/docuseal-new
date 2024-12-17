import fetch from 'node-fetch';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 204, 
      headers: CORS_HEADERS 
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { documentId } = event.queryStringParameters;

  if (!documentId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Document ID is required' })
    };
  }

  try {
    const response = await fetch(
      `${process.env.BOLDSIGN_API_URL}/v1/document/downloadAuditLog?documentId=${documentId}`,
      {
        headers: {
          'X-API-KEY': process.env.BOLDSIGN_API_KEY,
          'Accept': 'application/pdf'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`BoldSign API error: ${response.statusText}`);
    }

    const buffer = await response.buffer();

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="audit-trail-${documentId}.pdf"`
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Audit Trail Download Error:', error);

    return {
      statusCode: error.response?.status || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to download audit trail',
        message: error.message
      })
    };
  }
};