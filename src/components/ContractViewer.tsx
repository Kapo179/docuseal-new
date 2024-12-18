import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { fetchContractData } from '../services/docusealApi';

export default function ContractViewer() {
  const { templateId } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const { createPaymentIntent, clientSecret } = usePaymentFlow();

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const data = await fetchContractData(templateId);
        if (data.pdfUrl) {
          setPdfUrl(data.pdfUrl);
        } else {
          throw new Error("No PDF URL found in response.");
        }

        // Store the signing link for the paywall
        if (data.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [templateId]);

  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    setPaymentCompleted(true);
  };

  const handlePaymentError = (err: Error) => {
    console.error('Payment error:', err);
  };

  return (
    <div style={{ textAlign: 'center', margin: '20px auto' }}>
      <h1>Contract Preview</h1>

      {/* PDF Preview */}
      {loading ? (
        <p>Loading contract...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : pdfUrl ? (
        <>
          <iframe
            src={pdfUrl}
            width="100%"
            height="600px"
            title="Contract PDF Preview"
            style={{ border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}
          />

          {/* Download PDF */}
          <a
            href={pdfUrl}
            download={`contract-${templateId}.pdf`}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007BFF',
              color: '#FFF',
              textDecoration: 'none',
              borderRadius: '4px',
              marginRight: '10px',
              display: 'inline-block',
            }}
          >
            Download PDF
          </a>

          {/* Paywall Section */}
          {!paymentCompleted ? (
            <div style={{ marginTop: '20px' }}>
              <h3>Pay to Proceed with Signing</h3>
              {clientSecret ? (
                <StripePaymentElement
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              ) : (
                <button
                  onClick={createPaymentIntent}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28A745',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Pay and Unlock Signing
                </button>
              )}
            </div>
          ) : (
            signedUrl && (
              <div style={{ marginTop: '20px' }}>
                <h3>Sign Your Contract</h3>
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28A745',
                    color: '#FFF',
                    textDecoration: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Go to Sign
                </a>
              </div>
            )
          )}
        </>
      ) : (
        <p>No contract available to display.</p>
      )}
    </div>
  );
}