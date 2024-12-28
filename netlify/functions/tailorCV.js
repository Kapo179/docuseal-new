const OpenAI = require('openai');
const formidable = require('formidable');
const fs = require('fs');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert CV tailoring assistant. Analyze the provided CV and job details to suggest specific improvements that will better align the CV with the job requirements. Focus on:
1. Relevant skills and experiences to highlight
2. Keywords to include
3. Specific achievements to emphasize
4. Structure and formatting suggestions
Be concise and specific in your recommendations.`;

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the multipart form data
    const form = formidable({ multiples: true });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const cvFile = files.cv;
    const jobDetails = fields.jobDetails;

    // Send to OpenAI using the new API format
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CV Content: ${fs.readFileSync(cvFile.path, 'utf8')}\n\nJob Details: ${jobDetails}` }
      ],
      max_tokens: 1000
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        tailoredCV: response.choices[0].message.content
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process CV'
      })
    };
  }
}; 