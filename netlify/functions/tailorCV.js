const OpenAI = require('openai');
const formidable = require('formidable');
const fs = require('fs');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Assistant ID
const ASSISTANT_ID = 'asst_M3lC3fr10FG7E0qlo5e6Eglw';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('Starting CV processing...');

    // Parse the multipart form data
    const form = formidable({ multiples: true });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          reject(err);
        }
        resolve({ fields, files });
      });
    });

    if (!files?.cv || !fields?.jobDetails) {
      throw new Error('Missing required fields: CV file or job details');
    }

    const cvFile = files.cv;
    const jobDetails = fields.jobDetails;

    console.log('Creating OpenAI thread...');
    // Create a thread
    const thread = await openai.beta.threads.create();

    console.log('Reading CV file...');
    const cvContent = fs.readFileSync(cvFile.path, 'utf8');

    console.log('Adding message to thread...');
    // Add the CV content and job details to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Please analyze this CV and optimize it for the target position. Return a JSON object that matches the generateCV function schema.

      CV Content:
      ${cvContent}

      Target Position: ${jobDetails}

      Remember to return only a valid JSON object that matches the schema, with no additional text or explanations.`
    });

    console.log('Running assistant...');
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    console.log('Initial run status:', runStatus.status);

    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('Updated run status:', runStatus.status);
      
      if (runStatus.status === 'failed') {
        console.error('Run failed:', runStatus);
        throw new Error('Assistant run failed: ' + (runStatus.last_error?.message || 'Unknown error'));
      }
    }

    console.log('Getting assistant response...');
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    if (!messages.data || messages.data.length === 0) {
      throw new Error('No response from assistant');
    }

    const assistantResponse = messages.data[0].content[0].text;
    console.log('Assistant raw response type:', typeof assistantResponse);
    console.log('Assistant raw response:', assistantResponse);
    console.log('Response length:', assistantResponse.length);
    console.log('First 100 characters:', assistantResponse.substring(0, 100));
    console.log('Response character codes:', Array.from(assistantResponse.substring(0, 20)).map(c => c.charCodeAt(0)));

    try {
      // Try to clean any potential whitespace or hidden characters
      const cleanedResponse = assistantResponse
        .trim()
        .replace(/^\uFEFF/, '') // Remove BOM if present
        .replace(/^[^{]*/, '') // Remove anything before the first {
        .replace(/[^}]*$/, ''); // Remove anything after the last }

      console.log('Cleaned response:', cleanedResponse);

      // Parse the JSON response
      const cvData = JSON.parse(cleanedResponse);
      console.log('Successfully parsed assistant response');

      // Generate CV
      console.log('Generating CV...');
      const generatedCV = await generateCV(cvData);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          pdfUrl: generatedCV.pdfUrl,
          previewUrl: generatedCV.previewUrl
        })
      };
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', assistantResponse);
      throw new Error('Failed to parse assistant response as JSON');
    }

  } catch (error) {
    console.error('Error in CV processing:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process CV',
        details: error.message
      })
    };
  }
};

// Import and use the existing generateCV function
const { generateCV } = require('./generateCV'); 