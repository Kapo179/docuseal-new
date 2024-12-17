import { useState, type FC } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripePaymentElementOptions } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import { PenTool, AlertTriangle } from 'lucide-react';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export const StripePaymentElement: FC<Props> = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, setError, setComplete, clientSecret } = usePaymentFlow();

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Starting payment confirmation');
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: '${window.location.origin}/signing-setup',
          payment_method_data: {
            billing_details: {
              name: 'Vehicle Agreement Signing',
            },
          },
        },
      });

      if (paymentError) {
        console.error('Payment confirmation error:', paymentError);
        setError(paymentError.message || 'Payment failed. Please try again.');
        return;
      }

      // At this point, the payment was successful
      console.log('Payment successful');
      setComplete(true);
      onSuccess();
      
      // Navigate to signing setup
      navigate('/signing-setup');
    } catch (err) {
      console.error('Unexpected payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: 'tabs',
    defaultValues: {
      billingDetails: {
        name: 'Vehicle Agreement Signing',
      },
    },
    business: { name: 'Smart Contracts' },
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-green-100 p-2 rounded-lg">
          <PenTool className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
          <p className="text-sm text-gray-600">Secure payment for digital signing service</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Payment Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <PaymentElement options={paymentElementOptions} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handlePayment}
          disabled={!stripe || isSubmitting}
          className="w-full sm:flex-1 btn-primary bg-gradient-to-r from-emerald-500 to-green-500 
            hover:from-emerald-600 hover:to-green-600
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Pay & Continue ($2.99)'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-gray-700
            font-semibold border-2 border-gray-100
            hover:bg-gray-50 hover:border-gray-200
            transform transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
