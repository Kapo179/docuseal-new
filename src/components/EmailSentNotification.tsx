import { Mail } from 'lucide-react';

export function EmailSentNotification() {
  return (
    <div className="fixed top-4 right-4 max-w-sm bg-white rounded-xl shadow-lg border border-green-100 p-4 animate-fadeIn z-50">
      <div className="flex items-start gap-3">
        <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
          <Mail className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Email Sent Successfully</h3>
          <p className="text-sm text-gray-600 mt-1">
            The contract has been sent to the specified recipients.
          </p>
        </div>
      </div>
    </div>
  );
} 