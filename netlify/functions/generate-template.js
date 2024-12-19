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
      contract_details,
      terms,
      start_date,
      end_date,
      termination_clause,
    } = JSON.parse(event.body);

    // Validate input
    if (
      !template ||
      !Array.isArray(parties) ||
      parties.length < 2 ||
      !date ||
      !contract_details ||
      !terms ||
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

    // Create placeholders
    const placeholders = {
      date,
      contract_details,
      terms,
      start_date,
      end_date,
      termination_clause,
    };

    parties.forEach((party, index) => {
      placeholders[`parties[${index}].name`] = party.name || 'Unknown Name';
      placeholders[`parties[${index}].email`] = party.email || 'Unknown Email';
    });

    console.log('Generated placeholders:', placeholders);

    // Generate HTML template
    const htmlTemplate = generateHTMLTemplate(template, placeholders);
    console.log('Generated HTML:', htmlTemplate);

    // Create DocuSeal template
    const templateResponse = await axios.post(
      'https://api.docuseal.com/templates/html',
      {
        html: htmlTemplate,
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

    console.log('Template created:', templateResponse.data);

    if (!templateResponse.data?.id) {
      throw new Error('Template creation failed: Missing template ID');
    }

    // Create DocuSeal submission
    const submitters = parties.map((party, index) => ({
      name: party.name,
      email: party.email,
      role: `Party${index + 1}`,
      preferences: { send_email: true },
    }));

    const submissionResponse = await axios.post(
      `https://api.docuseal.com/templates/${templateResponse.data.id}/submissions`,
      {
        submitters,
      },
      {
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    console.log('Submission created:', submissionResponse.data);

    // Construct response
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
    console.error('Error generating template or submission:', error?.response?.data || error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};

// Utility function to replace placeholders with actual values
function generateHTMLTemplate(template, placeholders) {
  let htmlTemplate = template;
  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    htmlTemplate = htmlTemplate.replace(placeholder, value);
  }
  return htmlTemplate;
}
