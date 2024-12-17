import { useState, useCallback } from 'react';
import { createSignatureRequest, getSignatureStatus, type SignatureResponse } from '../services/signatureApi';
import type { FormData } from '../types';

interface UseSignatureProps {
  onSuccess?: (response: SignatureResponse) => void;
  onError?: (error: Error) => void;
}

export function useSignature({ onSuccess, onError }: UseSignatureProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signatureData, setSignatureData] = useState<SignatureResponse | null>(null);

  const requestSignature = useCallback(async (
    formData: FormData,
    signerEmail: string,
    signerName: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await createSignatureRequest({
        documentId: `VEH-${Date.now()}`,
        signerEmail,
        signerName,
        documentData: formData,
      });

      setSignatureData(response);
      onSuccess?.(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create signature request');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  const checkStatus = useCallback(async (signatureId: string) => {
    try {
      const status = await getSignatureStatus(signatureId);
      setSignatureData(status);
      return status;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to check signature status');
      setError(error);
      throw error;
    }
  }, []);

  return {
    requestSignature,
    checkStatus,
    isLoading,
    error,
    signatureData,
  };
}