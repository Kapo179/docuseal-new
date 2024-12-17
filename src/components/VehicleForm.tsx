import React, { useState } from 'react';
import { type VehicleDetails } from '../types';
import { AlertTriangle, Lightbulb, AlertCircle, ChevronDown } from 'lucide-react';

interface Props {
  data: VehicleDetails;
  onChange: (data: VehicleDetails) => void;
  onNext: () => void;
}

const currencies = [
  { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', label: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
] as const;

export default function VehicleForm({ data, onChange, onNext }: Props) {
  const [showVinWarning, setShowVinWarning] = useState(false);
  const [mileageInput, setMileageInput] = useState(data.mileage ? data.mileage.toString() : '');
  const [priceInput, setPriceInput] = useState(data.price ? data.price.toString() : '');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'mileage') {
      setMileageInput(value);
      onChange({ ...data, [name]: parseInt(value) || 0 });
    } else if (name === 'price') {
      setPriceInput(value);
      onChange({ ...data, [name]: parseFloat(value) || 0 });
    } else {
      onChange({ ...data, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.vin.trim()) {
      setShowVinWarning(true);
    } else {
      onNext();
    }
  };

  const proceedWithoutVin = () => {
    setShowVinWarning(false);
    onNext();
  };

  const showMileageWarning = data.mileage > 100000;
  const selectedCurrency = currencies.find(c => c.code === data.currency) || currencies[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="group">
          <div className="flex items-center justify-between">
            <label htmlFor="vin" className="input-label">
              VIN Number
            </label>
            <span className="text-sm text-gray-500">Optional</span>
          </div>
          <input
            type="text"
            id="vin"
            name="vin"
            value={data.vin}
            onChange={handleChange}
            className="input-field"
            pattern="^[A-HJ-NPR-Z0-9]{17}$"
            title="Please enter a valid 17-character VIN"
            placeholder="Enter 17-character VIN (recommended)"
            autoComplete="off"
          />
          <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            VIN helps verify vehicle history and authenticity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="group">
            <label htmlFor="make" className="input-label">
              Make <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="make"
              name="make"
              value={data.make}
              onChange={handleChange}
              className="input-field"
              required
              placeholder="e.g., Toyota"
              autoComplete="off"
            />
          </div>
          <div className="group">
            <label htmlFor="model" className="input-label">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={data.model}
              onChange={handleChange}
              className="input-field"
              required
              placeholder="e.g., Camry"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="group">
            <label htmlFor="year" className="input-label">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={data.year}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear()}
              className="input-field"
              required
              placeholder="Select year"
            />
          </div>
          <div className="group">
            <label htmlFor="price" className="input-label">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative flex gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="h-full px-4 rounded-2xl border-2 border-gray-100 bg-white/80 
                    hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5
                    focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-400/20
                    transition-all duration-300 flex items-center gap-2 min-w-[120px]"
                >
                  <span className="text-lg">{selectedCurrency.flag}</span>
                  <span className="text-gray-700">{selectedCurrency.code}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isCurrencyOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                    {currencies.map((currency) => (
                      <button
                        key={currency.code}
                        type="button"
                        onClick={() => {
                          onChange({ ...data, currency: currency.code });
                          setIsCurrencyOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors
                          ${currency.code === selectedCurrency.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                      >
                        <span className="text-lg">{currency.flag}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{currency.code}</span>
                          <span className="text-xs text-gray-500">{currency.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="text-gray-500">{selectedCurrency.symbol}</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={priceInput}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input-field pl-8"
                  required
                  placeholder={`Enter price in ${selectedCurrency.code}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="group">
            <label htmlFor="mileage" className="input-label">
              Mileage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="mileage"
              name="mileage"
              value={mileageInput}
              onChange={handleChange}
              min="0"
              className="input-field"
              required
              placeholder="Enter mileage"
            />
            {showMileageWarning && (
              <div className="mt-3 animate-fadeIn">
                <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800">High Mileage Alert</h4>
                      <p className="mt-1 text-sm text-red-700">
                        This vehicle has over 100,000 miles. Consider a thorough inspection.
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-700">
                        <Lightbulb className="w-4 h-4" />
                        <span>Tip: Request detailed maintenance records</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="group">
            <label htmlFor="condition" className="input-label">
              Condition <span className="text-red-500">*</span>
            </label>
            <select
              id="condition"
              name="condition"
              value={data.condition}
              onChange={handleChange}
              className="select-field"
              required
            >
              <option value="Excellent">✨ Excellent - Like new condition</option>
              <option value="Good">👍 Good - Minor wear and tear</option>
              <option value="Fair">👌 Fair - Some repairs needed</option>
              <option value="Poor">⚠️ Poor - Significant repairs needed</option>
            </select>
          </div>
        </div>
      </div>

      {showVinWarning && (
        <div className="animate-fadeIn">
          <div className="rounded-xl bg-yellow-50 p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800">Proceed Without VIN?</h4>
                <p className="mt-1 text-sm text-yellow-700">
                  Without a VIN, we cannot verify the vehicle's history or authenticity. This may affect the buyer's trust and the sale process.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={proceedWithoutVin}
                    className="text-sm px-3 py-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                  >
                    Continue Without VIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVinWarning(false)}
                    className="text-sm px-3 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6">
        <button type="submit" className="btn-primary">
          Continue to Documents
        </button>
      </div>
    </form>
  );
}