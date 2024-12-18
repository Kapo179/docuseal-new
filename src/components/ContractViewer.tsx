import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

export default function ContractViewer() {
  const { templateId } = useParams();
  const [docusealPdfUrl, setDocusealPdfUrl] = useState<string | null>(null);
  const { createPaymentIntent, clientSecret } = usePaymentFlow();

  useEffect(() => {
    const fetchContract = async () => {
      try {
        console.log(`Fetching contract data for templateId: ${templateId}`);
        const response = await fetch(`/api/contracts/${templateId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch contract data (status: ${response.status})`);
        }

        const data = await response.json();
        console.log('Fetched contract data:', data);

        // Assuming your API returns a `docusealPdfUrl` field with the PDF URL
        if (data.docusealPdfUrl) {
          setDocusealPdfUrl(data.docusealPdfUrl);
        } else {
          console.warn('No PDF URL found in fetched contract data.');
        }
      } catch (error) {
        console.error('Error fetching contract data:', error);
      }
    };

    fetchContract();
  }, [templateId]);

  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    // Add success handling logic here
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="contract-viewer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      
      {/* PDF PREVIEW CONTAINER */}
      <div className="pdf-preview" style={{ width: '100%', maxWidth: '800px', height: '600px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Contract PDF</h2>
        {docusealPdfUrl ? (
          <iframe
            src={docusealPdfUrl}
            width="100%"
            height="100%"
            title="Contract PDF"
            style={{ border: 'none' }}
          />
        ) : (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>Loading PDF...</p>
        )}
      </div>

      {/* DOWNLOAD BUTTON */}
      <div className="download-button" style={{ marginBottom: '16px' }}>
        {docusealPdfUrl && (
          <a
            href={docusealPdfUrl}
            download={`contract-${templateId}.pdf`}
            className="btn-download"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#007BFF',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Download PDF
          </a>
        )}
      </div>

      {/* PAYMENT SECTION */}
      <div className="payment-section" style={{ width: '100%', maxWidth: '400px', marginTop: '20px' }}>
        {clientSecret ? (
          <StripePaymentElement
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={() => console.log('Payment cancelled')}
          />
        ) : (
          <button
            onClick={createPaymentIntent}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '10px 20px',
              backgroundColor: '#28A745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Pay and Sign
          </button>
        )}
      </div>
    </div>
  );
}
