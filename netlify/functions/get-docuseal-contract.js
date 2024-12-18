const axios = require("axios");

exports.handler = async (event) => {
  const { templateId } = event.queryStringParameters;

  if (!templateId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing templateId" }) };
  }

  try {
    // Fetch contract data from DocuSeal
    const response = await axios.get(
      `https://api.docuseal.com/templates/${templateId}`,
      { headers: { "X-Auth-Token": process.env.DOCUSEAL_AUTH_TOKEN } }
    );

    const document = response.data.documents?.[0];
    const signedUrl = response.data.submissions?.[0]?.embed_src;

    if (document) {
      const cookieValue = JSON.stringify({
        pdfUrl: document.url,
        signedUrl: signedUrl || null,
      });

      // Set secure cookie with DocuSeal data
      return {
        statusCode: 200,
        headers: {
          "Set-Cookie": `contractData=${encodeURIComponent(
            cookieValue
          )}; HttpOnly; Secure; Path=/; Max-Age=600; SameSite=Lax`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Contract data set in cookie successfully.",
        }),
      };
    } else {
      return { statusCode: 404, body: JSON.stringify({ error: "Document not found" }) };
    }
  } catch (err) {
    console.error("Error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
