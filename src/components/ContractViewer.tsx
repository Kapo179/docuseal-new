import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { FileText, Loader, AlertTriangle, Lock, ArrowRight, PenTool, Check, Smartphone, Mail } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentSuccess } from './PaymentSuccess';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function ContractViewer() {
  const { templateId } = useParams();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createPaymentIntent, clientSecret, isProcessing, isComplete, error: paymentError, setError: setPaymentError, setComplete } = usePaymentFlow();
  const [showPayment, setShowPayment] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem('sessionToken'));

  useEffect(() => {
    const validateSessionAndFetchContract = async () => {
      if (!templateId || !sessionToken) {
        console.error('Missing template ID or session token.');
        setError('You do not have access to this contract.');
        setLoading(false);
        return;
      }

      try {
        console.log('Validating session token...');
        const validationResponse = await fetch(`/.netlify/functions/validate-session?token=${sessionToken}`);
        if (!validationResponse.ok) {
          throw new Error('Session validation failed.');
        }
        const validationData = await validationResponse.json();
        console.log('Session validation successful:', validationData);

        console.log('Fetching contract data...');
        const contractResponse = await fetch(`/.netlify/functions/get-docuseal-contract?templateId=${templateId}`);
        if (!contractResponse.ok) {
          throw new Error(`Failed to fetch contract data (status: ${contractResponse.status})`);
        }

        const contractData = await contractResponse.json();
        const imageUrl = contractData.documents?.[0]?.preview_image_url;
        const pdfUrl = contractData.documents?.[0]?.url;

        if (imageUrl) {
          setPreviewImageUrl(imageUrl);
        } else {
          throw new Error('No preview image URL found in the contract data.');
        }

        if (pdfUrl) {
          setPdfUrl(pdfUrl);
        } else {
          throw new Error('No PDF URL found in the contract data.');
        }
      } catch (err: any) {
        console.error('Error during session validation or contract fetch:', err.message || err);
        setError('You do not have access to this contract.');
      } finally {
        setLoading(false);
      }
    };

    validateSessionAndFetchContract();
  }, [templateId, sessionToken]);

  const handlePaymentSuccess = () => {
    console.log('Payment successful! 🎉');
    setComplete(true);
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
    setPaymentError(error.message);
  };

  const handleSignOnline = async () => {
    try {
      setPaymentError(null);
      await createPaymentIntent();
      setShowPayment(true);
    } catch (error) {
      console.error('Payment initialization failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Review Your Contract 📄
          </h1>
          <p className="mt-2 text-gray-600">
            Please review your contract carefully before proceeding with the signing process ✍️
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">Loading your contract... ⌛</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 px-4">
              <div className="bg-red-100 rounded-full p-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Oops! Something went wrong 😕
              </h3>
              <p className="text-gray-600 text-center max-w-md">{error}</p>
            </div>
          ) : previewImageUrl ? (
            <div className="space-y-6">
              <div className="flex justify-center items-center w-full max-h-[60vh] bg-gray-50 rounded-lg shadow-lg overflow-hidden p-4">
                <img
                  src={previewImageUrl}
                  alt="Contract Preview"
                  className="w-full max-h-full object-contain rounded-lg"
                />
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Email, Review and Sign Your Contract ✅</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Your contract will be certified and emailed to you once signed 📧
                      </p>
                    </div>
                  </div>
                </div>

                {isComplete ? (
                  <PaymentSuccess onContinue={handlePaymentSuccess} />
                ) : showPayment && clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentElement
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onCancel={() => setShowPayment(false)}
                    />
                  </Elements>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSignOnline}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl px-6 py-3"
                    >
                      {isProcessing ? 'Processing...' : 'Sign Online ⚡ ($2.99)'}
                    </button>
                  </>
                )}

                {pdfUrl && (
                  <div className="text-center mt-4">
                    <a
                      href={pdfUrl}
                      download={`contract-${templateId}.pdf`}
                      className="inline-block px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Download PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 px-4">
              <p className="text-gray-600">No contract preview available 😔</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
