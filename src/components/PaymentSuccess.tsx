import { type FC } from 'react';
import { CheckCircle } from 'lucide-react';

interface PaymentSuccessProps {
  onContinue: () => void;
}

export const PaymentSuccess: FC<PaymentSuccessProps> = ({ onContinue }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-green-100 p-2 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
          <p className="text-sm text-gray-600">Your payment has been processed</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full btn-primary bg-gradient-to-r from-emerald-500 to-green-500 
          hover:from-emerald-600 hover:to-green-600"
      >
        Continue to Signing
      </button>
    </div>
  );
};