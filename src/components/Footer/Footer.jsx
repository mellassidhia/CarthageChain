import { Link } from "react-router-dom";
import "./Footer.css";
import { assets } from "../../assets/assets";
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo-container">
            <img
              src={assets.logo}
              alt="CarthageChain Logo"
              className="logo-image"
            />
          </div>
          <span className="brand-name">CarthageChain</span>
        </div>

        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/security">Security</Link>
          <Link to="/policy">Privacy Policy</Link>
          <Link to="/terms-of-use">Terms of Service</Link>
        </div>
        <div className="footer-actions">
          <div className="social-links">
            <a href="https://twitter.com/carthagechain" aria-label="Twitter">
              <svg
                className="footer-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
            <a
              href="https://github.com/mellassidhia/carthagechain"
              aria-label="GitHub"
            >
              <svg
                className="footer-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            <a href="https://discord.gg/carthagechain" aria-label="Discord">
              <svg
                className="footer-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 9a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v5a5 5 0 0 0 5 5h1l1-2h2l1 2h1a5 5 0 0 0 5-5V9Z"></path>
                <path d="M8 12h0.01"></path>
                <path d="M16 12h0.01"></path>
              </svg>
            </a>
          </div>

          <Link to="/contact" className="contact-button">
            Contact Us
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} CarthageChain. All rights reserved.</p>
        <p>Secured by blockchain technology</p>
      </div>
    </footer>
  );
};

export default Footer;
