import React from 'react';
import './Support.css';
import { Link } from 'react-router-dom';

const SupportPage = () => {
  return (
    <div className="support-container">
      {/* Top PNG Illustration */}
      <div className="top-illustration">
        <img src="/support.png" alt="Support Banner" />
      </div>

      {/* Emotional Line for Farmers */}
      <h2 className="support-tagline">
        "आपकी मेहनत धरती को सोना बनाती है, हम हमेशा आपके साथ हैं।"
      </h2>

      {/* Description */}
      <p className="support-description">
        For any kind of help, choose from the options below:
      </p>

      {/* Support Buttons */}
      <div className="support-buttons">
        <Link to="/help-support" className="support-btn">Help & Support</Link>
        <Link to="/legal-privacy" className="support-btn">Legal & Privacy Policy</Link>
        <Link to="/about-us" className="support-btn">About Us</Link>
      </div>
    </div>
  );
};

export default SupportPage;
