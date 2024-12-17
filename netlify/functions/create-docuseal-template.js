import axios from 'axios';
import puppeteer from 'puppeteer';

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
    const { formData, template } = JSON.parse(event.body);

    // Validate required fields
    if (!formData || !template) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Generate HTML template using the provided template string and formData
    const htmlTemplate = generateHTMLTemplate(template, formData);

    // Convert HTML to PDF using Puppeteer
    const pdfBuffer = await generatePDF(htmlTemplate);

    // Encode PDF to Base64
    const pdfBase64 = pdfBuffer.toString('base64');

    // Send the generated template to DocuSeal API
    const templateResponse = await axios.post(
      'https://api.docuseal.com/templates',
      { html: htmlTemplate },
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

    // Generate the link to the webpage
    const contractLink = `${process.env.WEB_APP_URL}/contract/${templateResponse.data.id}`;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Template generated successfully',
        templateId: templateResponse.data.id,
        pdfBase64: pdfBase64, // Include the Base64 PDF in the response
        contractLink: contractLink // Include the link to the webpage
      })
    };
  } catch (error) {
    console.error('Error generating template:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Helper Function for HTML Template
function generateHTMLTemplate(template, formData) {
  let htmlTemplate = template;
  for (const key in formData) {
    const placeholder = `{{${key}}}`;
    const value = formData[key];
    htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), value);
  }
  return htmlTemplate;
}

// Helper Function to Generate PDF
async function generatePDF(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
}