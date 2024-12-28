const OpenAI = require('openai');
const { generateCV } = require('./generateCV');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async function(event, context) {
  const { threadId, runId } = JSON.parse(event.body);

  try {
    const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    
    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'completed',
          result: messages.data[0]
        })
      };
    }

    if (runStatus.status === 'requires_action') {
      const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === 'generateCV') {
          try {
            console.log('Processing function call:', toolCall.function.name);
            const cvData = JSON.parse(toolCall.function.arguments);
            console.log('CV Data:', cvData);

            const result = await generateCV(cvData);
            console.log('GenerateCV result:', result);

            if (!result || !result.pdfUrl || !result.previewUrl) {
              throw new Error('Invalid result from generateCV');
            }

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

      // Submit the outputs back to OpenAI
      await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: toolOutputs
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'processing',
          message: 'Function calls processed'
        })
      };
    }

    // For any other status, just return it
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: runStatus.status
      })
    };

  } catch (error) {
    console.error('Error checking CV status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        error: error.message
      })
    };
  }
}; 