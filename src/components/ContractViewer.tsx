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
        const response = await fetch(`/api/contracts/${templateId}`);
        const data = await response.json();
        
        // Generate a PDF blob from the contract data
        const pdfBlob = await generatePDF(data.formData);
        setPdfData(pdfBlob);
      } catch (error) {
        console.error('Error fetching contract:', error);
      }
    };

    fetchContract();
  }, [templateId]);

  const handlePaymentSuccess = () => {
    // Handle payment success logic (e.g. saving to database, redirect, etc.)
    console.log('Payment successful!');
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="contract-viewer" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PDF Section */}
      <div className="pdf-section" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        {pdfData ? (
          <iframe
            src={URL.createObjectURL(pdfData)}
            width="100%"
            height="600"
            title="Contract Preview"
          />
        ) : (
          <p>Loading contract...</p>
        )}
      </div>

      {/* Payment Section */}
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
