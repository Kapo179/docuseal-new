import type { FormData } from '../types';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const API_BASE_URL = '/.netlify/functions';

export interface SigningResponse {
  documentId: string;
  signingUrl: string;
  status: 'pending' | 'completed' | 'expired' | 'declined';
}

export interface SigningStatus {
  status: 'pending' | 'completed' | 'declined' | 'voided';
  message?: string;
}

async function handleApiResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use the status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function createSigningRequest(
  formData: FormData,
  sellerEmail: string,
  sellerName: string,
  buyerEmail: string,
  buyerName: string
): Promise<SigningResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/create-boldsign-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData,
        sellerEmail,
        sellerName,
        buyerEmail,
        buyerName,
        redirectUrl: `${APP_URL}/signing-status`
      }),
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('Failed to create signing request:', error);
    throw error instanceof Error ? error : new Error('Failed to create signing request');
  }
}

export async function getSigningStatus(documentId: string): Promise<SigningStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-boldsign-status?documentId=${documentId}`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('Failed to get signing status:', error);
    throw error instanceof Error ? error : new Error('Failed to check signing status');
  }
}