import { Lock } from 'lucide-react';

export function SecurityBadge() {
  return (
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 rounded-lg p-2">
          <Lock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-blue-900">Secure Digital Signing 🔐</h3>
          <p className="text-sm text-blue-700 mt-1">
            Your contract will be securely stored and legally binding once signed
          </p>
        </div>
      </div>
    </div>
  );
}