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
    
    // Log incoming request
    console.log('📨 Incoming submission request:', {
      templateId,
      submitters,
      timestamp: new Date().toISOString()
    });

    if (!templateId || !submitters?.length) {
      console.error('❌ Validation failed:', { templateId, submittersCount: submitters?.length });
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'Invalid request',
          details: 'Template ID and at least one submitter are required'
        })
      };
    }

    console.log('🔍 Submitters to process:', submitters.map(s => ({
      name: s.name,
      email: s.email,
      role: s.role
    })));
    
    // Create submission in DocuSeal
    console.log('🚀 Sending request to DocuSeal submissions API...');
    const response = await axios.post(
      'https://api.docuseal.com/submissions',
      {
        template_id: templateId,
        submitters: submitters.map(s => ({
          name: s.name,
          email: s.email,
          fields: [], // Add any specific fields if needed
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

    console.log('✅ DocuSeal Submission Response:', JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      submissionId: response.data.id,
      submissionStatus: response.data.status,
      submissionUrl: response.data.url,
      timestamp: new Date().toISOString(),
      fullResponse: response.data
    }, null, 2));

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
    console.error('❌ Error creating submission:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to create submission',
        details: error.message,
        docusealError: error.response?.data
      })
    };
  }
}; 