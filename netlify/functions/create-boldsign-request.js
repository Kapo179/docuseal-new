import fetch from 'node-fetch';

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

  if (!process.env.BOLDSIGN_API_KEY) {
    console.error('Missing BoldSign API key');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    const { formData, sellerEmail, sellerName, buyerEmail, buyerName, redirectUrl } = JSON.parse(event.body);

    const requestBody = {
      title: 'Vehicle Sales Agreement',
      message: 'Please review and sign the vehicle sales agreement',
      signers: [
        {
          name: sellerName,
          emailAddress: sellerEmail,
          signerType: 'Signer',
          signerOrder: 1,
          formFields: [
            {
              id: 'seller_signature',
              fieldType: 'Signature',
              pageNumber: 1,
              isRequired: true,
              bounds: {
                x: 50,
                y: 700,
                width: 200,
                height: 50
              }
            }
          ]
        },
        {
          name: buyerName,
          emailAddress: buyerEmail,
          signerType: 'Signer',
          signerOrder: 2,
          formFields: [
            {
              id: 'buyer_signature',
              fieldType: 'Signature',
              pageNumber: 1,
              isRequired: true,
              bounds: {
                x: 300,
                y: 700,
                width: 200,
                height: 50
              }
            }
          ]
        }
      ],
      formFields: [
        {
          id: 'vehicle_make',
          fieldType: 'Text',
          value: formData.make,
          pageNumber: 1,
          isRequired: true,
          bounds: {
            x: 50,
            y: 100,
            width: 200,
            height: 30
          }
        },
        {
          id: 'vehicle_model',
          fieldType: 'Text',
          value: formData.model,
          pageNumber: 1,
          isRequired: true,
          bounds: {
            x: 50,
            y: 150,
            width: 200,
            height: 30
          }
        },
        {
          id: 'vehicle_year',
          fieldType: 'Text',
          value: formData.year.toString(),
          pageNumber: 1,
          isRequired: true,
          bounds: {
            x: 50,
            y: 200,
            width: 100,
            height: 30
          }
        },
        {
          id: 'vehicle_mileage',
          fieldType: 'Text',
          value: formData.mileage.toString(),
          pageNumber: 1,
          isRequired: true,
          bounds: {
            x: 50,
            y: 250,
            width: 150,
            height: 30
          }
        },
        {
          id: 'vehicle_condition',
          fieldType: 'Text',
          value: formData.condition,
          pageNumber: 1,
          isRequired: true,
          bounds: {
            x: 50,
            y: 300,
            width: 150,
            height: 30
          }
        },
        {
          id: 'vehicle_price',
          fieldType: 'Text',
          value: `${formData.currency} ${formData.price.toLocaleString()}`,
          pageNumber: 1,
          isRequired: true,
          bounds: {
            x: 50,
            y: 350,
            width: 200,
            height: 30
          }
        }
      ],
      enableSigningOrder: true,
      redirectUrl: redirectUrl,
      showToolbar: true,
      showNavigationButtons: true,
      showPreviewButton: true,
      locale: 'EN',
      expiryDays: 30,
      reminderSettings: {
        enableAutoReminder: true,
        reminderDays: 3,
        reminderCount: 3
      },
      identityVerificationSettings: {
        type: 'EveryAccess',
        maximumRetryCount: 3,
        requireLiveCapture: true,
        requireMatchingSelfie: true,
        nameMatcher: 'Strict'
      }
    };

    // Add VIN if provided
    if (formData.vin) {
      requestBody.formFields.push({
        id: 'vehicle_vin',
        fieldType: 'Text',
        value: formData.vin,
        pageNumber: 1,
        isRequired: true,
        bounds: {
          x: 50,
          y: 400,
          width: 250,
          height: 30
        }
      });
    }

    // Add inspection notes if provided
    if (formData.inspectionNotes) {
      requestBody.formFields.push({
        id: 'inspection_notes',
        fieldType: 'Text',
        value: formData.inspectionNotes,
        pageNumber: 1,
        isRequired: false,
        bounds: {
          x: 50,
          y: 450,
          width: 500,
          height: 100
        }
      });
    }

    const response = await fetch('https://api.boldsign.com/v1/document/createEmbeddedRequestUrl', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.BOLDSIGN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `BoldSign API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('BoldSign embedded request created:', data.documentId);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        documentId: data.documentId,
        signingUrl: data.sendUrl,
        status: 'pending'
      })
    };
  } catch (error) {
    console.error('BoldSign Error:', error);
    return {
      statusCode: error.response?.status || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to create signing request',
        message: error.message
      })
    };
  }
};