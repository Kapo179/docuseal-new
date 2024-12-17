import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { generatePDF } from '../services/pdfGenerator';

export default function ContractViewer() {
  const { templateId } = useParams();
  const [pdfData, setPdfData] = useState<Blob | null>(null);
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

        // Now generate the PDF blob from the contract data
        if (!data.formData) {
          console.warn('No formData found in fetched contract data.');
          return;
        }

        const pdfBlob = await generatePDF(data.formData);
        console.log('PDF Blob size:', pdfBlob.size);

        setPdfData(pdfBlob);
      } catch (error) {
        console.error('Error fetching/generating contract PDF:', error);
      }
    };

    fetchContract();
  }, [templateId]);

  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    // Additional success handling (redirect or mark contract as paid)
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="contract-viewer" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PDF SECTION */}
      <div className="pdf-section" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        {pdfData ? (
          <iframe
            src={URL.createObjectURL(pdfData)}
            width="100%"
            height="600"
            title="Contract PDF Preview"
          />
        ) : (
          <p>Loading contract...</p>
        )}
      </div>

      {/* PAYMENT SECTION */}
      <div className="payment-section" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        {clientSecret ? (
          <StripePaymentElement 
            onSuccess={handlePaymentSuccess} 
            onError={handlePaymentError} 
            onCancel={() => console.log('Payment cancelled')} 
          />
        ) : (
          <button onClick={createPaymentIntent} className="btn-primary">
            Pay and Sign
          </button>
        )}
      </div>
    </div>
  );
}
