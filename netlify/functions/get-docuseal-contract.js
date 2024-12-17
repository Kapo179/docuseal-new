// netlify/functions/get-docuseal-contract.js
const axios = require('axios');

exports.handler = async (event) => {
  try {
    const { docusealId } = event.queryStringParameters;
    const DOCUSEAL_AUTH_TOKEN = process.env.DOCUSEAL_AUTH_TOKEN;
    if (!docusealId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing docusealId' }) };
    }

    const response = await axios.get(`https://api.docuseal.com/templates/${docusealId}`, {
      headers: {
        'X-Auth-Token': DOCUSEAL_AUTH_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Return the docuseal data to the React app
    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error retrieving docuseal data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
