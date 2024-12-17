import axios from 'axios';

const API_BASE_URL = '/.netlify/functions';

interface DocuSealResponse {
  templateId: string;
  submissionId?: string;
  error?: boolean;
  message?: string;
  documentUrl?: string; // Add this line
}

interface GenerateTemplateData {
  formData: Record<string, any>;
  template: string;
}


export async function generateDocuSealTemplate(data: GenerateTemplateData): Promise<DocuSealResponse> {
  const response = await axios.post<DocuSealResponse>(
    `${API_BASE_URL}/create-docuseal-template`,
    {
      formData: data.formData,
      template: data.template,
    }
  );

  console.log('Response from create-docuseal-template:', response.data);

  // Handle errors from API
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to generate template');
  }

  // Validate required fields in response
  if (!response.data.templateId) {
    throw new Error('Invalid response: missing template ID');
  }

  // Optional handling for submissionId
  if (!response.data.submissionId) {
    console.warn(
      'Submission ID is missing in the response, but proceeding since functionality is intact.'
    );
  }

  return response.data;
}

// Define and export generateAgreementTemplate
export async function generateAgreementTemplate(data: GenerateTemplateData): Promise<DocuSealResponse> {
  return generateDocuSealTemplate(data);
}