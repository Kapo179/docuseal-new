import React from 'react';
import type { ContractParty } from '../../types';

interface Props {
  partyOne: ContractParty;
  partyTwo: ContractParty;
  onPartyOneChange: (party: ContractParty) => void;
  onPartyTwoChange: (party: ContractParty) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}

export function PartyDetailsForm({ partyOne, partyTwo, onPartyOneChange, onPartyTwoChange, onSubmit, isLoading }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Party One Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="partyOneName" className="input-label">Full Name</label>
            <input
              type="text"
              id="partyOneName"
              value={partyOne.name}
              onChange={(e) => onPartyOneChange({ ...partyOne, name: e.target.value })}
              className="input-field"
              required
              placeholder="Enter party one's full name"
            />
          </div>
          <div>
            <label htmlFor="partyOneEmail" className="input-label">Email</label>
            <input
              type="email"
              id="partyOneEmail"
              value={partyOne.email}
              onChange={(e) => onPartyOneChange({ ...partyOne, email: e.target.value })}
              className="input-field"
              required
              placeholder="Enter party one's email"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Party Two Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="partyTwoName" className="input-label">Full Name</label>
            <input
              type="text"
              id="partyTwoName"
              value={partyTwo.name}
              onChange={(e) => onPartyTwoChange({ ...partyTwo, name: e.target.value })}
              className="input-field"
              required
              placeholder="Enter party two's full name"
            />
          </div>
          <div>
            <label htmlFor="partyTwoEmail" className="input-label">Email</label>
            <input
              type="email"
              id="partyTwoEmail"
              value={partyTwo.email}
              onChange={(e) => onPartyTwoChange({ ...partyTwo, email: e.target.value })}
              className="input-field"
              required
              placeholder="Enter party two's email"
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Agreement'}
      </button>
    </form>
  );
}