import axios from 'axios';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid'; // For generating unique tokens

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const redis = new Redis(process.env.REDIS_URL); // Connect to Redis

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
    // Step 1: Parse and validate the request body
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

    // Step 2: Generate the HTML contract
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

    // Step 3: Create the DocuSeal template
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

    // Step 4: Create submission for the contract
    const submitters = parties.map((party, index) => ({
      name: party.name,
      email: party.email,
      role: `Party${index + 1}`,
      preferences: { send_email: true },
    }));

    const submissionResponse = await axios.post(
      `https://api.docuseal.com/templates/${templateResponse.data.id}/submissions`,
      { submitters },
      {
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    // Step 5: Generate a one-time session token
    const sessionToken = uuidv4(); // Generate a unique session token
    const contractId = templateResponse.data.id;

    // Store the session token in Redis with an expiry time (e.g., 10 minutes)
    await redis.set(sessionToken, JSON.stringify({ contractId, used: false }), 'EX', 600); // 10 mins expiry

    const secureContractLink = `${process.env.WEB_APP_URL}/contract?token=${sessionToken}`;

    // Step 6: Return the secure contract link
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Template and submission created successfully',
        secureLink: secureContractLink,
        previewImageUrl: templateResponse.data.documents?.[0]?.preview_image_url,
      }),
    };
  } catch (error) {
    console.error('Error generating template or submission:', error?.response?.data || error.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Utility function to replace placeholders with actual values
function generateHTMLTemplate(template, placeholders) {
  let htmlTemplate = template;
  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{{${key}}}`;
    htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), value);
  }
  return htmlTemplate;
}
