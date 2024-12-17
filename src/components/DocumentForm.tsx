import React from 'react';
import { type DocumentStatus } from '../types';
import { AlertCircle } from 'lucide-react';

interface Props {
  data: DocumentStatus;
  onChange: (data: DocumentStatus) => void;
  onNext: () => void;
  onBack: () => void;
}

interface DocumentItem {
  id: keyof DocumentStatus;
  label: string;
  description: string;
  icon: string;
  note?: React.ReactNode;
}

export default function DocumentForm({ data, onChange, onNext, onBack }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target;
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    onChange({ 
      ...data, 
      [name]: newValue 
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onNext();
  };

  const documents: DocumentItem[] = [
    { 
      id: 'registration',
      label: 'Vehicle Registration',
      description: 'Current and valid vehicle registration',
      icon: '📝'
    },
    { 
      id: 'insurance',
      label: 'Insurance Coverage',
      description: 'Active insurance policy',
      icon: '🛡️',
      note: (
        <div className="mt-3 animate-fadeIn">
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <span className="text-lg">🇬🇧</span>
                  UK Sellers: Insurance follows the driver, not the vehicle
                </p>
                <p className="text-xs text-blue-600">
                  Not applicable in countries where insurance is tied to the driver rather than the vehicle
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    { 
      id: 'inspection',
      label: 'Vehicle Inspection',
      description: 'Recent safety inspection report',
      icon: '🔍'
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="group">
            <label 
              htmlFor={doc.id}
              className="checkbox-card flex cursor-pointer items-start gap-4"
            >
              <input
                type="checkbox"
                id={doc.id}
                name={doc.id}
                checked={Boolean(data[doc.id])}
                onChange={handleChange}
                className="checkbox-input mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{doc.icon}</span>
                  <span className="font-medium text-gray-900">{doc.label}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{doc.description}</p>
                {doc.note}
                {doc.id === 'inspection' && data.inspection && (
                  <div className="mt-3 animate-fadeIn space-y-3">
                    <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">
                          Highlight any prior issues found before sale
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <textarea
                        name="inspectionNotes"
                        value={data.inspectionNotes || ''}
                        onChange={handleChange}
                        placeholder="Enter inspection details and any issues found..."
                        className="w-full min-h-[100px] rounded-lg border-2 border-blue-100 bg-white/90 p-3 text-sm text-gray-700
                          placeholder:text-gray-400
                          focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-400/20
                          transition-all duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="btn-secondary order-1 sm:order-none">
          Back to Vehicle Details
        </button>
        <button type="submit" className="btn-primary">
          Continue to Verification
        </button>
      </div>
    </form>
  );
}