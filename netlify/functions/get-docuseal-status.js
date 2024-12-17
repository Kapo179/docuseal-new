import axios from 'axios';

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

  const templateId = event.queryStringParameters?.templateId;
  if (!templateId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Template ID is required' })
    };
  }

  try {
    const response = await axios.get(
      `https://api.docuseal.com/templates/${templateId}/status`,
      {
        headers: {
          'X-Auth-Token': process.env.DOCUSEAL_AUTH_TOKEN
        }
      }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: response.data.status.toLowerCase(),
        message: response.data.message
      })
    };
  } catch (error) {
    console.error('DocuSeal Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to check template status',
        message: error.message
      })
    };
  }
}