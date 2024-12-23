import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentElement } from './StripePaymentElement';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const templateId = searchParams.get('templateId');
  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/.netlify/functions/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('Failed to create payment intent');
        }
      } catch (err) {
        setError('Failed to initialize payment. Please try again.');
      }
    };

    createPaymentIntent();
  }, []);

  const handlePaymentSuccess = () => {
    // Redirect back to contract page with success status
    navigate(`${returnUrl}?status=success`);
  };

  const handlePaymentError = (error: Error) => {
    setError(error.message);
  };

  const handleCancel = () => {
    navigate(returnUrl);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate(returnUrl)}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded"
          >
            Return to Contract
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentElement
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handleCancel}
            />
          </Elements>
        ) : (
          <div className="animate-pulse">Loading payment form...</div>
        )}
      </div>
    </div>
  );
} 