import axios from 'axios';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
  // Add initial invocation log
  console.log('🚀 create-docuseal-submission function invoked:', {
    httpMethod: event.httpMethod,
    timestamp: new Date().toISOString()
  });

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS
    };
  }

  try {
    const { uuid, submitters } = JSON.parse(event.body);
    
    // First get the template ID using the UUID
    const documentResponse = await axios.get(
      `https://api.docuseal.com/documents/${uuid}`,
      {
        headers: {
          'X-Auth-Token': process.env.DOCUSEAL_AUTH_TOKEN
        }
      }
    );

    const template_id = documentResponse.data.template_id;

    // Create submission using template ID
    const response = await axios.post(
      'https://api.docuseal.com/submissions',
      {
        template_id,
        send_email: true,
        submitters
      },
      {
        headers: {
          'X-Auth-Token': process.env.DOCUSEAL_AUTH_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log successful response
    console.log('✅ DocuSeal API Response:', {
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        submissionId: response.data[0].submission_id,
        message: 'Emails sent successfully',
        submitters: response.data
      })
    };

  } catch (error) {
    // Enhanced error logging
    console.error('❌ Error in create-docuseal-submission:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: error.response?.status || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to create submission',
        details: error.message,
        docusealError: error.response?.data
      })
    };
  }
}; 