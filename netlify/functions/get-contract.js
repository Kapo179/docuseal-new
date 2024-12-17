/**
 * netlify/functions/get-contract.js
 *
 * This Netlify serverless function retrieves contract data for a given templateId.
 * Replace the "fetchContractData" logic with a real DB or API call.
 */

exports.handler = async (event) => {
    try {
      // 1. Parse the templateId from the query string
      const { templateId } = event.queryStringParameters || {};
      if (!templateId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing templateId in query string' })
        };
      }
  
      // 2. Retrieve contract data from your DB or external API
      // Example: Use a placeholder function "fetchContractData" to simulate DB/API:
      const contractData = await fetchContractData(templateId);
  
      // If no contract data is found, return 404
      if (!contractData) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `No contract found for templateId ${templateId}` })
        };
      }
  
      // 3. Return the contract data as JSON
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formData: contractData.formData })
      };
  
    } catch (error) {
      console.error('Error retrieving contract data:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  };
  
  /**
   * Replace the logic here with a real DB or external API call.
   * For example, you'd query a database like MySQL, MongoDB, or call an internal REST/GraphQL API.
   * 
   * Below is just a placeholder function returning hard-coded data or a DB result.
   */
  async function fetchContractData(templateId) {
    // Example placeholder: You’d do something like:
    // const result = await db.query('SELECT * FROM contracts WHERE id = ?', [templateId]);
    // return result[0] || null;
    
    // For demonstration, let's hard-code some data:
    if (templateId === '464289') {
      return {
        formData: {
          party1: "Company ABC",
          party2: "Freelancer XYZ",
          date: "17/06/2024",
          scope_of_work: "Develop a website including design and deployment.",
          payment_terms: "50% upfront, 50% upon completion.",
          start_date: "20/06/2024",
          end_date: "20/09/2024",
          termination_clause: "Either party may terminate with a 7-day notice."
        }
      };
    }
  
    // Return null if no matching record is found
    return null;
  }
  