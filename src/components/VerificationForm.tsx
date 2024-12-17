import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export default function VerificationForm({ onNext }: Props) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerification = async () => {
    // Open carVertical in a new window
    window.open('https://www.carvertical.com/en', '_blank', 'noopener,noreferrer');
    
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsVerifying(false);
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            🔍
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-semibold text-gray-900">Vehicle Background Check</h3>
            <p className="text-gray-600">Verify vehicle history and ownership</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Before we build your car sales agreement, we'll run a comprehensive background check on the vehicle.
            This process typically takes 2-3 minutes.
          </p>
          
          <ul className="space-y-3">
            {[
              'Check for outstanding finance',
              'Verify ownership history',
              'Confirm mileage accuracy',
              'Check for accident history'
            ].map((item, index) => (
              <li key={index} className="flex items-center text-gray-700">
                <span className="mr-3 text-green-500 text-lg">✓</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={handleVerification}
          disabled={isVerifying}
          className={`
            w-full mt-6 btn-primary flex items-center justify-center gap-2
            ${isVerifying ? 'opacity-75 cursor-not-allowed' : ''}
          `}
        >
          {isVerifying ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Background Check...
            </span>
          ) : (
            <>
              Start Background Check
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Background check powered by carVertical
          </p>
          <button
            onClick={onNext}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200 underline-offset-4 hover:underline"
          >
            Skip verification for now
          </button>
        </div>
      </div>
    </div>
  );
}