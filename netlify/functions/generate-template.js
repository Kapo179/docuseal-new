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
    const {
      template,
      date,
      contract_details,
      terms,
      start_date,
      end_date,
      termination_clause
    } = JSON.parse(event.body);

    // Log the incoming request
    console.log('📝 Incoming request data:', {
      date,
      contract_details,
      terms,
      start_date,
      end_date,
      termination_clause
    });

    // Validate required fields
    if (!template || !date || !contract_details || !terms || !start_date || !end_date || !termination_clause) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Process template with dynamic replacements
    let processedTemplate = template;

    // Replace standard placeholders
    processedTemplate = processedTemplate
      .replace(/{date}/g, date)
      .replace(/{contract_details}/g, contract_details)
      .replace(/{terms}/g, terms)
      .replace(/{start_date}/g, start_date)
      .replace(/{end_date}/g, end_date)
      .replace(/{termination_clause}/g, termination_clause);

    // Remove party placeholder processing since ChatGPT will handle it

    // Send the processed template to DocuSeal
    console.log('🚀 Sending request to DocuSeal API...');
    const templateResponse = await axios.post(
      'https://api.docuseal.com/templates/html',
      {
        html: processedTemplate,
        name: 'Contract',
        size: 'Letter',
      },
      {
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    // Log the complete DocuSeal response
    console.log('✅ DocuSeal API Response:', JSON.stringify({
      status: templateResponse.status,
      statusText: templateResponse.statusText,
      data: templateResponse.data,
      headers: templateResponse.headers
    }, null, 2));

    if (!templateResponse.data?.id) {
      console.error('❌ Template creation failed: No template ID in response');
      throw new Error('Template creation failed: Missing template ID');
    }

    // Format the contract link with your domain and UUID
    const contractLink = `https://contractquickly.com/contract/${templateResponse.data.documents[0].uuid}`;
    const previewImageUrl = templateResponse.data.documents?.[0]?.preview_image_url;

    // Log the final response being sent back
    console.log('📤 Sending response:', {
      uuid: templateResponse.data.documents[0].uuid,
      contractLink,
      previewImageUrl: templateResponse.data.documents[0].preview_image_url
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        uuid: templateResponse.data.documents[0].uuid,
        contractLink,
        previewImageUrl: templateResponse.data.documents[0].preview_image_url
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