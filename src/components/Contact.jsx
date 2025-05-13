import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { MapPin, Mail, Phone } from 'lucide-react';
import './Contact.css'
const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const formRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      'service_cwdlh15',
      'template_4lq63ds',
      formRef.current,
      'rAwYRak98_50PGxEN'
    )
    .then(() => {
      alert('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    })
    .catch((error) => {
      console.error('Email sending failed:', error);
      alert('Something went wrong. Please try again later.');
    });
  };

  return (
    <section className="contact" id="contact">
      <div className="container">
        <h2 className="section-title">Get In Touch</h2>
        <div className="contact-content">
          <div className="contact-info">
            <div className="info-item">
              <div className="info-icon"><MapPin size={24} /></div>
              <div className="info-text">
                <h4>Address</h4>
                <p>123 Creative Street, Innovation City</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon"><Mail size={24} /></div>
              <div className="info-text">
                <h4>Email</h4>
                <p>contactankurit@gmail.com</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon"><Phone size={24} /></div>
              <div className="info-text">
                <h4>Phone</h4>
                <p>+91 98765 43210</p>
              </div>
            </div>
          </div>
          <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email"
                required
              />
            </div>
            <div className="form-group">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your Message"
                required
              ></textarea>
            </div>
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
