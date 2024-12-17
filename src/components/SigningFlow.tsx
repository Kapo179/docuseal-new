import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, CheckCircle } from 'lucide-react';
import { generateAgreementTemplate } from '../services/docusealApi';
import { useContractFlow } from '../hooks/useContractFlow';
import { useContractStorage } from '../hooks/useContractStorage';
import { PartyDetailsForm } from './SigningFlow/PartyDetailsForm';
import type { ContractParty } from '../types';

export function SigningFlow() {
  const navigate = useNavigate();
  const contractFlow = useContractFlow();
  const contractStorage = useContractStorage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [seller, setSeller] = useState<ContractParty>({ name: '', email: '' });
  const [buyer, setBuyer] = useState<ContractParty>({ name: '', email: '' });

  useEffect(() => {
    if (!contractFlow.formData || !contractFlow.paymentComplete) {
      navigate('/');
      return;
    }

    // Validate required form fields
    const make = contractFlow.formData.make?.trim();
    const model = contractFlow.formData.model?.trim();

    if (!make || !model) {
      navigate('/');
      return;
    }
  }, [contractFlow.formData, contractFlow.paymentComplete, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!contractFlow.formData) {
        return;
      }

      // Validate required fields
      if (!seller.name || !seller.email || !buyer.name || !buyer.email) {
        return;
      }

      setIsLoading(true);
      setShowEmailNotification(true);

      // Generate agreement template with DocuSeal
      const { templateId, documentUrl } = await generateAgreementTemplate({
        formData: contractFlow.formData,
        seller,
        buyer
      });

      // Store template ID for status checking
      sessionStorage.setItem('docuseal_template_id', templateId);

      // Reset contract flow
      contractFlow.reset();

      // Show email notification for 3 seconds before redirecting
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Redirect to DocuSeal signing page
      window.location.href = documentUrl;
    } catch (err) {
      console.error('DocuSeal flow error:', err);
      setIsLoading(false);
      setShowEmailNotification(false);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      {showEmailNotification && (
        <div className="fixed top-4 right-4 max-w-sm bg-white rounded-xl shadow-lg border border-green-100 p-4 animate-fadeIn z-50">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Check Your Email</h3>
              <p className="text-sm text-gray-600 mt-1">
                We've sent signing instructions to both parties. Please check your email to complete the signing process.
              </p>
            </div>
          </div>
        </div>
      )}

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
