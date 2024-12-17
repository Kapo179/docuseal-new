import { useState, useEffect } from 'react';
import { usePaymentFlow } from './usePaymentFlow';

export function usePaymentStatus() {
  const [isChecking, setIsChecking] = useState(false);
  const { paymentIntentId, setComplete, setError } = usePaymentFlow();

  useEffect(() => {
    const checkStatus = async () => {
      if (!paymentIntentId) return;
      
      setIsChecking(true);
      try {
        const response = await fetch(
          `/.netlify/functions/check-payment-status?paymentIntentId=${paymentIntentId}`
        );
        
        if (!response.ok) throw new Error('Failed to check payment status');
        
        const { status } = await response.json();
        
        if (status === 'succeeded') {
          setComplete(true);
        } else if (status === 'requires_payment_method') {
          setError('Payment failed. Please try again.');
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
        setError('Failed to verify payment status');
      } finally {
        setIsChecking(false);
      }
    };

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('payment') === 'success' && paymentIntentId) {
      checkStatus();
    }
  }, [paymentIntentId, setComplete, setError]);

  return { isChecking };
}