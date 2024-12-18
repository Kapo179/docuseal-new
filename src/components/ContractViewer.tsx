import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchContractData } from '../services/docusealApi';

export default function ContractViewer() {
  const { templateId } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        console.log('Fetching contract for templateId:', templateId);
        const data = await fetchContractData(templateId);
        console.log('API Response:', data);

        if (data.documents && data.documents[0]?.url) {
          setPdfUrl(data.documents[0].url);
        } else {
          throw new Error('No PDF URL found in API response.');
        }
      } catch (err) {
        console.error('Error fetching contract:', err);
        setError(`Error: ${err.message || 'Failed to load contract.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [templateId]);

  return (
    <div style={{ textAlign: 'center', margin: '20px' }}>
      <h1>Contract Viewer</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : pdfUrl ? (
        <iframe
          src={pdfUrl}
          width="100%"
          height="600px"
          style={{ border: '1px solid #ccc', borderRadius: '8px' }}
          title="Contract PDF"
        />
      ) : (
        <p>No contract available to display.</p>
      )}
    </div>
  );
}
