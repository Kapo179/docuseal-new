import axios from 'axios';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const authToken = process.env.DOCUSEAL_AUTH_TOKEN;
  if (!authToken) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  try {
    const { template, parties } = JSON.parse(event.body);
    
    // Replace party placeholders with actual data
    let processedTemplate = template
      .replace(/\[PARTY_1_NAME\]/g, parties[0]?.name || '')
      .replace(/\[PARTY_1_EMAIL\]/g, parties[0]?.email || '')
      .replace(/\[PARTY_2_NAME\]/g, parties[1]?.name || '')
      .replace(/\[PARTY_2_EMAIL\]/g, parties[1]?.email || '');

    // Create DocuSeal template with proper party roles
    const templateResponse = await axios.post(
      'https://api.docuseal.com/templates',
      {
        name: 'Contract',
        content: processedTemplate,
        submitters: [
          {
            role: 'Party1',
            fields: []
          },
          {
            role: 'Party2',
            fields: []
          }
        ]
      },
      {
        headers: {
          'X-Auth-Token': process.env.DOCUSEAL_AUTH_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        templateId: templateResponse.data.id,
        parties: [
          { role: 'Party1', placeholder: '[PARTY_1_NAME] ([PARTY_1_EMAIL])' },
          { role: 'Party2', placeholder: '[PARTY_2_NAME] ([PARTY_2_EMAIL])' }
        ]
      })
    };
  } catch (error) {
    // Enhanced error logging
    console.error('❌ Error processing template:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data // Log DocuSeal error response if available
    });

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        docusealError: error.response?.data // Include DocuSeal error details in response
      }),
    };
  }
};