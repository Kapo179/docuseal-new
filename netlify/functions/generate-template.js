import axios from 'axios';
import puppeteer from 'puppeteer'; // Make sure puppeteer is installed (npm install puppeteer)

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
    // Pull each placeholder from the request body
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

    // Validate required fields
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

    // Create a placeholders object for the HTML fill-in
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

    // Generate the final HTML by replacing placeholders in the template
    const htmlTemplate = generateHTMLTemplate(template, placeholders);

    // Convert HTML to PDF using Puppeteer
    const pdfBuffer = await generatePDF(htmlTemplate);

    // Encode PDF to Base64
    const pdfBase64 = pdfBuffer.toString('base64');

    // Send the generated HTML to DocuSeal to create a template record
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

    // Optional: Create a submission if required
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

    // Generate the link to the webpage
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
    console.error('Error generating template:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Helper Function for HTML Template (fills placeholders like {{party1}})
function generateHTMLTemplate(template, placeholders) {
  let htmlTemplate = template;
  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{{${key}}}`;
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