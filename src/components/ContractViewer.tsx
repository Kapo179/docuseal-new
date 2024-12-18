import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { FileText, Loader, AlertTriangle, Lock, ArrowRight, PenTool, Check, Smartphone, Mail, Download } from 'lucide-react';
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
  const [sessionValid, setSessionValid] = useState(false); // To track session validity
  const { createPaymentIntent, clientSecret, isProcessing, isComplete, error: paymentError, setError: setPaymentError, setComplete } = usePaymentFlow();
  const [showPayment, setShowPayment] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const validateSessionAndFetchContract = async () => {
      if (!templateId) {
        console.error('No template ID provided in route params.');
        setError('No template ID provided.');
        setLoading(false);
        return;
      }

      const token = new URLSearchParams(window.location.search).get('token'); // Get session token from URL

      if (!token) {
        setError('Session token is missing.');
        setLoading(false);
        return;
      }

      try {
        // Step 1: Validate the session token
        const validateResponse = await fetch(`/.netlify/functions/validate-session?token=${token}`);
        const validateData = await validateResponse.json();

        if (!validateResponse.ok || !validateData.success) {
          throw new Error(validateData.error || 'Invalid session token.');
        }

        console.log('Session validated:', validateData);
        setSessionValid(true);

        // Step 2: Fetch contract data if session is valid
        const response = await fetch(`/.netlify/functions/get-docuseal-contract?templateId=${templateId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch contract data (status: ${response.status})`);
        }

        const data = await response.json();
        const imageUrl = data.documents?.[0]?.preview_image_url;
        const pdfUrl = data.documents?.[0]?.url;

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
        console.error('Error:', err.message || err);
        setError(err.message || 'Failed to load contract.');
      } finally {
        setLoading(false);
      }
    };

    validateSessionAndFetchContract();
  }, [templateId]);

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

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `contract-${templateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading the PDF:', error);
    } finally {
      setIsDownloading(false);
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
              <p className="text-gray-600">Validating your session... ⌛</p>
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
          ) : sessionValid && previewImageUrl ? (
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
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <PenTool className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Sign Online</h3>
                        <p className="text-sm text-gray-600">Fast, Secure, and Certified!✨</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-2xl font-bold text-green-600">$2.99</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {[
                        { icon: <PenTool className="w-4 h-4" />, text: 'Sign Hassle-free' },
                        { icon: <Smartphone className="w-4 h-4" />, text: 'Send via text' },
                        { icon: <Mail className="w-4 h-4" />, text: 'Send via email' }
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-gray-700">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm flex items-center gap-1.5">
                            {feature.icon}
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {paymentError && (
                      <div className="rounded-lg bg-red-50 p-3 border border-red-200 mb-6">
                        <div className="flex gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="text-sm text-red-600">{paymentError}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSignOnline}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl px-6 py-3
                        font-semibold shadow-lg shadow-emerald-500/20 
                        hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02]
                        active:scale-[0.98] transform transition-all duration-200
                        disabled:opacity-75 disabled:cursor-not-allowed
                        animate-pulse hover:animate-none"
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>Sign Online ⚡</span>
                          <span className="opacity-90">($2.99)</span>
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => console.log('Bypass payment')}
                      className="mt-4 w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg border border-gray-200 hover:border-gray-300 bg-white"
                    >
                      [TEMP] Skip Payment (Remove before launch)
                    </button>
                  </>
                )}

                {pdfUrl && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-4">or download and sign manually</p>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      {isDownloading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Preparing Download...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />
                          Download Agreement
                        </span>
                      )}
                    </button>
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