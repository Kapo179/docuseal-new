// netlify/functions/get-contract.js

exports.handler = async (event) => {
    try {
      // 1. Parse the templateId from query string parameters
      //    e.g. /api/contracts/464289 becomes /.netlify/functions/get-contract?templateId=464289
      const { templateId } = event.queryStringParameters || {};
  
      if (!templateId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing templateId' })
        };
      }
  
      // 2. Retrieve contract data (DB lookup or mock object)
      //    For example, let's just fake some formData here:
      const contractData = {
        formData: {
          party1: "Company ABC",
          party2: "Freelancer XYZ",
          date: "17/06/2024",
          scope_of_work: "Develop a website including design and deployment.",
          payment_terms: "50% upfront, 50% upon completion.",
          start_date: "20/06/2024",
          end_date: "20/09/2024",
          termination_clause: "Either party may terminate with 7 days notice."
        }
      };
  
      // 3. Return contractData as JSON
      return {
        statusCode: 200,
        body: JSON.stringify(contractData),
        headers: {
          'Content-Type': 'application/json'
        }
      };
  
    } catch (error) {
      console.error('Error retrieving contract data:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  };
  