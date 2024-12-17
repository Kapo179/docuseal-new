import axios from 'axios';

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
    const { formData, seller, buyer } = JSON.parse(event.body);

    // Validate required fields
    if (!formData?.make?.trim() || !formData?.model?.trim()) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Vehicle make and model are required' })
      };
    }

    if (!seller?.name?.trim() || !seller?.email?.trim() || !buyer?.name?.trim() || !buyer?.email?.trim()) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Seller and buyer information is required' })
      };
    }

    // Generate HTML template
    const html = generateHTMLTemplate(formData, seller, buyer);

    console.log('Creating template with DocuSeal API...');
    const templateResponse = await axios.post(
      'https://api.docuseal.com/templates/html',
      {
        html,
        name: `Vehicle Sales Agreement - ${formData.make} ${formData.model}`,
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

    console.log('Creating submission...');
    const submissionResponse = await axios.post(
      `https://api.docuseal.com/templates/${templateResponse.data.id}/submissions`,
      {
        submitters: [
          {
            name: seller.name,
            email: seller.email,
            role: 'Seller'
          },
          {
            name: buyer.name,
            email: buyer.email,
            role: 'Buyer'
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

    if (!submissionResponse.data?.id) {
      console.warn('Submission ID is missing but proceeding with signing URL.');
    }

    const signingUrl = submissionResponse.data?.signing_url || '';
    if (!signingUrl) {
      throw new Error('Submission creation failed: Missing signing URL');
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        templateId: templateResponse.data.id,
        submissionId: submissionResponse.data.id,
        signingUrl,
        status: 'success'
      })
    };
  } catch (error) {
    console.error('DocuSeal Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    return {
      statusCode: error.response?.status || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to create template',
        message: error.response?.data?.message || error.message
      })
    };
  }
};

// Helper Function for HTML Template
function generateHTMLTemplate(formData, seller, buyer) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Vehicle Sales Agreement</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
        h1 { text-align: center; color: #2563eb; margin-bottom: 30px; }
        h2 { color: #1e40af; margin-top: 30px; margin-bottom: 15px; }
        p { margin: 10px 0; }
        .signature-section { margin-top: 40px; }
      </style>
    </head>
    <body>
      <h1>VEHICLE SALES AGREEMENT</h1>
      <p>Date: ${new Date().toLocaleDateString()}</p>
      
      <h2>Vehicle Information</h2>
      <p>
        Make: ${formData.make}<br>
        Model: ${formData.model}<br>
        Year: ${formData.year}<br>
        ${formData.vin ? `VIN: ${formData.vin}<br>` : ''}
        Mileage: ${formData.mileage.toLocaleString()} miles<br>
        Condition: ${formData.condition}<br>
        Price: ${formData.currency} ${formData.price.toLocaleString()}
      </p>
      
      <h2>Agreement Details</h2>
      <p>
        The undersigned purchaser acknowledges receipt of the above vehicle in exchange for the cash sum 
        of ${formData.currency} ${formData.price.toLocaleString()}, this being the price agreed by the purchaser 
        with the vendor for the above-named vehicle, receipt of which the vendor hereby acknowledges.
      </p>
      <p>
        It is understood by the purchaser that the vehicle is sold as seen, tried, and approved without guarantee, 
        with the following condition:
      </p>
      <p>
        The purchaser holds the right to return the vehicle and is entitled to a full refund of the vehicle's 
        purchase price if, within 14 days of the purchase date, the vehicle is found, through first-hand verifiable 
        recorded inspection or professional assessment, to have significant defects or undisclosed issues 
        affecting its condition or safety that were not made known at the time of sale.
      </p>
      <p>
        Upon exercising this right, the purchaser agrees to return the vehicle to the vendor in the condition it 
        was received. The vendor agrees to refund the full purchase amount to the purchaser within 14 days 
        of the vehicle's return.
      </p>

      <h2>Seller Information</h2>
      <p>
        Name: ${seller.name}<br>
        Email: ${seller.email}<br>
        Signature: <signature-field name="Seller Signature" role="Seller" required="true"></signature-field>
      </p>

      <h2>Buyer Information</h2>
      <p>
        Name: ${buyer.name}<br>
        Email: ${buyer.email}<br>
        Signature: <signature-field name="Buyer Signature" role="Buyer" required="true"></signature-field>
      </p>
      
      <p>This document is legally binding. Both parties should retain a signed copy for their records.</p>
    </body>
    </html>
  `;
}

