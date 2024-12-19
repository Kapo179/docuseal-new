import React from 'react';

const LegalPage: React.FC = () => {
  return (
    <div className="legal-page p-6">
      <h1 className="text-2xl font-bold mb-4">Legal Information</h1>


    <title>Privacy Policy</title>

    <h1>Privacy Policy</h1>
    <p><strong>Effective Date:</strong> 19/12/2024</p>

    <p>Welcome to ContractQuickly. Your privacy is of the utmost importance to us. This Privacy Policy outlines how ContractQuickly operates, what data we handle, and your rights as a user of our service. By using ContractQuickly, you agree to the terms outlined in this Privacy Policy.</p>

    <div >
        <h2>1. Data Collection</h2>
        <p>ContractQuickly is committed to maintaining your privacy. We do not collect, store, or sell any personal data or information. Specifically:</p>
        <ul>
        <li><strong>No Legal Advcice</strong> We do not advise on any legal matter or provide legal advice, Nor request users to input personal data, when generating contracts templates with our plugin.</li>
            <li><strong>No User Data Collection:</strong> We do not collect or store user-provided information, including but not limited to names, email addresses, or contract details.</li>
            <li><strong>No Tracking:</strong> We do not use cookies, tracking technologies, or analytics tools to monitor your usage of our platform.</li>
            <li><strong>No Data Retention:</strong> ContractQuickly does not retain any personal or contractual data that passes through our platform.</li>
        </ul>
    </div>

    <div >
        <h2>2. Third-Party API Integration</h2>
        <p>ContractQuickly integrates with the DocuSeal API to generate contracts efficiently. While using ContractQuickly:</p>
        <ul>
            <li>Contract data, including information you input (such as names, email addresses, and contract terms), is securely transmitted to the DocuSeal API for processing.</li>
            <li>ContractQuickly does not intercept, retain, or access any data sent to DocuSeal.</li>
        </ul>
        <p>For information about DocuSeal’s data handling practices, please refer to their Privacy Policy at <a href="https://www.docuseal.com/privacy">docuseal.com</a>.</p>
    </div>

    <div>
        <h2>3. Subject Access Requests</h2>
        <p>ContractQuickly does not store or manage any personal data and therefore cannot process Subject Access Requests (SARs). If you would like to make a SAR or exercise your data rights, please contact DocuSeal’s support team:</p>
        <ul>
            <li>Email: <a href="mailto:support@docuseal.com">support@docuseal.com</a></li>
            <li>Website: <a href="https://www.docuseal.com/privacy">docuseal.com</a></li>
        </ul>
    </div>

    <div>
        <h2>4. Data Security</h2>
        <p>Although ContractQuickly does not store user data, we take steps to ensure secure transmission of all information to the DocuSeal API. These measures include:</p>
        <ul>
            <li><strong>Secure Communication:</strong> Data is transmitted via HTTPS to ensure encryption during transit.</li>
            <li><strong>No Local Storage:</strong> ContractQuickly does not save user input or contract data locally or on our servers.</li>
        </ul>
    </div>

    <div>
        <h2>5. Compliance with OpenAI’s Usage Policies</h2>
        <p>ContractQuickly abides by the following ethical principles:</p>
        <ul>
            <li><strong>No Unauthorized Data Collection:</strong> We do not scrape, collect, or use data without user consent.</li>
            <li><strong>No Misuse of Technology:</strong> ContractQuickly’s services are not designed to generate or process illegal, harmful, or unethical content. Any misuse of our services to create fraudulent or malicious contracts is strictly prohibited.</li>
            <li><strong>User Responsibility:</strong> Users are responsible for ensuring that the data and content they input into ContractQuickly comply with applicable laws and ethical standards.</li>
        </ul>
    </div>

    <div>
        <h2>6. Legal Compliance</h2>
        <p>ContractQuickly operates in accordance with applicable privacy and data protection laws, including but not limited to:</p>
        <ul>
            <li>The General Data Protection Regulation (GDPR) for users within the European Economic Area (EEA).</li>
            <li>The California Consumer Privacy Act (CCPA) for users in California.</li>
        </ul>
        <p>Because we do not collect or process user data, ContractQuickly is exempt from many obligations under these regulations. However, any data processed by DocuSeal falls under their compliance responsibilities.</p>
    </div>

    <div>
        <h2>7. Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy periodically to reflect changes in our practices or for other operational, legal, or regulatory reasons. Any updates will be posted on this page with the updated effective date.</p>
    </div>

    <div>
        <h2>8. Contact Information</h2>
        <p>For questions about this Privacy Policy or how ContractQuickly operates, you can reach us at:</p>
        <ul>
            <li>Email: <a href="mailto:Team@blueswissgroup.com">Team@blueswissgroup.com</a></li>
            <li>Website: <a href="https://contractquickly.com">contractquickly.com</a></li>
        </ul>
        <p>For DocuSeal-specific inquiries or data requests, please contact DocuSeal directly:</p>
        <ul>
            <li>Email: <a href="mailto:support@docuseal.com">support@docuseal.com</a></li>
            <li>Website: <a href="https://docuseal.com">docuseal.com</a></li>
        </ul>
    </div>

    <p>Thank you for using ContractQuickly. We are committed to protecting your privacy and ensuring a seamless and secure user experience.</p>



    </div>
  );
};

export default LegalPage;