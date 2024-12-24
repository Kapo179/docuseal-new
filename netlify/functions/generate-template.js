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
      termination_clause,
      parties
    } = JSON.parse(event.body);

    // Log the incoming request
    console.log('📝 Incoming request data:', {
      date,
      contract_details,
      terms,
      start_date,
      end_date,
      termination_clause,
      parties
    });

    // Validate required fields
    if (!template || !date || !contract_details || !terms || !start_date || !end_date || !termination_clause || !parties) {
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

    // Replace party placeholders
    processedTemplate = processedTemplate
      .replace(/\[PARTY_1_NAME\]/g, parties[0]?.name || '')
      .replace(/\[PARTY_1_EMAIL\]/g, parties[0]?.email || '')
      .replace(/\[PARTY_2_NAME\]/g, parties[1]?.name || '')
      .replace(/\[PARTY_2_EMAIL\]/g, parties[1]?.email || '');

    // Send the processed template to DocuSeal
    console.log('🚀 Sending request to DocuSeal API...');
    const templateResponse = await axios.post(
      'https://api.docuseal.com/templates/html',
      {
        html: processedTemplate,
        name: 'Contract',
        size: 'Letter',
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

    // Format the contract link with your domain
    const contractLink = `https://contractquickly.com/contract/${templateResponse.data.id}`;
    const previewImageUrl = templateResponse.data.documents?.[0]?.preview_image_url;

    // Log the final response being sent back
    console.log('📤 Sending response:', {
      templateId: templateResponse.data.id,
      contractLink,
      previewImageUrl,
      parties: [
        { role: 'Party1', placeholder: '[PARTY_1_NAME] ([PARTY_1_EMAIL])' },
        { role: 'Party2', placeholder: '[PARTY_2_NAME] ([PARTY_2_EMAIL])' }
      ]
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Template and submission created successfully',
        templateId: templateResponse.data.id,
        contractLink,
        previewImageUrl,
        parties: [
          { role: 'Party1', placeholder: '[PARTY_1_NAME] ([PARTY_1_EMAIL])' },
          { role: 'Party2', placeholder: '[PARTY_2_NAME] ([PARTY_2_EMAIL])' }
        ]
      }),
    };
  } catch (error) {
    // Enhanced error logging
    console.error('❌ Error processing template:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        docusealError: error.response?.data
      }),
    };
  }
};