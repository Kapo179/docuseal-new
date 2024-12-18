const axios = require('axios');
const db = global.db || require('./firebase').db;
global.db = db;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (event) => {
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
    console.error('Missing DocuSeal authentication token');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  try {
    console.log('Raw event body:', event.body);

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
      console.log('Parsed body:', parsedBody);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError.message, 'Body:', event.body);
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid JSON input', rawBody: event.body }),
      };
    }

    const { template, parties, date, scope_of_work, payment_terms, start_date, end_date, termination_clause } = parsedBody;

    if (!template || !Array.isArray(parties) || parties.length < 2 || !date || !scope_of_work || !payment_terms || !start_date || !end_date || !termination_clause) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing required fields or invalid parties data' }),
      };
    }

    const placeholders = {
      parties: JSON.stringify(parties),
      date,
      scope_of_work,
      payment_terms,
      start_date,
      end_date,
      termination_clause,
    };

    const htmlTemplate = generateHTMLTemplate(template, placeholders);

    const templateResponse = await axios.post(
      'https://api.docuseal.com/templates/html',
      {
        html: htmlTemplate,
        name: 'Service Agreement Template',
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

    console.log('DocuSeal template response:', templateResponse.data);

    if (!templateResponse.data?.id) {
      throw new Error('Template creation failed: Missing template ID');
    }

    const templateId = templateResponse.data.id;

    const sessionToken = `${templateId}-${Date.now()}`;
    await db.ref(`sessions/${sessionToken}`).set({
      templateId,
      used: false,
      createdAt: Date.now(),
    });

    const contractLink = `${process.env.WEB_APP_URL}/contract/${sessionToken}`;
    const previewImageUrl = templateResponse.data.documents?.[0]?.preview_image_url;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Template and submission created successfully',
        sessionToken,
        contractLink,
        previewImageUrl,
      }),
    };
  } catch (error) {
    console.error('Error generating template or submission:', error?.response?.data || error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};

function generateHTMLTemplate(template, placeholders) {
  let htmlTemplate = template;
  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{{${key}}}`;
    htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), value);
  }
  return htmlTemplate;
}

module.exports = { handler };
