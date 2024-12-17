import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { generateAgreementTemplate } from '../services/docusealApi';
import { useContractFlow } from '../hooks/useContractFlow';
import { useContractStorage } from '../hooks/useContractStorage';
import { PartyDetailsForm } from './DocuSignFlow/PartyDetailsForm';
import { ErrorMessage } from './DocuSignFlow/ErrorMessage';
import type { ContractParty } from '../types';

export function DocuSignFlow() {
  const navigate = useNavigate();
  const contractFlow = useContractFlow();
  const contractStorage = useContractStorage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seller, setSeller] = useState<ContractParty>({ name: '', email: '' });
  const [buyer, setBuyer] = useState<ContractParty>({ name: '', email: '' });

  useEffect(() => {
    if (!contractFlow.formData || !contractFlow.contractId || !contractFlow.paymentComplete) {
      navigate('/');
      return;
    }

    const contract = contractStorage.getContract(contractFlow.contractId);
    if (!contract) {
      navigate('/');
      return;
    }
  }, [contractFlow.formData, contractFlow.contractId, contractFlow.paymentComplete, navigate, contractStorage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!contractFlow.formData || !contractFlow.contractId) {
        throw new Error('No contract data available');
      }

      if (!seller.name || !seller.email || !buyer.name || !buyer.email) {
        throw new Error('Please fill in all required fields');
      }

      setIsLoading(true);
      setError(null);

      // Generate agreement template with DocuSeal
      const { templateId, documentUrl } = await generateAgreementTemplate({
        formData: contractFlow.formData,
        seller,
        buyer
      });

      // Update contract in storage
      contractStorage.updateContract(contractFlow.contractId, {
        status: 'pending_signatures',
        parties: { seller, buyer }
      });

      // Store template ID for status checking
      sessionStorage.setItem('docuseal_template_id', templateId);

      // Reset contract flow
      contractFlow.reset();

      // Redirect to DocuSeal signing page
      window.location.href = documentUrl;
    } catch (err) {
      console.error('DocuSeal flow error:', err);
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