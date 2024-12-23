import axios from 'axios';

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

  try {
    const { templateId, submitters } = JSON.parse(event.body);
    
    // Create submission in DocuSeal
    const response = await axios.post(
      'https://api.docuseal.com/submissions',
      {
        template_id: templateId,
        submitters: submitters
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
        submissionId: response.data.id,
        message: 'Emails sent successfully'
      })
    };
  } catch (error) {
    console.error('Error creating submission:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to create submission',
        details: error.message
      })
    };
  }
}; 