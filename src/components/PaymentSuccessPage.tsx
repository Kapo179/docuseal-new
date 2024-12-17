import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { useContractStorage } from '../hooks/useContractStorage';
import { useContractFlow } from '../hooks/useContractFlow';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const contractFlow = useContractFlow();
  const contractStorage = useContractStorage();
  
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verify required data
  useEffect(() => {
    if (!contractFlow.formData) {
      navigate('/');
    }
  }, [contractFlow.formData, navigate]);

  const handleContinue = async () => {
    if (!contractFlow.formData || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Store contract in local storage
      const contractId = contractStorage.addContract(contractFlow.formData);
      
      // Update contract status
      contractStorage.updateContract(contractId, {
        status: 'pending_signatures',
        paymentStatus: 'completed'
      });

      // Set contract ID and payment status in flow
      contractFlow.setContractId(contractId);
      contractFlow.setPaymentComplete(true);

      // Navigate to signing setup
      navigate('/signing-setup');
    } catch (err) {
      console.error('Contract creation error:', err);
      setError('Failed to save contract. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        <div className="form-card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-8">
            Your payment has been processed successfully. Continue to set up the signing process.
          </p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={isProcessing}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                Continue to Signing
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-center text-gray-500">
            Your contract will be saved locally in your browser
          </p>
        </div>
      </div>
    </div>
  );
}