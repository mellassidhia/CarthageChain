import React from 'react';
import './Security.css';

const Security = () => {
  return (
    <div className="security-page-container">
      {/* Intro Section */}
      <section className="security-intro">
        <h1>Security at CarthageChain</h1>
        <h2>Blockchain-Powered, Secure, and Trustworthy Elections</h2>
        <p>
          At <span className="security-highlight">CarthageChain</span>, security is our top priority. 
          We utilize <span className="security-highlight">advanced cryptographic algorithms </span> and 
          <span className="security-highlight"> blockchain technology </span> to ensure 
          <strong> vote integrity, transparency, and privacy.</strong>
        </p>
      </section>

      {/* Security Features */}
      <section className="security-features">
        <h2>How We Secure Your Vote</h2>
        <div className="security-features-container">
          <div className="security-feature-card">
            <h3>🔒 End-to-End Encryption</h3>
            <p>Votes are secured using <span className="security-highlight">AES-256 encryption </span> 
            and <span className="security-highlight">zero-knowledge proofs </span> to protect voter privacy.</p>
          </div>
          <div className="security-feature-card">
            <h3>⚡ Secure Smart Contracts</h3>
            <p>Multi-signature smart contracts ensure <span className="security-highlight">tamper-proof</span> elections
            and prevent unauthorized access.</p>
          </div>
          <div className="security-feature-card">
            <h3>🛡️ Decentralized Identity Verification</h3>
            <p>We implement <span className="security-highlight">Decentralized Identity (DID) </span> 
            standards for voter authentication without central databases.</p>
          </div>
        </div>
      </section>

      {/* Protection Section */}
      <section className="security-protection">
        <h2>Additional Security Measures</h2>
        <ul>
          <li><span className="security-highlight">Tamper-Proof Blockchain</span> – Once a vote is cast, it is permanently stored.</li>
          <li><span className="security-highlight">Zero-Knowledge Proofs</span> – Maintain voter privacy while proving authenticity.</li>
          <li><span className="security-highlight">AI Fraud Detection</span> – Machine learning identifies suspicious activity in real-time.</li>
        </ul>
      </section>

      {/* Compliance & Audits */}
      <section className="security-compliance">
        <h2>Regulatory Compliance & Security Audits</h2>
        <p className='regulatory-paragraph'>We adhere to global security standards and undergo regular audits:</p>
        <ul>
          <li><span className="security-highlight">ISO/IEC 27001</span> – International security compliance.</li>
          <li><span className="security-highlight">GDPR Compliance</span> – Ensures voter data privacy.</li>
          <li><span className="security-highlight">Smart Contract Audits</span> – Independent blockchain security assessments.</li>
        </ul>
      </section>

      {/* CTA Section */}
      <section className="security-cta">
        <h2>Trust in Secure Elections</h2>
        <p>We are committed to ensuring free, fair, and secure elections using blockchain technology.</p>
      </section>
    </div>
  );
};

export default Security;
