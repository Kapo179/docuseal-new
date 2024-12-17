import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { getDocumentStatus } from '../services/docusealApi';

export function SigningStatus() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const templateId = sessionStorage.getItem('docuseal_template_id');
    if (!templateId) {
      setStatus('expired');
      setError('No signing session found');
      return;
    }

    const checkStatus = async () => {
      try {
        const result = await getDocumentStatus(templateId);
        if (result.status === 'completed') {
          setStatus('completed');
        } else if (result.status === 'expired') {
          setStatus('expired');
          setError(result.message || 'Signing session has expired');
        }
      } catch (err) {
        setStatus('expired');
        setError(err instanceof Error ? err.message : 'Failed to check signing status');
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    sessionStorage.removeItem('docuseal_template_id');
    navigate('/');
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md text-center">
        {status === 'pending' && (
          <div className="space-y-4">
            <div className="animate-spin w-16 h-16 mx-auto text-blue-500">
              <Loader className="w-full h-full" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Waiting for Signatures</h2>
            <p className="text-gray-600">
              The document has been sent to all parties for signing.
              You'll be notified once everyone has signed.
            </p>
          </div>
        )}

        {status === 'completed' && (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto text-green-500">
              <CheckCircle className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Signing Complete!</h2>
              <p className="mt-2 text-gray-600">
                All parties have successfully signed the document.
                You'll receive a copy via email shortly.
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="btn-primary"
            >
              Return to Home
            </button>
          </div>
        )}

        {status === 'expired' && (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto text-red-500">
              <AlertTriangle className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Something Went Wrong</h2>
              <p className="mt-2 text-gray-600">{error}</p>
            </div>
            <button
              onClick={handleContinue}
              className="btn-primary"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}