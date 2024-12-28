const OpenAI = require('openai');
const busboy = require('busboy');
const fs = require('fs');
const { generateCV } = require('./generateCV');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = 'asst_M3lC3fr10FG7E0qlo5e6Eglw';

exports.handler = async function(event, context) {
  try {
    // Parse the uploaded CV and job details
    const { files, fields } = await parseMultipartForm(event);
    const cvContent = fs.readFileSync(files.cv.path, 'utf8');
    const jobDetails = fields.jobDetails;

    // Create thread and add the CV content
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `
      You are an expert CV optimization system. Your task is to:
1. Analyze the provided CV and target job position
2. Restructure and enhance the CV content to better match the target role
3. Call the generateCV function with the optimized content
4. Return only the generated PDF URL and PNG preview image
5. Do not provide any text explanations or suggestions

Focus on:
- Highlighting relevant skills and experiences
- Optimizing keywords for ATS systems
- Emphasizing achievements that align with the target role
- Professional formatting and structure
- Maintaining all essential information while improving presentation
      
      Analyze this CV and utilise the generateCV function using

CV Content:
${cvContent}

Target Position: ${jobDetails}`
    });

    // Run the assistant with the generateCV function
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      tools: [{
        type: "function",
        function: {
          name: "generateCV",
          description: "Generate a CV PDF based on the provided data",
          parameters: {
            // Your existing schema here
          }
        }
      }]
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'requires_action') {
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'generateCV') {
            const cvData = JSON.parse(toolCall.function.arguments);
            const result = await generateCV(cvData);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(result)
            });
          }
        }

        await openai.beta.threads.runs.submitToolOutputs(
          thread.id,
          run.id,
          { tool_outputs: toolOutputs }
        );
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the final result
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

// Helper function to parse multipart form data
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
          path: info.filename,
          content: Buffer.concat(chunks)
        };
      });
    });

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('finish', () => resolve({ files, fields }));
    bb.on('error', reject);

    bb.write(Buffer.from(event.body, 'base64'));
    bb.end();
  });
}