const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Extract templateId from query params
  const { templateId } = event.queryStringParameters;

  // Access environment variables securely
  const apiUrl = process.env.DOCUSEAL_API_URL;
  const authToken = process.env.DOCUSEAL_AUTH_TOKEN;

  // Verify that environment variables are set
  if (!apiUrl || !authToken) {
    console.error("Missing environment variables: DOCUSEAL_API_URL or DOCUSEAL_AUTH_TOKEN");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error: Missing configuration." }),
    };
  }

  // Log the request initiation (optional for debugging, but omit sensitive info)
  console.log(`Fetching template with ID: ${templateId}`);

  try {
    // Call the DocuSeal API
    const response = await fetch(`${apiUrl}/templates/${templateId}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': authToken,
        'Content-Type': 'application/json',
      },
    });

    // Check for API errors
    if (!response.ok) {
      console.error(`Error fetching template: ${response.statusText} (Status: ${response.status})`);
      throw new Error(`Failed to fetch template. Status: ${response.status}`);
    }

    // Parse response JSON
    const data = await response.json();

    // Return fetched data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS support
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    // Log and return error details
    console.error("Error in get-docuseal-contract function:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Failed to fetch template." }),
    };
  }
};
