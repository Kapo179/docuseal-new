import { FormData } from '../types';

export interface SignatureRequest {
  documentId: string;
  signerEmail: string;
  signerName: string;
  documentData: FormData;
}

export interface SignatureResponse {
  signatureId: string;
  signatureUrl: string;
  status: 'pending' | 'completed' | 'expired' | 'declined';
  expiresAt: string;
}

export async function createSignatureRequest(request: SignatureRequest): Promise<SignatureResponse> {
  const API_KEY = import.meta.env.VITE_SIGNATURE_API_KEY;
  const API_URL = import.meta.env.VITE_SIGNATURE_API_URL;

  try {
    const response = await fetch(`${API_URL}/signatures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Signature API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create signature request:', error);
    throw new Error('Failed to initiate signing process');
  }
}

export async function getSignatureStatus(signatureId: string): Promise<SignatureResponse> {
  const API_KEY = import.meta.env.VITE_SIGNATURE_API_KEY;
  const API_URL = import.meta.env.VITE_SIGNATURE_API_URL;

  try {
    const response = await fetch(`${API_URL}/signatures/${signatureId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Signature API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get signature status:', error);
    throw new Error('Failed to check signature status');
  }
}