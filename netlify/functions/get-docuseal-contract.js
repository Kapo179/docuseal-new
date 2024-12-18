const axios = require('axios');

exports.handler = async (event) => {
  console.log('Received request:', event);

  const { templateId } = event.queryStringParameters;

  if (!templateId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Template ID is required" }),
    };
  }

  try {
    const authToken = process.env.DOCUSEAL_AUTH_TOKEN;

    const response = await axios.get(
      `https://api.docuseal.com/templates/${templateId}`,
      {
        headers: { 'X-Auth-Token': authToken },
      }
    );

    console.log('DocuSeal response:', response.data);

    const document = response.data.documents[0];
    const submission = response.data.submissions?.[0]; // Fetch signing URL

    if (document && submission) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          pdfUrl: document.url,
          signedUrl: submission.embed_src, // Embed signing URL
        }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Document or signing link not found" }),
    };
  } catch (error) {
    console.error("Error fetching document:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};