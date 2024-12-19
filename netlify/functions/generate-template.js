import axios from 'axios';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

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
      !contract_details||
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

    // Step 1: Generate the contract HTML
    const placeholders = {
      parties: JSON.stringify(parties),
      date,
      contract_details,
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

    // Step 3: Create DocuSeal submission
    const submitters = parties.map((party, index) => ({
      name: party.name,
      email: party.email,
      role: `Party${index + 1}`,
      preferences: { send_email: true },
    }));

    const submissionResponse = await axios.post(
      `https://api.docuseal.com/templates/${templateResponse.data.id}/submissions`,
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

    console.log('Submission created:', submissionResponse.data);

    // Step 4: Construct response with contract link and preview image
    const contractLink = `${process.env.WEB_APP_URL}/contract/${templateResponse.data.id}`;
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

// Utility function to replace placeholders with actual values
function generateHTMLTemplate(template, placeholders) {
  let htmlTemplate = template;
  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{{${key}}}`;
    htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), value);
  }
  return htmlTemplate;
}