import React, { useEffect } from 'react';
import './AboutUs.css';
import logo from './logo.png'; // Adjust the path to your logo
import aboutUsBg from './aboutus.jpg';
import { FaWhatsapp, FaEnvelope, FaInstagram, FaGithub } from 'react-icons/fa';
import { MdAgriculture, MdPeople, MdAttachMoney, MdTrendingUp } from 'react-icons/md';

// Import team member images (make sure to add these to your project)
import nitishImage from './aboutus.jpg';
import ashishImage from './aboutus.jpg';
import pankajImage from './aboutus.jpg';
import hiteshImage from './aboutus.jpg';

const AboutUs = () => {
  useEffect(() => {
    // Continuous floating animation for team cards
    const floatAnimation = () => {
      const teamCards = document.querySelectorAll('.team-card');
      teamCards.forEach((card, index) => {
        const floatValue = Math.sin(Date.now() / 1000 + index) * 3;
        card.style.transform = `translateY(${floatValue}px)`;
      });
      requestAnimationFrame(floatAnimation);
    };
    
    floatAnimation();
    
    return () => cancelAnimationFrame(floatAnimation);
  }, []);

  return (
    <div className="about-us-container">
      {/* Background Image */}
      <div className="background-image" style={{ backgroundImage: `url(${aboutUsBg})` }}></div>
      
      {/* Content Overlay */}
      <div className="content-overlay">
        {/* Logo at the Top */}
        <div className="logo-container">
          <img src={logo} alt="Ankurit Logo" className="header-logo" />
        </div>

        {/* Introduction Section */}
        <section className="intro-section">
          <h1>Welcome to Ankurit</h1>
          <p className="tagline">Where farmers and nursery owners grow together</p>
          
          <div className="intro-content">
            <p><MdAgriculture className="inline-icon" /> Ankurit was born from a simple truth - our farmers deserve better. While working with rural communities, we saw how middlemen were eating into hard-earned profits and how small nursery owners struggled to find buyers beyond their villages.</p>
            
            <p>We built Ankurit to create direct connections between growers and buyers. <MdAttachMoney className="inline-icon" /> No commissions. No complex procedures. Just list your plants or produce, connect with genuine buyers, and grow your business on your terms.</p>
            
            <p>Our platform works simply: Farmers create free listings, buyers browse nearby options, and deals happen directly through WhatsApp/calls. Every rupee goes to the grower where it belongs.</p>
          </div>

          {/* WhatsApp Community Section */}
          <div className="whatsapp-community">
            <a 
              href="https://chat.whatsapp.com/L7PLJWC7AIJDziFGltAeUV" 
              className="whatsapp-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp className="whatsapp-icon" />
              Join Our Farmer's Community
              <span className="btn-pulse"></span>
            </a>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <h2>Meet Our Team</h2>
          <p className="section-subtitle">The people growing Ankurit from the ground up</p>
          
          <div className="team-grid">
            {/* Nitish */}
            <div className="team-card">
              <div className="team-photo">
                <img src={nitishImage} alt="Nitish Kumar" />
                <div className="photo-border"></div>
              </div>
              <h3>Nitish Sharma</h3>
              <p className="designation">Software Developer / CEO / Founder</p>
              <p className="bio">Handles frontend development, Backend and product vision. Believes technology should serve farmers first.</p>
              <div className="social-links">
                <a href="mailto:ns708090100@gmail.com"><FaEnvelope /> Email</a>
                <a href="https://instagram.com/stoned.monk69" target="_blank" rel="noopener noreferrer"><FaInstagram /> Instagram</a>
                <a href="https://github.com/monkonthehill" target="_blank" rel="noopener noreferrer"><FaGithub /> GitHub</a>
              </div>
            </div>

            {/* Ashish */}
            <div className="team-card">
              <div className="team-photo">
                <img src={ashishImage} alt="Ashish Singh" />
                <div className="photo-border"></div>
              </div>
              <h3>Ashish</h3>
              <p className="designation">Marketing & Advertising Executive / Co-founder</p>
              <p className="bio">Manages branding and customer engagement. Expert in rural market psychology.</p>
              <div className="social-links">
                <a href="#"><FaEnvelope /> Email</a>
                <a href="#" target="_blank" rel="noopener noreferrer"><FaInstagram /> Instagram</a>
              </div>
            </div>

            {/* Pankaj */}
            <div className="team-card">
              <div className="team-photo">
                <img src={pankajImage} alt="Pankaj Kumar" />
                <div className="photo-border"></div>
              </div>
              <h3>Unknown</h3>
              <p className="designation">Business Analyst / Growth Manager</p>
              <p className="bio">Tracks market trends and pricing data to help farmers get fair value.</p>
              <div className="social-links">
                <a href="#"><FaEnvelope /> Email</a>
              </div>
            </div>

            {/* Hitesh */}
            <div className="team-card">
              <div className="team-photo">
                <img src={hiteshImage} alt="Hitesh Sharma" />
                <div className="photo-border"></div>
              </div>
              <h3>Hitesh</h3>
              <p className="designation">Operations & Compliance Executive / COO</p>
              <p className="bio">Ensures smooth operations and legal compliance across all states.</p>
              <div className="social-links">
                <a href="#"><FaEnvelope /> Email</a>
              </div>
            </div>
          </div>
        </section>

        {/* Special Thanks */}
        <section className="thanks-section">
          <h2>Special Thanks</h2>
          <p className="section-subtitle">To those who helped our seeds grow</p>
          
          <div className="thanks-grid">
            <div className="thankee">
              <MdPeople className="thankee-icon" />
              <h4>Ramesh Kumar</h4>
              <p>For initial farmer feedback and insights</p>
            </div>
            <div className="thankee">
              <MdPeople className="thankee-icon" />
              <h4>Priya Yadav</h4>
              <p>For supporting our local outreach</p>
            </div>
            <div className="thankee">
              <MdPeople className="thankee-icon" />
              <h4>Dev Raj</h4>
              <p>For backend hosting support</p>
            </div>
            <div className="thankee">
              <MdPeople className="thankee-icon" />
              <h4>Village Farmers Collective</h4>
              <p>For trusting us with their livelihoods</p>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="vision-section">
          <h2>Our Vision for the Future</h2>
          <div className="vision-content">
            <p>We dream of an India where:</p>
            <ul>
              <li><MdTrendingUp /> Every nursery owner can compete fairly in regional markets</li>
              <li><MdAttachMoney /> Farmers receive 100% of their produce's value</li>
              <li><MdPeople /> Rural youth find dignified tech-enabled agricultural work</li>
              <li><MdAgriculture /> Buyers get quality plants directly from source at fair prices</li>
            </ul>
          </div>
        </section>

        {/* Farmer's Message */}
        <section className="message-section">
          <blockquote>
            "आपका पसीना धरती को हरा-भरा बनाता है, और हम उस हरियाली को और दूर तक पहुंचाने का सपना देखते हैं।"
          </blockquote>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;