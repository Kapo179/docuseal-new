import React from 'react';
import { Check, ExternalLink } from 'lucide-react';

export default function LegalAdvicePromo() {
  return (
    <div className="form-card bg-gradient-to-r from-indigo-50 to-blue-50 mb-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">⚖️</span>
            Unlimited Legal Advice
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Access our experts in consumer law, travel, motoring, landlords & tenancy, wills & probate and more',
              'Get clear guidance on your next steps from experts you can trust',
              'Unlimited calls – speak with us as often as you need',
              'Cover for your whole household'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-auto flex flex-col items-center gap-2">
          <div className="text-center mb-2">
            <div className="text-2xl font-bold text-blue-600">£9</div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
          <a
            href="https://legalservice.which.co.uk/cars-motoring/buying-hiring-a-car/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full sm:w-auto whitespace-nowrap flex items-center gap-2 group"
          >
            Protect Yourself Now
            <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  );
}