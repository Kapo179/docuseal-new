import axios from 'axios';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

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
    console.error('Missing DocuSeal authentication token');
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
      scope_of_work,
      payment_terms,
      start_date,
      end_date,
      termination_clause,
    } = JSON.parse(event.body);

    // Validation for required fields
    if (
      !template ||
      !Array.isArray(parties) ||
      parties.length < 2 ||
      !date ||
      !scope_of_work ||
      !payment_terms ||
      !start_date ||
      !end_date ||
      !termination_clause
    ) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing required fields or invalid parties data' }),
      };
    }

    // Check if template includes required fields
    if (!template.includes('<signature-field')) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Template must contain at least one <signature-field>.' }),
      };
    }

    // Generate the contract HTML
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

    // Create DocuSeal template
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

    if (!templateResponse.data?.id) {
      throw new Error('Template creation failed: Missing template ID');
    }

    // Store the template ID and session token in Redis
    const sessionToken = `${templateResponse.data.id}-${Date.now()}`;
    await redis.set(sessionToken, JSON.stringify({ templateId: templateResponse.data.id }), 'EX', 3600); // 1-hour expiry

    const contractLink = `${process.env.WEB_APP_URL}/contract/${templateResponse.data.id}?token=${sessionToken}`;
    const previewImageUrl = templateResponse.data.documents?.[0]?.preview_image_url;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Template and submission created successfully',
        templateId: templateResponse.data.id,
        contractLink: contractLink,
        previewImageUrl: previewImageUrl,
      }),
    };
  } catch (error) {
    console.error('Error generating template or submission:', error?.response?.data || error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
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
