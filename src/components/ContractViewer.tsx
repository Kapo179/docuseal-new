import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { FileText, Loader, AlertTriangle, Lock, ArrowRight, PenTool, Check, Smartphone, Mail } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentSuccess } from './PaymentSuccess';
import axios from 'axios';
import { navigate } from 'react-router-dom';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function ContractViewer() {
  const { templateId } = useParams();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createPaymentIntent, clientSecret, isProcessing, isComplete, error: paymentError, setError: setPaymentError, setComplete } = usePaymentFlow();
  const [showPayment, setShowPayment] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<Array<{name: string, email: string}>>([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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
        console.error('Error fetching contract data:', err.message || err);
        setError(err.message || 'Failed to load contract.');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [templateId]);

  const handlePaymentSuccess = async () => {
    if (paymentProcessing) return;
    
    try {
      setPaymentProcessing(true);
      console.log('Payment successful! 🎉');
      
      // Validate email recipients
      if (!emailRecipients.some(r => r.name && r.email)) {
        throw new Error('Please provide at least one recipient with name and email');
      }

      // Filter out empty recipients
      const validRecipients = emailRecipients.filter(r => r.name && r.email);
      
      console.log('Sending emails to:', validRecipients);
      setSendingEmails(true);
      
      const response = await axios.post('/.netlify/functions/create-docuseal-submission', {
        templateId,
        submitters: validRecipients.map((recipient, index) => ({
          name: recipient.name.trim(),
          email: recipient.email.trim(),
          role: `Party${index + 1}`
        }))
      });

      console.log('DocuSeal submission response:', response.data);

      if (response.data.success) {
        setShowEmailForm(false);
        setShowEmailNotification(true);
        
        setTimeout(() => {
          setShowEmailNotification(false);
          setComplete(true);
          navigate(`/success?submissionId=${response.data.submissionId}`);
        }, 5000);
      } else {
        throw new Error(response.data.error || 'Submission creation failed');
      }
    } catch (error) {
      console.error('Error processing payment or sending emails:', error);
      setPaymentError(
        error.message || 'Payment successful but failed to send emails. Please try again or contact support.'
      );
    } finally {
      setSendingEmails(false);
      setPaymentProcessing(false);
    }
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

  const handleEmailFormSubmit = async () => {
    if (paymentProcessing) return;
    
    // Validate recipients
    const validRecipients = emailRecipients.filter(r => r.name && r.email);
    if (validRecipients.length === 0) {
      setPaymentError('Please add at least one recipient with name and email');
      return;
    }

    try {
      setPaymentError(null);
      setPaymentProcessing(true);
      await createPaymentIntent();
      setShowPayment(true);
    } catch (error) {
      console.error('Payment initialization failed:', error);
      setPaymentError('Failed to initialize payment');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const emailButton = (
    <button
      onClick={() => setShowEmailForm(true)}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      <Mail className="w-4 h-4 mr-2" />
      Send via Email
    </button>
  );

  const emailFormModal = showEmailForm && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Send Contract via Email</h3>
        
        <div className="mb-6">
          {emailRecipients.map((recipient, index) => (
            <div key={index} className="mb-4">
              <input
                type="text"
                placeholder="Name"
                value={recipient.name}
                onChange={(e) => {
                  const newRecipients = [...emailRecipients];
                  newRecipients[index].name = e.target.value;
                  setEmailRecipients(newRecipients);
                }}
                className="w-full mb-2 p-2 border rounded"
              />
              <input
                type="email"
                placeholder="Email"
                value={recipient.email}
                onChange={(e) => {
                  const newRecipients = [...emailRecipients];
                  newRecipients[index].email = e.target.value;
                  setEmailRecipients(newRecipients);
                }}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
          
          <button
            onClick={() => setEmailRecipients([...emailRecipients, { name: '', email: '' }])}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Another Recipient
          </button>
        </div>

        {showPayment && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentElement
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={() => setShowPayment(false)}
            />
          </Elements>
        ) : (
          <div className="space-y-4">
            {paymentError && (
              <div className="text-red-600 text-sm">
                {paymentError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEmailForm(false);
                  setEmailRecipients([{ name: '', email: '' }]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailFormSubmit}
                disabled={isProcessing || !emailRecipients.some(r => r.name && r.email)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Proceed to Payment ($2.99)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const emailNotification = (
    <div className="fixed top-4 right-4 max-w-sm bg-white rounded-xl shadow-lg border border-green-100 p-4 animate-fadeIn z-50">
      <div className="flex items-start gap-3">
        <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
          <Mail className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Email Sent Successfully</h3>
          <p className="text-sm text-gray-600 mt-1">
            The contract has been sent to the specified recipients.
          </p>
        </div>
      </div>
    </div>
  );

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
            Review Your Contract 
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

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Send via Email ($2.99)
                  </button>
                  
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download={`contract-${templateId}.pdf`}
                      className="inline-flex items-center px-6 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Download PDF
                    </a>
                  )}
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

                {showEmailForm && emailFormModal}
                {showEmailNotification && emailNotification}
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