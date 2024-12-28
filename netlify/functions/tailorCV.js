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

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add the CV content and job details to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `CV Content: ${fs.readFileSync(cvFile.path, 'utf8')}\n\nTarget Position: ${jobDetails}`
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantResponse = messages.data[0].content[0].text;

    // Parse the JSON response and generate CV
    const cvData = JSON.parse(assistantResponse);
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

// Import and use the existing generateCV function
const { generateCV } = require('./generateCV'); 