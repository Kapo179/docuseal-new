import axios from 'axios';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

export const handler = async (event) => {
  const { uuid } = event.queryStringParameters;

  if (!uuid) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'UUID is required' })
    };
  }

  try {
    // Get template by UUID
    const response = await axios.get(
      `https://api.docuseal.com/documents/${uuid}`,
      {
        headers: {
          'X-Auth-Token': process.env.DOCUSEAL_AUTH_TOKEN
        }
      }
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        documents: response.data.documents,
        name: response.data.name,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at
      })
    };

  } catch (error) {
    console.error('❌ Error fetching template:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 404) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Template not found',
          details: 'The requested template does not exist'
        })
      };
    }

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to fetch template',
        details: error.message,
        docusealError: error.response?.data
      })
    };
  }
};