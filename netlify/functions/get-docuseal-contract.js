import axios from 'axios';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

export const handler = async (event) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const authToken = process.env.DOCUSEAL_AUTH_TOKEN;
  if (!authToken) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    // Get templateId from query parameters
    const templateId = event.queryStringParameters?.templateId;
    
    if (!templateId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Template ID is required' })
      };
    }

    console.log('🔍 Fetching template:', templateId);

    // Fetch template from DocuSeal
    const response = await axios.get(
      `https://api.docuseal.com/templates/${templateId}`,
      {
        headers: {
          'X-Auth-Token': authToken,
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ DocuSeal API Response:', JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      data: response.data
    }, null, 2));

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