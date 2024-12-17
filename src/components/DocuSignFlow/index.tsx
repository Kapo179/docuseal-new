import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { PartyDetailsForm } from './PartyDetailsForm';
import { ErrorMessage } from './ErrorMessage';
import { createSigningRequest } from '../../services/docusignApi';
import { useContractFlow } from '../../hooks/useContractFlow';
import { useContractStorage } from '../../hooks/useContractStorage';
import type { ContractParty } from '../../types';

export function DocuSignFlow() {
  const navigate = useNavigate();
  const contractFlow = useContractFlow();
  const contractStorage = useContractStorage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seller, setSeller] = useState<ContractParty>({ name: '', email: '' });
  const [buyer, setBuyer] = useState<ContractParty>({ name: '', email: '' });

  useEffect(() => {
    try {
      if (!contractFlow.formData || !contractFlow.contractId || !contractFlow.paymentComplete) {
        throw new Error('Missing required contract data');
      }

      const contract = contractStorage.getContract(contractFlow.contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Validate form data structure
      if (!isValidFormData(contractFlow.formData)) {
        throw new Error('Invalid form data structure');
      }
    } catch (err) {
      console.error('Validation error:', err);
      navigate('/');
    }
  }, [contractFlow.formData, contractFlow.contractId, contractFlow.paymentComplete, navigate, contractStorage]);

  const isValidFormData = (data: unknown): boolean => {
    try {
      // Test if data can be properly serialized
      JSON.parse(JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!contractFlow.formData || !contractFlow.contractId) {
        throw new Error('No contract data available');
      }

      setIsLoading(true);
      setError(null);

      // Validate and sanitize form data
      const sanitizedFormData = JSON.parse(JSON.stringify(contractFlow.formData));

      // Validate party details
      if (!seller.name || !seller.email || !buyer.name || !buyer.email) {
        throw new Error('Please fill in all required fields');
      }

      // Create signing request
      const { envelopeId, signingUrl } = await createSigningRequest(
        sanitizedFormData,
        seller.email,
        seller.name,
        buyer.email,
        buyer.name
      );

      // Update contract in storage
      contractStorage.updateContract(contractFlow.contractId, {
        status: 'pending_signatures',
        parties: { seller, buyer }
      });

      // Store envelope ID for status checking
      sessionStorage.setItem('docusign_envelope_id', envelopeId);

      // Reset contract flow
      contractFlow.reset();

      // Redirect to DocuSign
      window.location.href = signingUrl;
    } catch (err) {
      console.error('DocuSign flow error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create signing request');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Setup Digital Signing
          </h1>
          <p className="mt-2 text-gray-600">Enter the details for both parties to sign the agreement</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <PartyDetailsForm
          seller={seller}
          buyer={buyer}
          onSellerChange={setSeller}
          onBuyerChange={setBuyer}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}