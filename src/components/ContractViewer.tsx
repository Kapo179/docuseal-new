import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { generatePDF } from '../services/pdfGenerator';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

export default function ContractViewer() {
  const { templateId } = useParams();
  const [pdfData, setPdfData] = useState<Blob | null>(null);
  const { createPaymentIntent, clientSecret } = usePaymentFlow();

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/contracts/${templateId}`);
        const data = await response.json();
        const pdfBlob = await generatePDF(data.formData);
        setPdfData(pdfBlob);
      } catch (error) {
        console.error('Error fetching contract:', error);
      }
    };

    fetchContract();
  }, [templateId]);

  const handlePaymentSuccess = () => {
    // Handle payment success
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="contract-viewer">
      {pdfData && (
        <PDFViewer>
          <iframe src={URL.createObjectURL(pdfData)} width="100%" height="600px" />
        </PDFViewer>
      )}
      <div className="payment-section">
        {clientSecret ? (
          <StripePaymentElement 
            onSuccess={handlePaymentSuccess} 
            onError={handlePaymentError} 
            onCancel={() => console.log('Payment cancelled')} // Add onCancel prop
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