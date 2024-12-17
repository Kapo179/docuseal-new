const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {
    const { docusealId } = event.queryStringParameters;
    if (!docusealId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing docusealId' }) };
    }

    // Fetch contract data from Firestore
    const doc = await db.collection('contracts').doc(docusealId).get();

    if (!doc.exists) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No such document!' }) };
    }

    const data = doc.data();
    console.log('Fetched contract data:', data);

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error retrieving contract data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};