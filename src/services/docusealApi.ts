import axios from 'axios';
import type { SigningData } from '../types';

const API_BASE_URL = '/.netlify/functions';

interface DocuSealResponse {
  templateId: string;
  submissionId?: string; // Marked optional as the app can proceed without it
  documentUrl: string;
  signingUrl: string;
  status: 'success' | 'error';
  message?: string;
}

interface DocumentStatus {
  status: 'pending' | 'completed' | 'expired';
  message?: string;
}

export async function generateAgreementTemplate(data: SigningData): Promise<DocuSealResponse> {
  try {
    // Validate form data
    if (!data.formData) {
      throw new Error('Form data is required');
    }

    // Trim and validate make and model
    const make = data.formData.make?.trim();
    const model = data.formData.model?.trim();

    if (!make || !model) {
      throw new Error('Vehicle make and model are required');
    }

    // Validate signer information
    if (!data.seller?.name?.trim() || !data.seller?.email?.trim() || 
        !data.buyer?.name?.trim() || !data.buyer?.email?.trim()) {
      throw new Error('Seller and buyer information is required');
    }

    console.log('Sending request to create DocuSeal template:', {
      formData: data.formData,
      seller: data.seller,
      buyer: data.buyer
    });

    const response = await axios.post<DocuSealResponse>(
      `${API_BASE_URL}/create-docuseal-template`,
      {
        formData: data.formData,
        seller: data.seller,
        buyer: data.buyer,
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

    if (!response.data.signingUrl) {
      throw new Error('Invalid response: missing signing URL');
    }

    return response.data;
  } catch (error: any) {
    console.error('DocuSeal template generation error:', {
      error,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Re-throw with detailed error messages
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Failed to generate agreement template'
    );
  }
}

export async function getDocumentStatus(templateId: string): Promise<DocumentStatus> {
  try {
    if (!templateId?.trim()) {
      throw new Error('Template ID is required');
    }

    const response = await axios.get<DocumentStatus>(
      `${API_BASE_URL}/get-docuseal-status?templateId=${templateId}`
    );

    if (response.data.error) {
      throw new Error(response.data.message || 'Failed to check document status');
    }

    return response.data;
  } catch (error: any) {
    console.error('DocuSeal status check error:', {
      error,
      response: error.response?.data,
      status: error.response?.status,
    });

    throw new Error(
      error.response?.data?.message || error.message || 'Failed to check document status'
    );
  }
}
