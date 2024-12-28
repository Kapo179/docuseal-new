import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define the function schema
const cvFunctions = [
  {
    name: "generateCV",
    description: "Generate and assist in building comprehensive professional CV PDFs, as well as tailor current CVs & enhance current CV data for desired job positions",
    parameters: {
      type: "object",
      required: [
        "name",
        "contactDetails",
        "professionalQualifications",
        "education",
        "workExperience",
        "skills",
        "hobbies",
        "references"
      ],
      properties: {
        // ... your existing schema properties ...
      }
    }
  }
];

interface TailorCVResponse {
  success: boolean;
  pdfUrl?: string;
  previewUrl?: string;
  error?: string;
}

export async function tailorCV(pdfFile: File, jobDetails: string): Promise<TailorCVResponse> {
  try {
    // First, get OpenAI's function call response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: jobDetails }],
      functions: cvFunctions,
      function_call: "auto"
    });

    if (response.choices[0].message.function_call) {
      const functionArgs = JSON.parse(response.choices[0].message.function_call.arguments);
      
      // Then proceed with your existing formData upload
      const formData = new FormData();
      formData.append('cv', pdfFile);
      formData.append('jobDetails', jobDetails);
      formData.append('functionArgs', JSON.stringify(functionArgs));

      const apiResponse = await axios.post('/.netlify/functions/tailorCV', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        pdfUrl: apiResponse.data.pdfUrl,
        previewUrl: apiResponse.data.previewUrl
      };
    }

    throw new Error('OpenAI did not provide function arguments');
    
  } catch (error) {
    console.error('Error tailoring CV:', error);
    return {
      success: false,
      error: 'Failed to tailor CV. Please try again.'
    };
  }
} 