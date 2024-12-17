import { User, Mail } from 'lucide-react';
import type { ContractParty } from '../../types';

interface Props {
  type: 'seller' | 'buyer';
  party: ContractParty;
  onChange: (party: ContractParty) => void;
}

export function PartyDetails({ type, party, onChange }: Props) {
  const title = type === 'seller' ? 'Seller Details' : 'Buyer Details';
  const idPrefix = type === 'seller' ? 'seller' : 'buyer';

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-500" />
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}Name`} className="input-label">Full Name</label>
          <input
            type="text"
            id={`${idPrefix}Name`}
            value={party.name}
            onChange={(e) => onChange({ ...party, name: e.target.value })}
            className="input-field"
            required
            placeholder={`Enter ${type}'s full name`}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}Email`} className="input-label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id={`${idPrefix}Email`}
              value={party.email}
              onChange={(e) => onChange({ ...party, email: e.target.value })}
              className="input-field pl-12"
              required
              placeholder={`${type}@example.com`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}