import React, { useState } from 'react';
import './ContactUs.css'; // Ensure the CSS file is included

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="contact-page-container">
      <section className="contact-intro">
        <h1>Contact Us</h1>
        <h2>We'd love to hear from you!</h2>
        <p>If you have any questions, feedback, or need support, feel free to reach out to us.</p>
      </section>

      {/* Contact Form */}
      <section className="contact-form-section">
        <h2>Send Us a Message</h2>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Your Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Your Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <button type="submit">Send Message</button>
        </form>
      </section>

      {/* Contact Info */}
      <section className="contact-info">
        <h2>Other Ways to Reach Us</h2>
        <p>Email: <span className="highlight">support@carthagechain.com</span></p>
        <p>Phone: <span className="highlight">+216 99 123 456</span></p>
        <p>Address: <span className="highlight">Tunis, Tunisia</span></p>
      </section>
    </div>
  );
};

export default ContactUs;
