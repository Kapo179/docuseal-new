import { Mail, X } from 'lucide-react';

interface Props {
  show: boolean;
  onClose: () => void;
}

export function EmailNotification({ show, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 max-w-sm bg-white rounded-xl shadow-lg border border-blue-100 p-4 animate-fadeIn z-50">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Check Your Email</h3>
          <p className="text-sm text-gray-600 mt-1">
            We've sent the signing link to your email address. Please check your inbox and spam folder.
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
