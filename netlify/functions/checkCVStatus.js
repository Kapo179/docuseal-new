const OpenAI = require('openai');
const { generateCVFromAssistant } = require('./generateCVFromAssistant');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async function(event, context) {
  try {
    console.log('Checking CV status...');
    
    const { threadId, runId } = JSON.parse(event.body);
    console.log('Thread ID:', threadId);
    console.log('Run ID:', runId);

    const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    console.log('Run status:', runStatus.status);
    console.log('Full run status:', JSON.stringify(runStatus, null, 2));
    
    if (runStatus.status === 'completed') {
      console.log('Run completed, getting messages...');
      const messages = await openai.beta.threads.messages.list(threadId);
      console.log('Messages:', messages.data.map(m => ({
        role: m.role,
        content: m.content
      })));

      // Get the assistant's response
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      if (!assistantMessage) {
        throw new Error('No assistant response found');
      }

      // Parse the function call result
      try {
        const content = assistantMessage.content[0];
        console.log('Assistant content:', content);

        if (content.type === 'text') {
          // Extract JSON from markdown code block if present
          const jsonMatch = content.text.value.match(/```json\n([\s\S]*?)\n```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : content.text.value;
          
          // Parse the JSON
          const result = JSON.parse(jsonStr);
          return {
            statusCode: 200,
            body: JSON.stringify({
              status: 'completed',
              result: {
                pdfUrl: result.pdfUrl,
                previewUrl: result.previewUrl
              }
            })
          };
        }

        throw new Error('Unexpected content type: ' + content.type);
      } catch (error) {
        console.error('Error parsing assistant response:', error);
        console.error('Raw content:', assistantMessage.content);
        throw new Error('Failed to parse assistant response');
      }
    }

    if (runStatus.status === 'requires_action') {
      console.log('Function calls required...');
      const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
      console.log('Tool calls:', JSON.stringify(toolCalls, null, 2));

      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === 'generateCV') {
          try {
            const cvData = JSON.parse(toolCall.function.arguments);
            console.log('CV Data:', JSON.stringify(cvData, null, 2));

            const result = await generateCVFromAssistant(cvData);
            console.log('GenerateCV result:', JSON.stringify(result, null, 2));

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
            console.error('Error stack:', error.stack);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({
                success: false,
                error: error.message,
                stack: error.stack
              })
            });
          }
        }
      }

      console.log('Submitting tool outputs:', JSON.stringify(toolOutputs, null, 2));
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: runStatus.status
      })
    };

  } catch (error) {
    console.error('Error in checkCVStatus:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        error: error.message,
        stack: error.stack
      })
    };
  }
}; 