import React from 'react';
import { Link } from 'react-router-dom';
import './Policy.css'; // Make sure this CSS file exists

const PrivacyPolicy = () => {
  return (
    <div className="privacy-page-container">
      <section className="privacy-intro">
        <h1>Privacy Policy</h1>
        <h2>Your Privacy, Our Priority</h2>
        <p>
          Welcome to <span className="privacy-highlight">CarthageChain</span>. Your privacy and the security of your data 
          are of utmost importance to us. This Privacy Policy explains how we collect, use, and protect your information.
        </p>
      </section>

      <section className="privacy-section">
        <h2>What Information We Collect</h2>
        <ul>
          <li><span className="privacy-highlight">Personal Information:</span> Name, email address, and other details required for account creation.</li>
          <li><span className="privacy-highlight">Blockchain Data:</span> Public wallet addresses for secure authentication.</li>
          <li><span className="privacy-highlight">Technical Data:</span> IP address, browser type, and device information for security purposes.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2>How We Use Your Data</h2>
        <ul>
          <li>To ensure secure voting processes using <span className="privacy-highlight">blockchain technology</span>.</li>
          <li>To improve user experience and platform functionality.</li>
          <li>To detect and prevent fraud or unauthorized access.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2>Data Protection & Security</h2>
        <p>We implement advanced security measures, including:</p>
        <ul>
          <li><span className="privacy-highlight">End-to-End Encryption:</span> Protecting your data from unauthorized access.</li>
          <li><span className="privacy-highlight">Blockchain Transparency:</span> Ensuring integrity through immutable records.</li>
          <li><span className="privacy-highlight">Smart Contract Security Audits:</span> Conducted regularly by industry experts.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2>Third-Party Services</h2>
        <p>
          We do not sell, trade, or rent your personal information. However, we may share data with trusted partners 
          for identity verification, analytics, and fraud prevention.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Your Rights & Control</h2>
        <ul>
          <li><span className="privacy-highlight">Access & Correction:</span> You can request access to your stored data.</li>
          <li><span className="privacy-highlight">Opt-Out:</span> Users can manage their privacy preferences within their account settings.</li>
          <li><span className="privacy-highlight">Data Deletion:</span> Upon request, we can remove your personal data unless legally required to retain it.</li>
        </ul>
      </section>

      <section className="privacy-section">
        <h2>Updates to This Policy</h2>
        <p>
          We may update this policy periodically to reflect technological advancements or legal requirements. 
          Any changes will be communicated to users.
        </p>
      </section>

      <section className="privacy-cta">
        <h2>Need More Information?</h2>
        <p>If you have questions about your privacy, feel free to reach out to us.</p>
        <div className="privacy-cta-buttons">
        <Link to="/contact" className="terms-button">
          <button>Contact Us</button>
        </Link>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
