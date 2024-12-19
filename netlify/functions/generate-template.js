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
      parties,
      date,
      contract_details,
      terms,
      start_date,
      end_date,
      termination_clause
    } = JSON.parse(event.body);

    // Validate required fields
    if (!template || !parties || !date || !contract_details || !terms || !start_date || !end_date || !termination_clause) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Validate parties array
    if (!Array.isArray(parties) || parties.length !== 2) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Exactly two parties are required' }),
      };
    }

    // Interpolate all placeholders
    let processedTemplate = template
      .replace(/{date}/g, date)
      .replace(/{parties\[0\]\.name}/g, parties[0].name)
      .replace(/{parties\[0\]\.email}/g, parties[0].email)
      .replace(/{parties\[1\]\.name}/g, parties[1].name)
      .replace(/{parties\[1\]\.email}/g, parties[1].email)
      .replace(/{contract_details}/g, contract_details)
      .replace(/{terms}/g, terms)
      .replace(/{start_date}/g, start_date)
      .replace(/{end_date}/g, end_date)
      .replace(/{termination_clause}/g, termination_clause);

    // Send the processed template to DocuSeal
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

    if (!templateResponse.data?.id) {
      throw new Error('Template creation failed: Missing template ID');
    }

    const contractLink = templateResponse.data.documents?.[0]?.url;
    const previewImageUrl = templateResponse.data.documents?.[0]?.preview_image_url;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Template and submission created successfully',
        templateId: templateResponse.data.id,
        contractLink,
        previewImageUrl,
      }),
    };
  } catch (error) {
    console.error('Error processing template:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
    };
  }
};