import React from 'react';
import { Link } from 'react-router-dom';
import { assets } from "../../assets/assets";
import './Home.css';

const HomePage = () => {
  const components = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      ),
      title: 'Identity and Key Management'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      title: 'Secure Blockchain API Queries'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      title: 'Loading & Verification of Application Code'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
      title: 'Database Caching'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="10" y1="12" x2="16" y2="12" />
          <line x1="10" y1="16" x2="16" y2="16" />
          <line x1="10" y1="20" x2="16" y2="20" />
        </svg>
      ),
      title: 'Off-Chain Data Storage'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="6" height="6" rx="1" />
          <rect x="16" y="5" width="6" height="6" rx="1" />
          <rect x="9" y="13" width="6" height="6" rx="1" />
          <line x1="5" y1="11" x2="5" y2="13" />
          <line x1="19" y1="11" x2="19" y2="13" />
          <line x1="12" y1="5" x2="12" y2="13" />
        </svg>
      ),
      title: 'Services Network'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <path d="M13 8l4 4-4 4" />
        </svg>
      ),
      title: 'Simple Cryptography API\'s'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      title: 'Interface Documentation'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: 'User-to-User Networking'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      title: 'Establishment & Authentication of Network Connections'
    }
  ];

  return (
    <div className="home-page">
      
      <main className="home-content">
            <section className="hero-section">
              <div className="hero-content">
                <h1>VOTE! Let Your Voice Be Heard!</h1>
                <div className="hero-cta-buttons">
                  <Link to="voter-form"><button className="hero-cta-button">Become Voter</button></Link>
                  <Link to="candidate-form"><button className="hero-cta-button">Become Candidate</button></Link>
                </div>
              </div>
              <div className="hero-image">
                <img src={assets.home_page} alt="Home Page" className="hero-image" />
              </div>
            </section>
            <section className="about-section">
      <h2>Revolutionizing Democracy with CarthageChain</h2>
      <p className="about-description">
        CarthageChain is a cutting-edge blockchain voting platform designed to transform electoral processes through decentralized technology. 
        Our solution leverages Ethereum smart contracts to create tamper-proof, end-to-end verifiable voting systems that ensure unprecedented 
        security and transparency. By immutably recording votes on the blockchain, we eliminate fraud risks while maintaining voter anonymity 
        through advanced cryptographic protocols. Designed for governments, organizations, and institutions, our platform enables real-time 
        election tracking, instant result verification, and accessible remote voting - all through an intuitive interface. With features 
        including MetaMask integration for secure authentication, real-time analytics dashboards, and AI-powered anomaly detection, 
        CarthageChain bridges the gap between technological innovation and democratic integrity.
      </p>
    </section>
    <section className="features-section">
      <h2>Our Features</h2>
      <div className="features-grid">
        <div className="feature-card">
          <h3>Real-Time Vote Verification</h3>
          <p>Ensure your vote is counted and verified in real-time.</p>
        </div>
        <div className="feature-card">
          <h3>Blockchain Security</h3>
          <p>Experience the highest level of security with blockchain technology.</p>
        </div>
        <div className="feature-card">
          <h3>User-Friendly Interface</h3>
          <p>Navigate our platform with ease and confidence.</p>
        </div>
      </div>
    </section>   
    <section className="new-paradigm-section">
      <h2>A More Secure And Supportive Paradigm Is Necessary</h2>
      <div className="paradigm-grid">
        <div className="paradigm-card">
          <h3>The Solution</h3>
          <p>A new paradigm for internet applications, Secure and robust protocols, Discoverability and peer-to-peer connectivity, Enhanced understandability and flexibility.</p>
        </div>
        <div className="paradigm-card">
          <h3>A New Platform</h3>
          <p>Uses the best ideas from existing technology, Secure blockchain-based back-ends, Entire pathway to front-end and runtime secured to standard of back-end.</p>
        </div>
        <div className="paradigm-card">
          <h3>New possibilities</h3>
          <p>High security and privacy support new finance and governance paradigms, Peer-to-peer connectivity facilitates human connection and expression, User-oriented architecture protects data and privacy.</p>
        </div>
      </div>
    </section>  
    <div className="core-components-container">
      <h1 className="core-components-title">The Core Components</h1>
      <div className="core-components-grid">
        {components.map((component, index) => (
          <div className="component-card" key={index}>
            <div className="component-icon">
              {component.icon}
            </div>
            <h3 className="component-title">{component.title}</h3>
          </div>
        ))}
      </div>
    </div>      
    <section className="testimonials-section">
      <h2>Trusted by Leading Organizations</h2>
      <div className="testimonials-container">
        <div className="testimonial">
          <div className="testimonial-header">
            <div className="author-info">
              <p className="author-name">Amira Ben Salah</p>
              <p className="author-title">Chief Technology Officer<br/>TechCorp</p>
            </div>
          </div>
          <p className="testimonial-text">
            "CarthageChain's blockchain solution helped us achieve unprecedented transparency and efficiency 
            in our internal voting systems, leading to higher employee participation and greater trust in our decision-making processes."
          </p>
        </div>

        <div className="testimonial">
          <div className="testimonial-header">
            <div className="author-info">
              <p className="author-name">Dr. Kwame Asante</p>
              <p className="author-title">Founder & CEO<br/>Innovate-X</p>
            </div>
          </div>
          <p className="testimonial-text">
            "We've reduced costs and increased accessibility with CarthageChain's blockchain-based voting system. Their 
            secure and transparent process allows us to host virtual shareholder meetings with complete confidence."
          </p>
        </div>

        <div className="testimonial">
          <div className="testimonial-header">
            <div className="author-info">
              <p className="author-name">Maria González</p>
              <p className="author-title">Director of Operations<br/>Ethica Initiative</p>
            </div>
          </div>
          <p className="testimonial-text">
            "CarthageChain’s decentralized architecture and transparent ledger have transformed how we conduct 
            internal governance. We now run our member elections with complete verifiability and zero risk of manipulation."
          </p>
        </div>
      </div>
    </section>          
    <section className="call-cta-section">
      <h2>Get Started with CarthageChain</h2>
      <br />
      <Link to="/voter-form"><button className="call-cta-button">Register Now</button></Link>
      
    </section>

      </main>
    </div>
  );
};

export default HomePage;