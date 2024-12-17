import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PaymentState {
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
  clientSecret: string | null;
  paymentIntentId: string | null;
  setProcessing: (processing: boolean) => void;
  setComplete: (complete: boolean) => void;
  setError: (error: string | null) => void;
  setPaymentDetails: (details: { clientSecret: string; paymentIntentId: string }) => void;
  reset: () => void;
}

export const usePaymentState = create<PaymentState>()(
  persist(
    (set) => ({
      isProcessing: false,
      isComplete: false,
      error: null,
      clientSecret: null,
      paymentIntentId: null,
      setProcessing: (processing) => set({ isProcessing: processing }),
      setComplete: (complete) => set({ isComplete: complete }),
      setError: (error) => set({ error }),
      setPaymentDetails: ({ clientSecret, paymentIntentId }) => 
        set({ clientSecret, paymentIntentId }),
      reset: () => set({ 
        isProcessing: false, 
        isComplete: false, 
        error: null,
        clientSecret: null,
        paymentIntentId: null
      }),
    }),
    {
      name: 'payment-state',
      getStorage: () => sessionStorage,
    }
  )
);