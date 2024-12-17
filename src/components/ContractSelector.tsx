import React from 'react';
import { Car, Users, ArrowRight, FileText } from 'lucide-react';
import { ContractsDropdown } from './ContractsDropdown';
import type { ContractType } from '../types';

interface Props {
  onSelect: (type: ContractType) => void;
}

interface ContractOption {
  id: ContractType;
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

export function ContractSelector({ onSelect }: Props) {
  const contracts: ContractOption[] = [
    {
      id: 'vehicle',
      title: 'Vehicle Sales Agreement',
      description: 'Generate a comprehensive contract for buying or selling vehicles',
      icon: <Car className="w-6 h-6" />
    },
    {
      id: 'influencer',
      title: 'Influencer Agreement',
      description: 'Create a professional contract for influencer partnerships',
      icon: <Users className="w-6 h-6" />,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex justify-center mb-8 pt-4">
        <ContractsDropdown />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg shadow-blue-500/25">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Contract Builder
            </h1>
            <p className="mt-2 text-gray-600">Select the type of agreement you want to create</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {contracts.map((contract) => (
              <button
                key={contract.id}
                onClick={() => contract.id && !contract.comingSoon && onSelect(contract.id)}
                disabled={contract.comingSoon}
                className={`
                  group relative overflow-hidden rounded-2xl p-6 text-left
                  transition-all duration-300 
                  ${contract.comingSoon
                    ? 'cursor-not-allowed bg-gray-50'
                    : 'hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 active:translate-y-0 bg-white'
                  }
                  border-2 border-gray-100 hover:border-blue-100
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    rounded-xl p-3 transition-colors duration-300
                    ${contract.comingSoon
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'
                    }
                  `}>
                    {contract.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`
                        font-semibold transition-colors duration-300
                        ${contract.comingSoon ? 'text-gray-400' : 'text-gray-900'}
                      `}>
                        {contract.title}
                      </h3>
                      {!contract.comingSoon && (
                        <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                      )}
                    </div>
                    <p className={`
                      mt-1 text-sm transition-colors duration-300
                      ${contract.comingSoon ? 'text-gray-400' : 'text-gray-600'}
                    `}>
                      {contract.description}
                    </p>
                    {contract.comingSoon && (
                      <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}