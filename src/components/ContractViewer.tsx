import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";

export default function ContractViewer() {
  const { templateId } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Retrieve and decode cookie
      const contractData = Cookies.get("contractData");
      if (contractData) {
        const { pdfUrl, signedUrl } = JSON.parse(decodeURIComponent(contractData));
        setPdfUrl(pdfUrl);
        setSignedUrl(signedUrl);
      } else {
        throw new Error("No contract data found in cookies.");
      }
    } catch (err) {
      console.error("Error retrieving contract data:", err);
      setError("Failed to load contract data.");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  return (
    <div style={{ textAlign: "center", margin: "20px auto" }}>
      <h1>Contract Viewer</h1>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : pdfUrl ? (
        <>
          {/* Display PDF */}
          <iframe
            src={pdfUrl}
            width="100%"
            height="600px"
            title="Contract PDF"
            style={{ border: "1px solid #ccc", borderRadius: "8px" }}
          />
          <a
            href={pdfUrl}
            download="contract.pdf"
            style={{
              margin: "10px",
              padding: "10px 20px",
              backgroundColor: "#007BFF",
              color: "#FFF",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Download PDF
          </a>

          {/* Sign Link */}
          {signedUrl && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 20px",
                backgroundColor: "#28A745",
                color: "#FFF",
                textDecoration: "none",
                borderRadius: "4px",
              }}
            >
              Proceed to Sign
            </a>
          )}
        </>
      ) : (
        <p>No contract available.</p>
      )}
    </div>
  );
}
