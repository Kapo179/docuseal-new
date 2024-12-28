const OpenAI = require('openai');
const busboy = require('busboy');
const fs = require('fs');
const os = require('os');
const path = require('path');
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

    // Read the CV content from the temporary file
    const cvContent = files.cv.content.toString('utf8');
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
          "name": "generateCV",
          "description": "Generate and assist in building comprehensive professional CV PDFs, as well as tailor current CVs & enhance current CV data for desired job positions",
          "strict": true,
          "parameters": {
            "type": "object",
            "required": [
              "name",
              "contactDetails",
              "professionalQualifications",
              "education",
              "workExperience",
              "skills",
              "hobbies",
              "references"
            ],
            "properties": {
              "name": {
                "type": "string",
                "description": "Full name of the CV owner",
                "example": "John Doe"
              },
              "contactDetails": {
                "type": "object",
                "description": "Contact details for the CV owner",
                "required": [
                  "email",
                  "phone",
                  "linkedin",
                  "address"
                ],
                "properties": {
                  "email": {
                    "type": "string",
                    "description": "Email address of the CV owner",
                    "example": "john.doe@example.com"
                  },
                  "phone": {
                    "type": "string",
                    "description": "Phone number of the CV owner",
                    "example": "+123456789"
                  },
                  "linkedin": {
                    "type": "string",
                    "description": "LinkedIn profile URL of the CV owner",
                    "example": "https://www.linkedin.com/in/johndoe"
                  },
                  "address": {
                    "type": "string",
                    "description": "Full address or location",
                    "example": "123 Main St, City, Country"
                  }
                },
                "additionalProperties": false
              },
              "professionalQualifications": {
                "type": "array",
                "description": "List of professional certifications and qualifications",
                "items": {
                  "type": "string"
                },
                "example": [
                  "AWS Certified Developer",
                  "Scrum Master Certification"
                ]
              },
              "education": {
                "type": "array",
                "description": "List of educational qualifications",
                "items": {
                  "type": "object",
                  "required": [
                    "institution",
                    "degree",
                    "year",
                    "location",
                    "gpa",
                    "details"
                  ],
                  "properties": {
                    "institution": {
                      "type": "string",
                      "description": "Name of the institution",
                      "example": "University of Example"
                    },
                    "degree": {
                      "type": "string",
                      "description": "Degree earned",
                      "example": "BSc in Computer Science"
                    },
                    "location": {
                      "type": "string",
                      "description": "Institution location",
                      "example": "Boston, MA"
                    },
                    "year": {
                      "type": "string",
                      "description": "Year of graduation",
                      "example": "2023"
                    },
                    "gpa": {
                      "type": "string",
                      "description": "Grade Point Average",
                      "example": "3.8/4.0"
                    },
                    "details": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      },
                      "description": "Detailed information about the education entry",
                      "example": [
                        "Dean's List 2020-2021",
                        "Research Assistant"
                      ]
                    }
                  },
                  "additionalProperties": false
                }
              },
              "workExperience": {
                "type": "array",
                "description": "List of work experiences",
                "items": {
                  "type": "object",
                  "required": [
                    "company",
                    "position",
                    "location",
                    "subtitle",
                    "duration",
                    "responsibilities"
                  ],
                  "properties": {
                    "company": {
                      "type": "string",
                      "description": "Name of the company",
                      "example": "Example Corp"
                    },
                    "position": {
                      "type": "string",
                      "description": "Job title or position",
                      "example": "Software Engineer"
                    },
                    "location": {
                      "type": "string",
                      "description": "Job location",
                      "example": "San Francisco, CA"
                    },
                    "subtitle": {
                      "type": "string",
                      "description": "Additional role information",
                      "example": "Full Stack Development Team"
                    },
                    "duration": {
                      "type": "string",
                      "description": "Duration of employment",
                      "example": "2020-2023"
                    },
                    "responsibilities": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      },
                      "description": "Key responsibilities and achievements",
                      "example": [
                        "Led development of microservices architecture",
                        "Implemented CI/CD pipeline",
                        "Mentored junior developers"
                      ]
                    }
                  },
                  "additionalProperties": false
                }
              },
              "skills": {
                "type": "object",
                "description": "Categorized professional skills",
                "required": [
                  "technical",
                  "software",
                  "languages",
                  "certifications",
                  "interests"
                ],
                "properties": {
                  "technical": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Technical skills and programming languages",
                    "example": [
                      "JavaScript",
                      "Python",
                      "React"
                    ]
                  },
                  "software": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Software and tools proficiency",
                    "example": [
                      "VS Code",
                      "Git",
                      "Docker"
                    ]
                  },
                  "languages": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Language proficiencies",
                    "example": [
                      "English (Native)",
                      "Spanish (Fluent)"
                    ]
                  },
                  "certifications": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Professional certifications",
                    "example": [
                      "AWS Certified Developer",
                      "MCSD"
                    ]
                  },
                  "interests": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    },
                    "description": "Personal interests and hobbies",
                    "example": [
                      "Photography",
                      "Reading",
                      "Hiking"
                    ]
                  }
                },
                "additionalProperties": false
              },
              "hobbies": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "List of hobbies and interests",
                "example": [
                  "Photography",
                  "Reading",
                  "Hiking"
                ]
              },
              "references": {
                "type": "string",
                "description": "Reference availability statement",
                "example": "References available upon request"
              }
            },
            "additionalProperties": false
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
            try {
              console.log('Parsing function arguments:', toolCall.function.arguments);
              const cvData = JSON.parse(toolCall.function.arguments);
              
              // Validate required fields
              if (!cvData.name || !cvData.contactDetails) {
                throw new Error('Missing required CV data fields');
              }

              const result = await generateCV(cvData);
              
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
              
              console.log('Generated tool output:', toolOutputs[0]);
            } catch (error) {
              console.error('Error in generateCV:', error);
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  success: false,
                  error: error.message,
                  cvData: cvData // Log the data for debugging
                })
              });
            }
          }
        }

        if (toolOutputs.length > 0) {
          await openai.beta.threads.runs.submitToolOutputs(
            thread.id,
            run.id,
            { tool_outputs: toolOutputs }
          );
        } else {
          throw new Error('No tool outputs generated');
        }
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
          filename: info.filename,
          content: Buffer.concat(chunks),
          contentType: info.mimeType
        };
      });
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