import { ArrowRight } from 'lucide-react';
import { PartyDetails } from './PartyDetails';
import type { ContractParty } from '../../types';

interface Props {
  seller: ContractParty;
  buyer: ContractParty;
  onSellerChange: (party: ContractParty) => void;
  onBuyerChange: (party: ContractParty) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}

export function PartyDetailsForm({
  seller,
  buyer,
  onSellerChange,
  onBuyerChange,
  onSubmit,
  isLoading
}: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="form-card space-y-6">
        <PartyDetails
          type="seller"
          party={seller}
          onChange={onSellerChange}
        />

        <div className="border-t border-gray-100 pt-6">
          <PartyDetails
            type="buyer"
            party={buyer}
            onChange={onBuyerChange}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          <>
            Continue to Signing
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}