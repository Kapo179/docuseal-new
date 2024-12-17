import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FormData } from '../types';

interface ContractFlowState {
  formData: FormData | null;
  paymentComplete: boolean;
  contractId: string | null;
  setFormData: (data: FormData) => void;
  setPaymentComplete: (complete: boolean) => void;
  setContractId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  formData: null,
  paymentComplete: false,
  contractId: null,
};

export const useContractFlow = create<ContractFlowState>()(
  persist(
    (set) => ({
      ...initialState,
      setFormData: (data) => set({ formData: data }),
      setPaymentComplete: (complete) => set({ paymentComplete: complete }),
      setContractId: (id) => set({ contractId: id }),
      reset: () => set(initialState),
    }),
    {
      name: 'contract-flow',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);