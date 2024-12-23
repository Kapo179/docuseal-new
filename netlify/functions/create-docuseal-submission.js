import axios from 'axios';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
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

  if (event.httpMethod !== 'POST') {
    console.log('❌ Invalid HTTP method:', event.httpMethod);
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { templateId, submitters } = JSON.parse(event.body);
    
    // Log request data
    console.log('📥 Received submission request:', {
      templateId,
      submitters,
      timestamp: new Date().toISOString()
    });

    if (!templateId || !submitters?.length) {
      console.error('❌ Missing required fields:', { templateId, submittersCount: submitters?.length });
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Log DocuSeal API request
    console.log('📤 Sending request to DocuSeal API:', {
      url: 'https://api.docuseal.com/submissions',
      templateId,
      submitters
    });

    const response = await axios.post(
      'https://api.docuseal.com/submissions',
      {
        template_id: templateId,
        submitters: submitters.map(s => ({
          name: s.name,
          email: s.email,
          fields: [],
          role: s.role
        }))
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
      submissionId: response.data.id,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        submissionId: response.data.id,
        message: 'Emails sent successfully',
        submissionDetails: {
          status: response.data.status,
          url: response.data.url,
          submitters: response.data.submitters
        }
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