import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

interface Props {
  onSuccess: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

export function StripePaymentElement({ onSuccess, onError, onCancel }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: 'Contract Signing'
            }
          }
        },
        redirect: 'if_required'
      });

      if (paymentError) {
        console.error('Payment confirmation error:', paymentError);
        onError(new Error(paymentError.message));
        return;
      }

      console.log('Payment successful');
      onSuccess();
    } catch (err) {
      console.error('Unexpected payment error:', err);
      onError(err instanceof Error ? err : new Error('Unexpected error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <PaymentElement 
        options={{
          layout: 'tabs',
          business: { name: 'Smart Contracts' }
        }}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Pay $2.99'}
        </button>
      </div>
    </form>
  );
}