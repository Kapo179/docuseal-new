import axios from 'axios';
import { db } from './firebase'; // Firebase initialization file

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
    // Ensure the event body is valid JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError.message);
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid JSON input' }),
      };
    }

    const { template, parties, date, scope_of_work, payment_terms, start_date, end_date, termination_clause } = parsedBody;

    // Validation for required fields
    if (!template || !Array.isArray(parties) || parties.length < 2 || !date || !scope_of_work || !payment_terms || !start_date || !end_date || !termination_clause) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing required fields or invalid parties data' }),
      };
    }

    // Step 1: Generate the contract HTML
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

    // Step 2: Create DocuSeal template
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

    // Extract the templateId from the response
    const templateId = templateResponse.data.id;

    // Step 3: Create DocuSeal submission
    const submitters = parties.map((party, index) => ({
      name: party.name,
      email: party.email,
      role: `Party${index + 1}`,
      preferences: { send_email: true },
    }));

    const submissionResponse = await axios.post(
      `https://api.docuseal.com/templates/${templateId}/submissions`,
      {
        submitters: submitters,
      },
      {
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    // Step 4: Generate unique session token
    const sessionToken = `${templateId}-${Date.now()}`;

    // Store session data in Firebase Realtime Database
    await db.ref(`sessions/${sessionToken}`).set({
      templateId: templateId, // Use templateId consistently
      used: false,
      createdAt: Date.now(),
    });

    // Step 5: Construct response with contract link and preview image
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