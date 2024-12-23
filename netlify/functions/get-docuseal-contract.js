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
    console.log('🔍 Fetching document with UUID:', uuid);

    // Get template by UUID - using the correct endpoint
    const response = await axios.get(
      `https://api.docuseal.com/templates/${uuid}`, // Updated endpoint
      {
        headers: {
          'X-Auth-Token': process.env.DOCUSEAL_AUTH_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ DocuSeal API Response:', {
      status: response.status,
      data: response.data
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        documents: response.data.documents,
        content: response.data.content,
        name: response.data.name,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        submitters: response.data.submitters
      })
    };

  } catch (error) {
    console.error('❌ Error fetching template:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      uuid: uuid
    });

    // Handle specific error cases
    if (error.response?.status === 404) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Contract not found',
          details: 'The requested contract does not exist',
          uuid: uuid
        })
      };
    }

    return {
      statusCode: error.response?.status || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to fetch contract',
        details: error.message,
        docusealError: error.response?.data
      })
    };
  }
};