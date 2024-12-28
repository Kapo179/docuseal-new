const OpenAI = require('openai');
const busboy = require('busboy');
const { generateCV } = require('./generateCV');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = 'asst_M3lC3fr10FG7E0qlo5e6Eglw';

exports.handler = async function(event, context) {
  try {
    // Parse the uploaded CV and job details
    const { files, fields } = await parseMultipartForm(event);
    
    if (!files?.cv || !fields?.jobDetails) {
      throw new Error('Missing required fields: CV file or job details');
    }

    const cvContent = files.cv.content.toString('utf8');
    const jobDetails = fields.jobDetails;

    // Create thread and add message
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Please analyze this CV for the ${jobDetails} position and use the generateCV function to create an optimized version.
      
Focus on:
- Highlighting relevant skills and experience for the position
- Optimizing keywords for ATS systems
- Emphasizing achievements that match the role

CV Content:
${cvContent}`
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for completion or function call
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'requires_action') {
        // Handle function call and submit result
        const toolOutputs = await handleFunctionCall(runStatus, thread.id, run.id);
        return {
          statusCode: 200,
          body: JSON.stringify(toolOutputs)
        };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

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

async function handleFunctionCall(runStatus, threadId, runId) {
  const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
  const toolOutputs = [];

  for (const toolCall of toolCalls) {
    if (toolCall.function.name === 'generateCV') {
      const result = await generateCV(JSON.parse(toolCall.function.arguments));
      toolOutputs.push({
        tool_call_id: toolCall.id,
        output: JSON.stringify(result)
      });
    }
  }

  await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
    tool_outputs: toolOutputs
  });

  return toolOutputs[0].output;
}

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