import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase (ensure this is done in your project)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function ContractViewer() {
  const { docusealId } = useParams();
  const [docusealPdfUrl, setDocusealPdfUrl] = useState<string | null>(null);
  const { createPaymentIntent, clientSecret } = usePaymentFlow();

  useEffect(() => {
    const fetchContract = async () => {
      try {
        console.log(`Fetching contract data for templateId: ${docusealId}`);
        const doc = await db.collection('contracts').doc(docusealId).get();

        if (!doc.exists) {
          throw new Error('No such document!');
        }

        const data = doc.data();
        console.log('Fetched contract data:', data);

        // Assuming your Firestore document has a `documents` field with the PDF URL
        if (data?.documents && data.documents[0]?.url) {
          setDocusealPdfUrl(data.documents[0].url);
        } else {
          console.warn('No PDF URL found in fetched contract data.');
        }
      } catch (error) {
        console.error('Error fetching contract data:', error);
      }
    };

    fetchContract();
  }, [docusealId]);

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
            download={`contract-${docusealId}.pdf`}
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