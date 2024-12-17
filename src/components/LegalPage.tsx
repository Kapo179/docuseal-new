import React from 'react';

const LegalPage: React.FC = () => {
  return (
    <div className="legal-page p-6">
      <h1 className="text-2xl font-bold mb-4">Legal Information</h1>
      <p>
        This is an example legal page. Here you can provide information about your terms of service, privacy policy, and other legal details.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Terms of Service</h2>
      <p>
        Your terms of service content goes here.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Privacy Policy</h2>
      <p>
        Your privacy policy content goes here.
      </p>
      {/* Add more legal sections as needed */}
    </div>
  );
};

export default LegalPage;