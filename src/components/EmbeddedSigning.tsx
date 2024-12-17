import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  signingUrl: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function EmbeddedSigning({ signingUrl, onComplete, onError }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!signingUrl) {
      setError('No signing URL provided');
      onError?.(new Error('No signing URL provided'));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Verify the message origin matches DocuSeal's domain
      if (!event.origin.includes('docuseal.com')) return;

      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'SIGNING_COMPLETE') {
          onComplete?.();
          navigate('/signing-status');
        } else if (data.type === 'SIGNING_DECLINED') {
          setError('Signing was declined');
          onError?.(new Error('Signing declined'));
        } else if (data.type === 'SIGNING_ERROR') {
          setError(data.message || 'An error occurred during signing');
          onError?.(new Error(data.message));
        }
      } catch (err) {
        console.error('Failed to parse signing message:', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [signingUrl, navigate, onComplete, onError]);

  if (!signingUrl) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading signing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={signingUrl}
        className="w-full min-h-[600px] rounded-lg border border-gray-200 bg-white"
        allow="camera"
      />
    </div>
  );
}