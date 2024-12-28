const OpenAI = require('openai');
const busboy = require('busboy');
const { generateCV } = require('./generateCV');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = 'asst_M3lC3fr10FG7E0qlo5e6Eglw';

exports.handler = async function(event, context) {
  try {
    const { files, fields } = await parseMultipartForm(event);
    const cvContent = files.cv.content.toString('utf8');
    const jobDetails = fields.jobDetails;

    // Create thread and start processing
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Analyze this CV for ${jobDetails} position...`
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // Return immediately with thread info
    return {
      statusCode: 202, // Accepted
      body: JSON.stringify({
        threadId: thread.id,
        runId: run.id,
        status: 'processing'
      })
    };
  } catch (error) {
    console.error('Error:', error);
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