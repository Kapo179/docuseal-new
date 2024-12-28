const OpenAI = require('openai');
const formidable = require('formidable').default;
const fs = require('fs');

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

    // Initialize formidable with options
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filename: (name, ext, part, form) => {
        return `${Date.now()}-${part.originalFilename}`;
      }
    });

    // Parse the form data
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          reject(err);
        }
        resolve({ fields, files });
      });
    });

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
      content: `Analyze this CV and return a JSON object matching the following schema exactly.

      CV Content:
      ${cvContent}

      Target Position: ${jobDetails}

      Return a JSON object with this EXACT structure:
      {
        "name": "string",
        "contactDetails": {
          "email": "string",
          "phone": "string",
          "linkedin": "string",
          "address": "string"
        },
        "professionalSummary": "string",
        "professionalQualifications": ["string"],
        "education": [{
          "institution": "string",
          "degree": "string",
          "location": "string",
          "year": "string",
          "gpa": "string",
          "details": ["string"]
        }],
        "workExperience": [{
          "company": "string",
          "position": "string",
          "location": "string",
          "subtitle": "string",
          "duration": "string",
          "responsibilities": ["string"]
        }],
        "skills": {
          "technical": ["string"],
          "software": ["string"],
          "languages": ["string"],
          "certifications": ["string"],
          "interests": ["string"]
        },
        "hobbies": ["string"],
        "references": "string"
      }

      Ensure all required fields are included and match the schema exactly. Return ONLY the JSON object, no other text.`
    });

    console.log('Running assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      instructions: "Return only a valid JSON object matching the schema exactly. No markdown, no explanations, just the JSON.",
      response_format: { type: "json_object" }
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