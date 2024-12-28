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

    // Create thread
    const thread = await openai.beta.threads.create();

    // Add message with CV content and job details
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Analyze this CV and create an optimized version for ${jobDetails} position.
      Extract the information into a structured format that matches the generateCV function schema.

CV Content:
${cvContent}`
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for completion or function calls
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'requires_action') {
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'generateCV') {
            try {
              // Parse the structured data from the Assistant
              const cvData = JSON.parse(toolCall.function.arguments);
              console.log('Structured CV data:', cvData);

              // Call our actual generateCV function
              const result = await generateCV(cvData);
              console.log('GenerateCV result:', result);

              // Send the result back to the Assistant
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  success: true,
                  pdfUrl: result.pdfUrl,
                  previewUrl: result.previewUrl
                })
              });
            } catch (error) {
              console.error('Error in generateCV:', error);
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  success: false,
                  error: error.message
                })
              });
            }
          }
        }

        // Submit results back to the Assistant
        await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
          tool_outputs: toolOutputs
        });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the final result from the last message
    const messages = await openai.beta.threads.messages.list(thread.id);
    const result = JSON.parse(messages.data[0].content[0].text);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        pdfUrl: result.pdfUrl,
        previewUrl: result.previewUrl
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