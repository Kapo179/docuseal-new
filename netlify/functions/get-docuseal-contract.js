import axios from 'axios';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_URL;
  const DOCUSEAL_AUTH_TOKEN = process.env.DOCUSEAL_AUTH_TOKEN;

  if (!DOCUSEAL_API_URL || !DOCUSEAL_AUTH_TOKEN) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error: missing DocuSeal API details' }),
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
    };
  }

  const { templateId } = event.pathParameters || {};
  console.log('Extracted templateId:', templateId);

  if (!templateId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing required templateId parameter' }),
    };
  }

  try {
    const response = await axios.get(`${DOCUSEAL_API_URL}/templates/${templateId}`, {
      headers: {
        'X-Auth-Token': DOCUSEAL_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Error fetching DocuSeal template:', error.response?.data || error.message);

    return {
      statusCode: error.response?.status || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to fetch contract data' }),
    };
  }
};