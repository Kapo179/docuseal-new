const OpenAI = require('openai');
const busboy = require('busboy');
const { generateCV } = require('./generateCV');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = 'asst_M3lC3fr10FG7E0qlo5e6Eglw';

exports.handler = async function(event, context) {
  try {
    console.log('Starting CV processing...');

    // Log the incoming request
    console.log('Request headers:', event.headers);
    console.log('Request method:', event.httpMethod);

    const { files, fields } = await parseMultipartForm(event);
    console.log('Files received:', Object.keys(files));
    console.log('Fields received:', fields);

    const cvContent = files.cv.content.toString('utf8');
    console.log('CV content length:', cvContent.length);
    const jobDetails = fields.jobDetails;

    // Create thread and start processing
    console.log('Creating OpenAI thread...');
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread.id);

    console.log('Adding message to thread...');
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Analyze this CV for ${jobDetails} position and return a JSON object with the following structure:
{
  "pdfUrl": "URL of the generated PDF",
  "previewUrl": "URL of the preview image"
}

CV Content:
${cvContent}`
    });

    console.log('Starting assistant run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });
    console.log('Run created:', run.id);

    return {
      statusCode: 202,
      body: JSON.stringify({
        threadId: thread.id,
        runId: run.id,
        status: 'processing'
      })
    };
  } catch (error) {
    console.error('Error in tailorCV:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process CV',
        details: error.message,
        stack: error.stack
      })
    };
  }
};

// Helper function to parse form data
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};
    const bb = busboy({ headers: event.headers });

    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        files[name] = {
          filename: info.filename,
          content: Buffer.concat(chunks),
          contentType: info.mimeType
        };
      });
    });

    bb.on('field', (name, val) => fields[name] = val);
    bb.on('close', () => resolve({ files, fields }));
    bb.on('error', reject);

    bb.write(Buffer.from(event.body, 'base64'));
    bb.end();
  });
}