import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { fetchContractData } from '../services/docusealApi';

export default function ContractViewer() {
  const { templateId } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { createPaymentIntent, clientSecret } = usePaymentFlow();

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const data = await fetchContractData(templateId);
        if (data.documents && data.documents.length > 0) {
          setPdfUrl(data.documents[0].url); // PDF link provided by DocuSeal
        }
      } catch (error) {
        console.error('Error fetching contract:', error);
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
      <h1>Contract Viewer</h1>
      <div className="pdf-preview" style={{ width: '100%', maxWidth: '800px', height: '600px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            title="Contract PDF"
            style={{ border: 'none' }}
          />
        ) : (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>Loading contract...</p>
        )}
      </div>

      {/* DOWNLOAD BUTTON */}
      <div className="download-button" style={{ marginBottom: '16px' }}>
        {pdfUrl && (
          <a
            href={pdfUrl}
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