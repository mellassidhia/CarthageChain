import React from 'react';
import './TermsOfService.css'; // Ensure the CSS file is included
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="terms-page-container">
      <section className="terms-intro">
        <h1>Terms of Service</h1>
        <h2>Understanding Your Rights & Responsibilities</h2>
        <p>
          Welcome to <span className="terms-highlight">CarthageChain</span>. These Terms of Service outline 
          the rules and guidelines for using our platform.
        </p>
      </section>

      <section className="terms-section">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using CarthageChain, you agree to comply with these terms.</p>
      </section>

      <section className="terms-section">
        <h2>2. User Responsibilities</h2>
        <ul>
          <li>Users must provide accurate information during registration.</li>
          <li>Unauthorized access or tampering with the system is strictly prohibited.</li>
          <li>Users must respect the voting process and avoid fraudulent activities.</li>
        </ul>
      </section>

      <section className="terms-section">
        <h2>3. Prohibited Activities</h2>
        <ul>
          <li><span className="terms-highlight">No hacking:</span> Attempts to compromise the system will result in legal action.</li>
          <li><span className="terms-highlight">No manipulation:</span> Any form of vote tampering is strictly forbidden.</li>
          <li><span className="terms-highlight">No data misuse:</span> Personal data must not be misused or shared without consent.</li>
        </ul>
      </section>

      <section className="terms-section">
        <h2>4. Security & Privacy</h2>
        <p>
          We implement <span className="terms-highlight">blockchain security</span> and  <span className="terms-highlight">end-to-end encryption </span>
          to protect your data. Please refer to our Privacy Policy for details.
        </p>
      </section>

      <section className="terms-section">
        <h2>5. Changes to These Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Users will be notified of 
          significant changes.
        </p>
      </section>

      <section className="terms-section">
        <h2>6. Contact Us</h2>
        <p>If you have any questions about these Terms of Service, feel free to reach out to us.</p>
      </section>

      <section className="terms-cta">
        <h2>Agree to Our Terms?</h2>
        <p>By continuing to use our platform, you acknowledge and agree to these terms.</p>
        <div className="terms-cta-buttons">
          <Link to="/contact" className="terms-button">
          <button>Contact Support</button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
