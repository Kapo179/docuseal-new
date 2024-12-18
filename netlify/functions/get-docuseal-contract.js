import axios from 'axios';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_URL;
  const DOCUSEAL_AUTH_TOKEN = process.env.DOCUSEAL_AUTH_TOKEN;

  if (!DOCUSEAL_API_URL || !DOCUSEAL_AUTH_TOKEN) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error: missing DocuSeal API details' }),
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
    };
  }

  const { templateId, sessionToken } = event.queryStringParameters || {};
  console.log('Extracted templateId:', templateId);
  console.log('Extracted sessionToken:', sessionToken);

  if (!templateId || !sessionToken) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing required templateId or sessionToken parameter' }),
    };
  }

  try {
    // Validate session token in Firebase
    const db = admin.database();
    const sessionRef = db.ref(`sessions/${sessionToken}`);
    const sessionSnapshot = await sessionRef.once('value');

    if (!sessionSnapshot.exists()) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid or expired session token' }),
      };
    }

    const sessionData = sessionSnapshot.val();

    if (sessionData.used || sessionData.templateId !== templateId) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Session token is invalid or has already been used' }),
      };
    }

    // Mark the session token as used
    await sessionRef.update({ used: true });

    // Fetch the contract data from DocuSeal
    const response = await axios.get(`${DOCUSEAL_API_URL}/templates/${templateId}`, {
      headers: {
        'X-Auth-Token': DOCUSEAL_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Error fetching DocuSeal template or validating session:', error.response?.data || error.message);

    return {
      statusCode: error.response?.status || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to fetch contract data or validate session' }),
    };
  }
};
