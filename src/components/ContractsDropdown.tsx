import { useState } from 'react';
import { ChevronDown, Lock, Circle } from 'lucide-react';
import { useContractStorage } from '../hooks/useContractStorage';

export function ContractsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { contracts } = useContractStorage();

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-gray-200
          hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
      >
        <span className="font-medium text-gray-700">My Contracts</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 
          ${isOpen ? 'rotate-180' : ''}`} 
        />
        {contracts.length > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
            {contracts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white rounded-xl shadow-xl 
          border border-gray-200 py-2 max-h-[calc(100vh-200px)] overflow-y-auto z-50">
          {contracts.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No contracts yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {contracts.map((contract) => (
                <div key={contract.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {contract.status === 'completed' ? (
                      <Lock className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-amber-500 flex-shrink-0 fill-current" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contract.type} Agreement
                      </p>
                      {contract.parties && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {contract.parties.seller.name} → {contract.parties.buyer.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full
                      ${contract.status === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                      {contract.status === 'completed' ? 'Signed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}