import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StripePaymentElement } from './StripePaymentElement';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { generatePDF } from '../services/pdfGenerator';

/**
 * This component:
 * 1. Fetches contract data (including a docuseal preview_image_url).
 * 2. Displays the preview image in a "beautiful container".
 * 3. Offers a subtle "Download PDF" button linking to the DocuSeal-generated PDF or a locally generated Blob.
 * 4. Shows the "Pay and Sign" button or Stripe element.
 */

export default function ContractViewer() {
  const { templateId } = useParams();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
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

        // Example data might be of form:
        // {
        //   formData: {...},
        //   previewImageUrl: "https://docuseal.com/file/.../0.png",
        //   docusealPdfUrl: "https://docuseal.com/file/.../Service Agreement.pdf"
        // }
        // If your netlify function or docuseal API call returns these fields, store them:
        if (data.previewImageUrl) {
          setPreviewUrl(data.previewImageUrl);
        }
        if (data.docusealPdfUrl) {
          setDocusealPdfUrl(data.docusealPdfUrl);
        }

        // Generate a local PDF if you still want to create one from formData
        if (data.formData) {
          const generatedPdfBlob = await generatePDF(data.formData);
          console.log('Generated PDF Blob size:', generatedPdfBlob.size);
          setPdfBlob(generatedPdfBlob);
        }
      } catch (error) {
        console.error('Error fetching contract data:', error);
      }
    };

    fetchContract();
  }, [templateId]);

  const handlePaymentSuccess = () => {
    console.log('Payment successful!');
    // Additional success logic here
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
  };

  // Helper to create a local "download" link if using the pdfBlob
  const downloadLocalPDF = () => {
    if (!pdfBlob) return;
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `contract-${templateId}.pdf`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="contract-viewer" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      
      {/* CONTRACT PREVIEW CONTAINER */}
      <div className="preview-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', border: '1px solid #ccc', padding: '16px', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '16px' }}>Contract Preview</h2>
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Contract Preview" 
            style={{ maxWidth: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        ) : (
          <p>No preview image available</p>
        )}
      </div>

      {/* DOWNLOAD & PAYMENT ACTIONS */}
      <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '400px' }}>
        
        {/* Download PDF Buttons */}
        {docusealPdfUrl && (
          <a
            href={docusealPdfUrl}
            download={`contract-${templateId}.pdf`}
            className="btn-secondary"
            style={{ textAlign: 'center', textDecoration: 'none', padding: '8px 16px', backgroundColor: '#efefef', borderRadius: '4px' }}
          >
            Download PDF from DocuSeal
          </a>
        )}

        {pdfBlob && (
          <button onClick={downloadLocalPDF} style={{ padding: '8px 16px' }}>
            Download Locally Generated PDF
          </button>
        )}

        {/* Payment Section */}
        {clientSecret ? (
          <StripePaymentElement
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={() => console.log('Payment cancelled')}
          />
        ) : (
          <button onClick={createPaymentIntent} className="btn-primary" style={{ padding: '8px 16px' }}>
            Pay and Sign
          </button>
        )}
      </div>
    </div>
  );
}
