const OpenAI = require('openai');
const busboy = require('busboy');
const fs = require('fs');
const os = require('os');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = 'asst_M3lC3fr10FG7E0qlo5e6Eglw';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('Starting CV processing...');

    // Parse multipart form data
    const { files, fields } = await parseMultipartForm(event);

    if (!files?.cv || !fields?.jobDetails) {
      throw new Error('Missing required fields: CV file or job details');
    }

    const cvFile = files.cv;
    const jobDetails = fields.jobDetails;

    console.log('Creating OpenAI thread...');
    const thread = await openai.beta.threads.create();

    console.log('Reading CV file...');
    const cvContent = fs.readFileSync(cvFile.path, 'utf8');

    console.log('Adding message to thread...');
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

    console.log('Running assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      instructions: "Analyze the CV and optimize it for the target position. Return the optimized CV data that matches the required schema.",
      tools: [{
        type: "function",
        function: {
          name: "generateCV",
          description: "Generate and assist in building comprehensive professional CV PDFs",
          parameters: {
            type: "object",
            required: [
              "name",
              "contactDetails",
              "professionalSummary",
              "professionalQualifications",
              "education",
              "workExperience",
              "skills",
              "hobbies",
              "references"
            ],
            properties: {
              name: {
                type: "string",
                description: "Full name of the CV owner"
              },
              contactDetails: {
                type: "object",
                required: ["email", "phone", "linkedin", "address"],
                properties: {
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  linkedin: { type: "string", format: "uri" },
                  address: { type: "string" }
                }
              },
              professionalSummary: { type: "string" },
              professionalQualifications: {
                type: "array",
                items: { type: "string" }
              },
              education: {
                type: "array",
                items: {
                  type: "object",
                  required: ["institution", "degree", "location", "year", "gpa", "details"],
                  properties: {
                    institution: { type: "string" },
                    degree: { type: "string" },
                    location: { type: "string" },
                    year: { type: "string" },
                    gpa: { type: "string" },
                    details: {
                      type: "array",
                      items: { type: "string" }
                    }
                  }
                }
              },
              workExperience: {
                type: "array",
                items: {
                  type: "object",
                  required: ["company", "position", "location", "subtitle", "duration", "responsibilities"],
                  properties: {
                    company: { type: "string" },
                    position: { type: "string" },
                    location: { type: "string" },
                    subtitle: { type: "string" },
                    duration: { type: "string" },
                    responsibilities: { type: "string" }
                  }
                }
              },
              skills: {
                type: "object",
                required: ["technical", "software", "languages", "certifications", "interests"],
                properties: {
                  technical: { type: "array", items: { type: "string" } },
                  software: { type: "array", items: { type: "string" } },
                  languages: { type: "array", items: { type: "string" } },
                  certifications: { type: "array", items: { type: "string" } },
                  interests: { type: "array", items: { type: "string" } }
                }
              },
              hobbies: {
                type: "array",
                items: { type: "string" }
              },
              references: { type: "string" }
            }
          }
        }
      }]
    });

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

      // Handle function calls
      if (runStatus.status === 'requires_action') {
        console.log('Function call required');
        const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
        
        const toolOutputs = [];
        
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'generateCV') {
            console.log('Executing generateCV function');
            const arguments = JSON.parse(toolCall.function.arguments);
            
            try {
              const result = await generateCV(arguments);
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(result)
              });
            } catch (error) {
              console.error('Error in generateCV:', error);
              throw error;
            }
          }
        }

        // Submit the outputs back to the assistant
        await openai.beta.threads.runs.submitToolOutputs(
          thread.id,
          run.id,
          { tool_outputs: toolOutputs }
        );
      }
    }

    console.log('Getting assistant response...');
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    if (!messages.data || messages.data.length === 0) {
      throw new Error('No response from assistant');
    }

    const assistantResponse = messages.data[0].content[0].text.value;
    console.log('Raw assistant response:', assistantResponse);

    try {
      // Clean the response
      const cleanedResponse = assistantResponse
        .trim()
        .replace(/```json\n?|\n?```/g, '')  // Remove JSON code blocks
        .replace(/^\uFEFF/, '')             // Remove BOM
        .replace(/^[^{]*{/, '{')            // Clean start
        .replace(/}[^}]*$/, '}');           // Clean end

      console.log('Cleaned response:', cleanedResponse);

      // Parse and validate the JSON structure
      const cvData = JSON.parse(cleanedResponse);
      
      // Validate required fields
      const requiredFields = [
        'name', 'contactDetails', 'professionalSummary', 
        'professionalQualifications', 'education', 'workExperience',
        'skills', 'hobbies', 'references'
      ];

      const missingFields = requiredFields.filter(field => !(field in cvData));
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log('Successfully parsed and validated JSON');

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
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to parse assistant response',
          details: parseError.message,
          rawResponse: assistantResponse
        })
      };
    }

  } catch (error) {
    console.error('Error in CV processing:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to process CV',
        details: error.message
      })
    };
  }
};

function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};

    const bb = busboy({ headers: event.headers });

    bb.on('file', (name, file, info) => {
      const filePath = path.join(os.tmpdir(), `${Date.now()}-${info.filename}`);
      files[name] = { path: filePath, ...info };
      file.pipe(fs.createWriteStream(filePath));
    });

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('close', () => {
      resolve({ files, fields });
    });

    bb.on('error', (error) => {
      reject(error);
    });

    bb.write(Buffer.from(event.body, 'base64'));
    bb.end();
  });
}