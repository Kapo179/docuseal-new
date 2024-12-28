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
      // Handle function calls here
      const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
      // ... process function calls ...
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: runStatus.status
      })
    };
  } catch (error) {
    // ... error handling
  }
}; 