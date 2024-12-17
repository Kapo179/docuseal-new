import { type FC, useState } from 'react';
import { type FormStep, type FormData, type Currency } from '../types';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { StepIndicator } from './StepIndicator';
import { Car, ArrowLeft } from 'lucide-react';
import LegalAdvicePromo from './LegalAdvicePromo';
import VehicleForm from './VehicleForm';
import DocumentForm from './DocumentForm';
import VerificationForm from './VerificationForm';
import ReviewForm from './ReviewForm';

const initialData: FormData = {
  vin: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  mileage: 0,
  price: 0,
  currency: 'USD' as Currency,
  condition: 'Good',
  registration: false,
  insurance: false,
  inspection: false,
  signature: '',
  privacyAccepted: false,
};

interface Props {
  onReset: () => void;
  currentStep: FormStep;
  onStepChange: (step: FormStep) => void;
}

export const VehicleAgreement: FC<Props> = ({ onReset, currentStep, onStepChange }) => {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { clearSavedData } = useFormPersistence(formData, setFormData);

  const handleSubmit = () => {
    console.log('Generating agreement:', formData);
    clearSavedData();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md transform transition-all duration-500 scale-100 opacity-100">
        <div className="form-card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 mb-6">
            <Car className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Agreement Generated!
          </h2>
          <p className="text-gray-600 mb-8">
            Your vehicle sales agreement has been generated successfully.
            You can now download and use it for your sale.
          </p>
          <button
            onClick={() => {
              setFormData(initialData);
              onStepChange('verification');
              setIsSubmitted(false);
            }}
            className="btn-primary"
          >
            Generate Another Agreement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="px-4 pt-6 pb-2">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contract Selection
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-4">
          <div className="bg-blue-500 p-3 rounded-xl">
            <Car className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Generate Vehicle Sales Agreement
        </h1>
        <p className="mt-2 text-gray-600">Generate a legally binding vehicle sales contract in minutes</p>
      </div>

      <div className="relative">
        <div className="form-card mb-6">
          <StepIndicator currentStep={currentStep} />

          <div className="max-w-2xl mx-auto">
            {currentStep === 'verification' && (
              <VerificationForm
                onNext={() => onStepChange('vehicle')}
              />
            )}

            {currentStep === 'vehicle' && (
              <VehicleForm
                data={formData}
                onChange={(data) => setFormData({ ...formData, ...data })}
                onNext={() => onStepChange('documents')}
              />
            )}

            {currentStep === 'documents' && (
              <DocumentForm
                data={formData}
                onChange={(data) => setFormData({ ...formData, ...data })}
                onNext={() => onStepChange('review')}
                onBack={() => onStepChange('vehicle')}
              />
            )}

            {currentStep === 'review' && (
              <ReviewForm
                data={formData}
                onSubmit={handleSubmit}
                onBack={() => onStepChange('documents')}
              />
            )}
          </div>
        </div>

        <LegalAdvicePromo />
      </div>
    </div>
  );
}