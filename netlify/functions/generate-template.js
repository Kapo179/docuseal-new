import axios from 'axios';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

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

  const authToken = process.env.DOCUSEAL_AUTH_TOKEN;
  if (!authToken) {
    console.error('Missing DocuSeal authentication token');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    const {
      template,
      party1,
      party2,
      date,
      scope_of_work,
      payment_terms,
      start_date,
      end_date,
      termination_clause
    } = JSON.parse(event.body);

    if (
      !template ||
      !party1 ||
      !party2 ||
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
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const placeholders = {
      party1,
      party2,
      date,
      scope_of_work,
      payment_terms,
      start_date,
      end_date,
      termination_clause
    };

    const htmlTemplate = generateHTMLTemplate(template, placeholders);

    const pdfBuffer = await generatePDF(htmlTemplate);

    const pdfBase64 = pdfBuffer.toString('base64');

    const templateResponse = await axios.post(
      'https://api.docuseal.com/templates/html',
      {
        html: htmlTemplate,
        name: 'Service Agreement Template',
        size: 'Letter'
      },
      {
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Template created:', templateResponse.data);

    if (!templateResponse.data?.id) {
      throw new Error('Template creation failed: Missing template ID');
    }

    const submissionResponse = await axios.post(
      `https://api.docuseal.com/templates/${templateResponse.data.id}/submissions`,
      {
        submitters: [
          {
            name: 'Signer Name',
            email: 'signer.email@example.com',
            role: 'Signer'
          }
        ]
      },
      {
        headers: {
          'X-Auth-Token': authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Submission created:', submissionResponse.data);

    const contractLink = `${process.env.WEB_APP_URL}/contract/${templateResponse.data.id}`;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Template generated successfully',
        templateId: templateResponse.data.id,
        pdfBase64: pdfBase64,
        contractLink: contractLink
      })
    };
  } catch (error) {
    console.error('Error generating template:', error?.response?.data || error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' })
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

async function generatePDF(htmlContent) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}