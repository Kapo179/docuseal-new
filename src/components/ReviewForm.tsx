import React, { useState } from 'react';
import { type FormData } from '../types';
import { FileText, CheckCircle, Download, Check, Smartphone, Mail, PenTool, AlertTriangle } from 'lucide-react';
import { PDFPreview, generatePDF } from '../services/pdfGenerator';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripePaymentElement } from './StripePaymentElement';
import { PaymentSuccess } from './PaymentSuccess';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { useNavigate } from 'react-router-dom';
import { useContractFlow } from '../hooks/useContractFlow';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Props {
  data: FormData;
  onBack: () => void;
}

export default function ReviewForm({ data, onBack }: Props) {
  const navigate = useNavigate();
  const contractFlow = useContractFlow();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  
  const { 
    isProcessing,
    isComplete,
    error: paymentError,
    clientSecret,
    createPaymentIntent,
    setError,
    setComplete
  } = usePaymentFlow();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPreview) {
      setIsGenerating(true);
      setTimeout(() => {
        setIsGenerating(false);
        setShowPreview(true);
      }, 1500);
    }
  };

  const handleSignOnline = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent form submission
    
    try {
      setError(null);
      await createPaymentIntent();
      setShowPayment(true);
    } catch (error) {
      console.error('Payment initialization failed:', error);
    }
  };

  const handlePaymentSuccess = () => {
    // Store form data and mark payment as complete
    contractFlow.setFormData(data);
    contractFlow.setPaymentComplete(true);
    
    // Navigate to auth/success page
    navigate('/payment-success');
  };

  const handleBypassPayment = () => {
    // For development only
    contractFlow.setFormData(data);
    contractFlow.setPaymentComplete(true);
    setComplete(true);
    handlePaymentSuccess();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfBlob = await generatePDF(data);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vehicle-sales-agreement.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Details</h3>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Vehicle Information</h4>
              <dl className="space-y-1 text-sm">
                {data.vin && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">VIN:</dt>
                    <dd className="font-medium text-gray-900">{data.vin}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Make:</dt>
                  <dd className="font-medium text-gray-900">{data.make}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Model:</dt>
                  <dd className="font-medium text-gray-900">{data.model}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Year:</dt>
                  <dd className="font-medium text-gray-900">{data.year}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Mileage:</dt>
                  <dd className="font-medium text-gray-900">{data.mileage.toLocaleString()} miles</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Condition:</dt>
                  <dd className="font-medium text-gray-900">{data.condition}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Document Status</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${data.registration ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={data.registration ? 'text-gray-900' : 'text-gray-500'}>
                    Registration {data.registration ? 'Verified' : 'Not Verified'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${data.insurance ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={data.insurance ? 'text-gray-900' : 'text-gray-500'}>
                    Insurance {data.insurance ? 'Verified' : 'Not Verified'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${data.inspection ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={data.inspection ? 'text-gray-900' : 'text-gray-500'}>
                    Inspection {data.inspection ? 'Completed' : 'Not Completed'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {showPreview ? (
          <div className="space-y-6">
            <PDFPreview data={data} />

            <div className="bg-gradient-to-r from-green-50 to-lime-50 p-6 rounded-2xl border border-green-100">
              {isComplete ? (
                <PaymentSuccess onContinue={handlePaymentSuccess} />
              ) : showPayment && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentElement
                    onSuccess={handlePaymentSuccess}
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
                      <p className="text-sm text-gray-600">Fast, secure, and legally binding</p>
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
                    onClick={handleBypassPayment}
                    className="mt-4 w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg border border-gray-200 hover:border-gray-300 bg-white"
                  >
                    [TEMP] Skip Payment (Remove before launch)
                  </button>
                </>
              )}
            </div>

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
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Generate Sales Agreement</h3>
            </div>
            <p className="text-blue-100 text-sm">
              By proceeding, a legally-formatted sales agreement will be generated based on the information provided.
            </p>
          </div>
        )}
      </div>

      {!showPreview && (
        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary order-1 sm:order-none"
          >
            Back to Documents
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Agreement...
              </span>
            ) : (
              'Generate Agreement'
            )}
          </button>
        </div>
      )}
    </div>
  );
}