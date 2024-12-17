import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Contract, FormData } from '../types';

interface ContractState {
  contracts: Contract[];
  activeContractId: string | null;
}

interface ContractActions {
  addContract: (formData: FormData) => string;
  updateContract: (id: string, updates: Partial<Omit<Contract, 'id' | 'createdAt' | 'type'>>) => void;
  getContract: (id: string) => Contract | undefined;
  setActiveContract: (id: string | null) => void;
  removeContract: (id: string) => void;
}

type ContractStore = ContractState & ContractActions;

const initialState: ContractState = {
  contracts: [],
  activeContractId: null,
};

export const useContractStorage = create<ContractStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addContract: (formData) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        const newContract: Contract = {
          id,
          type: 'vehicle',
          status: 'draft',
          formData,
          createdAt: now,
          updatedAt: now,
          paymentStatus: 'pending'
        };

        set((state) => ({
          ...state,
          contracts: [...state.contracts, newContract],
          activeContractId: id
        }));

        return id;
      },

      updateContract: (id, updates) => {
        set((state) => ({
          ...state,
          contracts: state.contracts.map((contract) =>
            contract.id === id
              ? {
                  ...contract,
                  ...updates,
                  updatedAt: new Date().toISOString()
                }
              : contract
          )
        }));
      },

      getContract: (id) => {
        return get().contracts.find((contract) => contract.id === id);
      },

      setActiveContract: (id) => {
        set((state) => ({ ...state, activeContractId: id }));
      },

      removeContract: (id) => {
        set((state) => ({
          ...state,
          contracts: state.contracts.filter((contract) => contract.id !== id),
          activeContractId: state.activeContractId === id ? null : state.activeContractId
        }));
      }
    }),
    {
      name: 'contract-storage',
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch (error) {
            console.error('Storage read error:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Storage write error:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Storage remove error:', error);
          }
        },
      },
      partialize: (state) => ({
        contracts: state.contracts,
        activeContractId: state.activeContractId,
      }) as ContractStore,
    }
  )
);