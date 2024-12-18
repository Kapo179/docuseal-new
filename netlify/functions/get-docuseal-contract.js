const axios = require('axios');

exports.handler = async (event) => {
  const { templateId } = event.queryStringParameters;

  if (!templateId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Template ID is required" }),
    };
  }

  try {
    const authToken = process.env.DOCUSEAL_AUTH_TOKEN;

    if (!authToken) {
      throw new Error("Missing DocuSeal Auth Token");
    }

    const response = await axios.get(
      `https://api.docuseal.com/templates/${templateId}`,
      {
        headers: { 'X-Auth-Token': authToken },
      }
    );

    const documents = response.data.documents;

    if (documents && documents.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ pdfUrl: documents[0].url }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Document not found" }),
    };
  } catch (error) {
    console.error("Error fetching document:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
