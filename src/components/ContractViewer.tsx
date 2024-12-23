import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { FileText, Loader, AlertTriangle, Lock, ArrowRight, PenTool, Check, Smartphone, Mail, Wand2, PlusCircle } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentSuccess } from './PaymentSuccess';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function ContractViewer() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createPaymentIntent, clientSecret, isProcessing, isComplete, error: paymentError, setError: setPaymentError, setComplete } = usePaymentFlow();
  const [showPayment, setShowPayment] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<Array<{name: string, email: string}>>([
    { name: '', email: '' }
  ]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [contractData, setContractData] = useState<{
    parties?: Array<{ name: string; email: string }>;
  } | null>(null);

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

        // Store contract data for auto-fill
        setContractData(data);

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

  const handleAutoFill = () => {
    if (contractData?.parties?.length) {
      setEmailRecipients(
        contractData.parties.map(party => ({
          name: party.name,
          email: party.email
        }))
      );
    }
  };

  const handlePaymentSuccess = async () => {
    if (paymentProcessing) return;
    
    try {
      setPaymentProcessing(true);
      console.log('Payment successful! 🎉');
      
      // Validate email recipients
      const validRecipients = emailRecipients.filter(r => r.name && r.email);
      if (validRecipients.length === 0) {
        throw new Error('Please provide at least one recipient with name and email');
      }

      console.log('Sending emails to:', validRecipients);
      setSendingEmails(true);

      // Format submitters for DocuSeal API
      const submitters = validRecipients.map((recipient, index) => ({
        role: `Party${index + 1}`,
        name: recipient.name.trim(),
        email: recipient.email.trim(),
        send_email: true,
        preferences: {
          send_email: true,
          send_sms: false
        }
      }));

      const response = await axios.post('/.netlify/functions/create-docuseal-submission', {
        template_id: templateId,
        send_email: true,
        submitters
      });

      if (response.data.success) {
        setShowEmailForm(false);
        setShowEmailNotification(true);
        setComplete(true);
        
        setTimeout(() => {
          setShowEmailNotification(false);
        }, 5000);
      } else {
        throw new Error(response.data.error || 'Failed to create submission');
      }
    } catch (error: any) {
      console.error('❌ Error creating submission:', error);
      setPaymentError(
        error.message || 'Failed to send emails. Please try again or contact support.'
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
    // Validate recipients
    const validRecipients = emailRecipients.filter(r => r.name && r.email);
    if (validRecipients.length === 0) {
      setPaymentError('Please add at least one recipient with name and email');
      return;
    }

    try {
      // Bypass payment and directly call handlePaymentSuccess
      await handlePaymentSuccess();
    } catch (error) {
      console.error('Failed to send emails:', error);
      setPaymentError('Failed to send emails. Please try again.');
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Send Contract via Email</h3>
          {contractData?.parties?.length > 0 && (
            <button
              onClick={handleAutoFill}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="Auto-fill from contract"
            >
              <Wand2 className="w-4 h-4 mr-1.5" />
              Auto-fill
            </button>
          )}
        </div>
        
        <div className="mb-6">
          {emailRecipients.map((recipient, index) => (
            <div key={index} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Party {index + 1}
              </label>
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
                required
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
                required
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
                setPaymentError(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleEmailFormSubmit}
              disabled={!emailRecipients.some(r => r.name && r.email)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Send Emails
            </button>
          </div>
        </div>
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

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-96">
      <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-600">Loading your contract... ⌛</p>
    </div>
  );

  const renderErrorState = (errorMessage: string) => (
    <div className="flex flex-col items-center justify-center h-96 px-4">
      <div className="bg-red-100 rounded-full p-3 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Oops! Something went wrong 😕
      </h3>
      <p className="text-gray-600 text-center max-w-md">{errorMessage}</p>
    </div>
  );

  const renderNoPreviewState = () => (
    <div className="flex flex-col items-center justify-center h-96 px-4">
      <p className="text-gray-600">No contract preview available 😔</p>
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
            renderLoadingState()
          ) : error ? (
            renderErrorState(error)
          ) : previewImageUrl ? (
            <div className="space-y-6">
              <div className="flex justify-center items-center w-full max-h-[60vh] bg-gray-50 rounded-lg shadow-lg overflow-hidden p-4">
                <img
                  src={previewImageUrl}
                  alt="Contract Preview"
                  className="w-full max-h-full object-contain rounded-lg"
                />
              </div>

              <div className="px-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Enter Signing Parties</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Add the email addresses of all parties who need to sign this contract
                      </p>
                    </div>
                    {contractData?.parties?.length > 0 && (
                      <button
                        onClick={handleAutoFill}
                        className="ml-auto inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Wand2 className="w-4 h-4 mr-1.5" />
                        Auto-fill
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {emailRecipients.map((recipient, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Party {index + 1} Name
                        </label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={recipient.name}
                          onChange={(e) => {
                            const newRecipients = [...emailRecipients];
                            newRecipients[index].name = e.target.value;
                            setEmailRecipients(newRecipients);
                          }}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Party {index + 1} Email
                        </label>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={recipient.email}
                          onChange={(e) => {
                            const newRecipients = [...emailRecipients];
                            newRecipients[index].email = e.target.value;
                            setEmailRecipients(newRecipients);
                          }}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  ))}
                  
                  {emailRecipients.length < 2 && (
                    <button
                      onClick={() => setEmailRecipients([...emailRecipients, { name: '', email: '' }])}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Add Another Party
                    </button>
                  )}
                </div>

                <div className="space-y-6">
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
                    <button
                      onClick={handleSignOnline}
                      disabled={isProcessing || !emailRecipients.some(r => r.name && r.email)}
                      className="w-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl px-6 py-3
                        font-semibold shadow-lg shadow-emerald-500/20 
                        hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02]
                        active:scale-[0.98] transform transition-all duration-200
                        disabled:opacity-75 disabled:cursor-not-allowed
                        animate-pulse hover:animate-none"
                    >
                      {isProcessing ? (
                        <ProcessingSpinner />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>Pay & Sign Now ⚡</span>
                          <span className="opacity-90">($2.99)</span>
                        </span>
                      )}
                    </button>
                  )}

                  {paymentError && (
                    <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                      <div className="flex gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-sm text-red-600">{paymentError}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            renderNoPreviewState()
          )}
        </div>
      </div>
      {showEmailNotification && <EmailSentNotification />}
    </div>
  );
}