import axios from 'axios';

const API_BASE_URL = '/.netlify/functions';

interface DocuSealResponse {
  templateId: string;
  submissionId?: string;
  error?: boolean;
  message?: string;
  documentUrl?: string;
}

interface GenerateTemplateData {
  formData: Record<string, any>;
  template: string;
}

export async function generateDocuSealTemplate(data: GenerateTemplateData): Promise<DocuSealResponse> {
  const response = await axios.post<DocuSealResponse>(
    `${API_BASE_URL}/generate-template`,
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

// New function to fetch contract data
export async function fetchContractData(templateId: string): Promise<DocuSealResponse> {
  try {
    const response = await axios.get<DocuSealResponse>(`/.netlify/get-docuseal-contract/${templateId}`);
    console.log('Response from Netlify function (get-docuseal-contract):', response.data);

    if (response.data.error) {
      throw new Error(response.data.message || 'Failed to fetch contract data');
    }

    return response.data;
  } catch (error) {
    console.error('Error in fetchContractData:', error.message || error);
    throw new Error('Failed to fetch contract data from backend');
  }
}
