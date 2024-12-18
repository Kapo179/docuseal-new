import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { FileText, Loader, AlertTriangle, Lock, ArrowRight } from 'lucide-react';

export default function ContractViewer() {
  const { templateId } = useParams();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createPaymentIntent, clientSecret } = usePaymentFlow();

  useEffect(() => {
    const fetchContract = async () => {
      if (!templateId) {
        console.error('No template ID provided in route params.');
        setError('No template ID provided.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/.netlify/functions/get-docuseal-contract?templateId=${templateId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch contract data (status: ${response.status})`);
        }

        const data = await response.json();
        const imageUrl = data.documents?.[0]?.preview_image_url;

        if (imageUrl) {
          setPreviewImageUrl(imageUrl);
        } else {
          throw new Error('No preview image URL found in the contract data.');
        }
      } catch (err: any) {
        console.error('Error fetching contract data:', err.message || err);
        setError(err.message || 'Failed to load contract.');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [templateId]);

  const handlePaymentSuccess = () => {
    console.log('Payment successful! 🎉');
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong 😕</h3>
              <p className="text-gray-600 text-center max-w-md">{error}</p>
            </div>
          ) : previewImageUrl ? (
            <div className="space-y-6">
              <div className="relative">
                <div className="aspect-[1/1.4] max-h-[600px] overflow-hidden bg-gray-50">
                  <img
                    src={previewImageUrl}
                    alt="Contract Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 pointer-events-none" />
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Secure Digital Signing 🔐</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Your contract will be securely stored and legally binding once signed ✅
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {clientSecret ? (
                    <StripePaymentElement
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onCancel={() => console.log('Payment cancelled ❌')}
                    />
                  ) : (
                    <button
                      onClick={createPaymentIntent}
                      className="w-full btn-primary group flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      Continue to Sign Contract ✍️
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
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