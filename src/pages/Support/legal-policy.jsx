import React, { useState } from 'react';
import './legal-policy.css';

const LegalPolicy = () => {
  const [activeTab, setActiveTab] = useState('privacy');
  const effectiveDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="legal-policy-container">
      <header className="policy-header">
        <h1>Ankurit Legal Policies</h1>
        <p className="effective-date">Effective Date: {effectiveDate}</p>
      </header>

      <div className="policy-tabs">
        <button 
          className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          Privacy Policy
        </button>
        <button 
          className={`tab-button ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          Terms & Conditions
        </button>
      </div>

      <div className="policy-content">
        {/* Privacy Policy */}
        {activeTab === 'privacy' && (
          <section id="privacy-policy" className="policy-section active">
            <div className="section-intro">
              <h2>Privacy Policy</h2>
              <p>Welcome to Ankurit ("we", "us", "our"). We deeply value your trust and are committed to safeguarding your personal information.</p>
              <p>By using Ankurit's website, mobile app, or services ("Platform"), you consent to this Privacy Policy.</p>
            </div>

            <div className="policy-article">
              <h3>1. Information We Collect</h3>
              <p>We collect information to provide better services, including:</p>
              
              <h4>a. Personal Information</h4>
              <ul>
                <li>Name, Email, Phone Number, Address, Profile Picture</li>
                <li>Nursery or Business Name</li>
                <li>Product Listings & Descriptions</li>
                <li>Location Details (for targeted product visibility)</li>
              </ul>
              
              <h4>b. Transactional Information</h4>
              <ul>
                <li>Products listed, purchased, or sold</li>
                <li>Subscription Plan Details & Payment History (if applicable)</li>
              </ul>
              
              <h4>c. Device & Technical Information</h4>
              <ul>
                <li>Device Type, IP Address, Browser Info, Cookies</li>
                <li>Log Data (usage patterns, clicks, page visits, etc.)</li>
              </ul>
              
              <h4>d. Communication Data</h4>
              <ul>
                <li>Messages exchanged via email, WhatsApp, or SMS for order coordination</li>
                <li>Customer Support Interactions</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>2. How We Use Your Information</h3>
              <p>We use your information for:</p>
              <ul>
                <li>Creating and maintaining your account</li>
                <li>Facilitating buying and selling between farmers & nurseries</li>
                <li>Sending notifications via WhatsApp, SMS, and Email</li>
                <li>Improving Platform services & analyzing usage trends</li>
                <li>Ensuring security and preventing fraud</li>
                <li>Marketing & promotional activities (with consent)</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>3. How We Share Your Information</h3>
              <p>We never sell your personal information. However, we may share data:</p>
              <ul>
                <li><strong>With Other Users:</strong> To facilitate transactions, limited data (name, phone, nursery info) is shared.</li>
                <li><strong>Service Providers:</strong> For technical, hosting, payment, or communication services.</li>
                <li><strong>Legal Compliance:</strong> If required by law or to protect rights & safety.</li>
                <li><strong>Business Transfers:</strong> If Ankurit is merged or sold, your data may be transferred.</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>4. Data Retention</h3>
              <p>We retain your data as long as necessary to:</p>
              <ul>
                <li>Provide services</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              <p>You may request deletion of your data anytime (subject to legal exceptions).</p>
            </div>

            <div className="policy-article">
              <h3>5. Your Rights</h3>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Request correction or deletion</li>
                <li>Withdraw consent for specific uses</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              <p>Requests can be sent to: <a href="mailto:support@ankurit.in">support@ankurit.in</a></p>
            </div>

            <div className="policy-article">
              <h3>6. Security</h3>
              <p>We implement strong security measures including:</p>
              <ul>
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure storage via trusted cloud services</li>
                <li>Regular security audits and access controls</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>7. Children's Privacy</h3>
              <p>Our platform is not intended for children under 18. We do not knowingly collect data from minors.</p>
            </div>

            <div className="policy-article">
              <h3>8. Policy Updates</h3>
              <p>We may update this policy. Changes will be notified via email or on the Platform.</p>
            </div>

            <div className="policy-article contact-info">
              <h3>9. Contact Us</h3>
              <p>For questions or concerns:</p>
              <ul>
                <li>Email: <a href="mailto:support@ankurit.in">support@ankurit.in</a></li>
                <li>Phone: [Insert Phone]</li>
                <li>Address: [Insert Registered Business Address]</li>
              </ul>
            </div>
          </section>
        )}

        {/* Terms & Conditions */}
        {activeTab === 'terms' && (
          <section id="terms-conditions" className="policy-section active">
            <div className="section-intro">
              <h2>Terms & Conditions</h2>
              <p>By using Ankurit, you agree to these Terms & Conditions. If you disagree, please do not use the Platform.</p>
            </div>

            <div className="policy-article">
              <h3>1. User Eligibility</h3>
              <p>You must:</p>
              <ul>
                <li>Be 18 years or older</li>
                <li>Provide accurate and truthful information</li>
                <li>Be legally allowed to use our services in your region</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>2. Account Responsibility</h3>
              <p>You are responsible for:</p>
              <ul>
                <li>Securing your login credentials</li>
                <li>All activity under your account</li>
                <li>Immediately notifying us of any unauthorized use</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>3. Marketplace Guidelines</h3>
              <p>Ankurit is a platform for connecting farmers and nurseries for product listings and sales.</p>
              
              <h4>Users agree:</h4>
              <ul>
                <li>To list only genuine, lawful products</li>
                <li>To provide accurate product details</li>
                <li>To directly negotiate terms of sale with other users</li>
              </ul>
              
              <h4>We are not responsible for:</h4>
              <ul>
                <li>Disputes between buyers and sellers</li>
                <li>Product quality, delivery, or fulfillment</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>4. Payment & Fees</h3>
              <p>Some features or listings may require payment.</p>
              <p>All fees are:</p>
              <ul>
                <li>Non-refundable (unless otherwise specified)</li>
                <li>Subject to change with prior notice</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>5. Prohibited Activities</h3>
              <p>You must not:</p>
              <ul>
                <li>Engage in fraud, misrepresentation, or illegal activities</li>
                <li>Harm, harass, or spam other users</li>
                <li>Attempt to reverse-engineer, hack, or overload our Platform</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>6. Intellectual Property</h3>
              <p>All content on Ankurit, including logos, designs, text, and software, is our property or licensed to us.</p>
              <p>You may not copy, distribute, or create derivative works without permission.</p>
            </div>

            <div className="policy-article">
              <h3>7. Limitation of Liability</h3>
              <p>To the fullest extent permitted by law:</p>
              <ul>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount paid by you (if any) for our services in the past 6 months</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>8. Termination</h3>
              <p>We reserve the right to:</p>
              <ul>
                <li>Suspend or terminate accounts violating these Terms</li>
                <li>Remove any content that breaches our policies</li>
              </ul>
            </div>

            <div className="policy-article">
              <h3>9. Governing Law</h3>
              <p>These Terms are governed by the laws of India. Disputes will be resolved under the jurisdiction of the courts in [Your City/State].</p>
            </div>

            <div className="policy-article">
              <h3>10. Amendments</h3>
              <p>We may revise these Terms from time to time. Continued use of Ankurit means acceptance of the updated Terms.</p>
            </div>

            <div className="policy-article contact-info">
              <h3>Contact</h3>
              <p>For queries regarding these Terms:</p>
              <ul>
                <li>Email: <a href="mailto:legal@ankurit.in">legal@ankurit.in</a></li>
                <li>Phone: [Insert Phone]</li>
                <li>Registered Address: [Insert Address]</li>
              </ul>
            </div>

            <div className="key-note">
              <p><strong>Key Note:</strong> Ankurit acts solely as a connector. We do not guarantee product quality, delivery, or business outcomes. Use the platform at your own discretion.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default LegalPolicy;