import React, { useState } from 'react';
import { FaQuestionCircle, FaUser, FaSeedling, FaRupeeSign, FaShieldAlt, FaHeadset, FaFileAlt, FaBook } from 'react-icons/fa';
import './help-support.css';

const HelpSupport = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    issueType: '',
    description: '',
    orderId: '',
    contactMethod: 'email'
  });
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    // Reset form after 5 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        issueType: '',
        description: '',
        orderId: '',
        contactMethod: 'email'
      });
    }, 5000);
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      category: 'Account & Profile',
      icon: <FaUser />,
      questions: [
        {
          q: 'How do I create an Ankurit account?',
          a: 'Simply click on "Sign Up," fill in your name, phone number, and password to create your account.'
        },
        {
          q: 'I forgot my password, what do I do?',
          a: 'Click on "Forgot Password" on the login page and follow the reset instructions.'
        }
      ]
    },
    {
      category: 'Product Listings',
      icon: <FaSeedling />,
      questions: [
        {
          q: 'How do I list my nursery products?',
          a: 'Login, go to your dashboard, click on "Add Product," fill in details like product name, variety, price, and upload images.'
        },
        {
          q: 'How many products can I list for free?',
          a: 'You can list up to 3 products for free. Paid plans allow more listings.'
        }
      ]
    },
    {
      category: 'Payments & Plans',
      icon: <FaRupeeSign />,
      questions: [
        {
          q: 'What are the subscription plans?',
          a: 'We offer Basic, Premium, and Golden Farmer plans with different listing limits and promotional benefits.'
        },
        {
          q: 'How can I pay for subscriptions?',
          a: 'You can pay via UPI, Debit Card, or Net Banking through our secure payment gateway.'
        }
      ]
    },
    {
      category: 'Buyer & Seller Safety',
      icon: <FaShieldAlt />,
      questions: [
        {
          q: 'How can I safely deal with other users?',
          a: 'Only communicate through verified contact numbers. Never pay in advance without verifying product quality.'
        }
      ]
    },
    {
      category: 'Support & Complaints',
      icon: <FaHeadset />,
      questions: [
        {
          q: 'How do I raise a complaint?',
          a: 'Use the form below or contact us via email or WhatsApp. We respond within 48 hours.'
        }
      ]
    }
  ];

  const resources = [
    { name: 'Privacy Policy', icon: <FaFileAlt />, link: '/privacy' },
    { name: 'Terms & Conditions', icon: <FaFileAlt />, link: '/terms' },
    { name: 'Community Guidelines', icon: <FaBook />, link: '/community-guidelines' },
    { name: 'How to List Products - Step-by-Step Guide', icon: <FaBook />, link: '/listing-guide' }
  ];

  return (
    <div className="help-support-container">
      <header className="help-header">
        <h1>Ankurit Help & Support Center</h1>
        <p className="intro-text">
          Welcome to Ankurit's official Help & Support Center!<br />
          We're committed to helping you grow your business smoothly.<br />
          Browse our FAQs or connect with our team for personalized assistance.
        </p>
      </header>

      <div className="faq-section">
        <h2><FaQuestionCircle /> Frequently Asked Questions</h2>
        
        {faqs.map((section, sectionIndex) => (
          <div key={sectionIndex} className="faq-category">
            <h3>{section.icon} {section.category}</h3>
            <div className="faq-questions">
              {section.questions.map((item, index) => (
                <div 
                  key={index} 
                  className={`faq-item ${activeFaq === `${sectionIndex}-${index}` ? 'active' : ''}`}
                  onClick={() => toggleFaq(`${sectionIndex}-${index}`)}
                >
                  <div className="faq-question">
                    {item.q}
                    <span className="toggle-icon">{activeFaq === `${sectionIndex}-${index}` ? '−' : '+'}</span>
                  </div>
                  {activeFaq === `${sectionIndex}-${index}` && (
                    <div className="faq-answer">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="contact-section">
        <h2><FaHeadset /> Contact Support</h2>
        <div className="contact-methods">
          <div className="contact-card">
            <h3>Email</h3>
            <p>support@ankurit.in</p>
          </div>
          <div className="contact-card">
            <h3>Phone/WhatsApp</h3>
            <p>+91-XXXXXXXXXX</p>
          </div>
          <div className="contact-card">
            <h3>Support Hours</h3>
            <p>Monday to Saturday<br />9 AM – 6 PM</p>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>Raise a Support Ticket</h2>
        {submitted ? (
          <div className="success-message">
            <h3>Thank you!</h3>
            <p>Our support team will get back to you within 24-48 business hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Registered Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="issueType">Issue Type *</label>
              <select
                id="issueType"
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                required
              >
                <option value="">Select an issue type</option>
                <option value="account">Account Issue</option>
                <option value="product">Product Listing</option>
                <option value="payment">Payments</option>
                <option value="technical">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Describe Your Issue *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="orderId">Order ID / Product ID (If Applicable)</label>
              <input
                type="text"
                id="orderId"
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactMethod">Preferred Contact Method</label>
              <select
                id="contactMethod"
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleChange}
              >
                <option value="email">Email</option>
                <option value="phone">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="screenshot">Upload Screenshot (Optional)</label>
              <input
                type="file"
                id="screenshot"
                name="screenshot"
                accept="image/*"
              />
            </div>

            <button type="submit" className="submit-btn">Submit Request</button>
          </form>
        )}
      </div>

      <div className="resources-section">
        <h2><FaBook /> Additional Resources</h2>
        <div className="resource-links">
          {resources.map((resource, index) => (
            <a key={index} href={resource.link} className="resource-card">
              {resource.icon}
              <span>{resource.name}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="testimonial-section">
        <h2>Success Stories</h2>
        <div className="testimonial">
          <p>"Ankurit helped me connect with buyers across the state. Their support team guided me through the listing process and now my nursery business has grown by 40%!"</p>
          <p className="author">- Rajesh Kumar, Nursery Owner, Maharashtra</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;