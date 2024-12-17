import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PaymentIntent, StripeError } from '@stripe/stripe-js';

export interface SavedState {
  step?: string;
  formData?: string;
}

interface PaymentState {
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
  clientSecret: string | null;
  paymentIntent: PaymentIntent | null;
  savedState: SavedState;
  createPaymentIntent: () => Promise<void>;
  setError: (error: string | null) => void;
  setComplete: (complete: boolean) => void;
  setSavedState: (state: SavedState) => void;
  setPaymentIntent: (intent: PaymentIntent | null) => void;
  reset: () => void;
}

const initialState = {
  isProcessing: false,
  isComplete: false,
  error: null,
  clientSecret: null,
  paymentIntent: null,
  savedState: {},
};

const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setComplete: (complete: boolean) => {
        console.log('Setting payment complete:', complete);
        set({ isComplete: complete });
      },

      setError: (error: string | null) => {
        console.log('Setting payment error:', error);
        set({ error });
      },

      setSavedState: (state: SavedState) => {
        console.log('Setting saved state:', state);
        set({ savedState: state });
      },

      setPaymentIntent: (intent: PaymentIntent | null) => {
        console.log('Setting payment intent:', intent?.id);
        set({ paymentIntent: intent });
      },

      createPaymentIntent: async () => {
        const state = get();
        if (state.clientSecret) {
          console.log('Using existing payment intent');
          return;
        }

        console.log('Creating new payment intent');
        set({ isProcessing: true, error: null });

        try {
          const response = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            throw new Error('Failed to create payment intent');
          }

          const data = await response.json();
          console.log('Payment intent created:', data.paymentIntent?.id);
          
          set({ 
            clientSecret: data.clientSecret,
            paymentIntent: data.paymentIntent,
            isComplete: false,
            error: null
          });
        } catch (err) {
          const error = err as Error | StripeError;
          const errorMessage = error.message || 'Payment initialization failed';
          console.error('Payment intent creation failed:', errorMessage);
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isProcessing: false });
        }
      },

      reset: () => {
        console.log('Resetting payment state');
        set(initialState);
      },
    }),
    {
      name: 'payment-flow',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          return {
            ...initialState,
            ...persistedState,
          };
        }
        return persistedState;
      },
    }
  )
);

export const usePaymentFlow = () => {
  const store = usePaymentStore();
  return {
    isProcessing: store.isProcessing,
    isComplete: store.isComplete,
    error: store.error,
    clientSecret: store.clientSecret,
    paymentIntent: store.paymentIntent,
    savedState: store.savedState,
    createPaymentIntent: store.createPaymentIntent,
    setError: store.setError,
    setComplete: store.setComplete,
    setSavedState: store.setSavedState,
    setPaymentIntent: store.setPaymentIntent,
    reset: store.reset,
  };
};