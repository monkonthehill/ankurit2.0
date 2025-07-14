import React, { useState, useEffect } from 'react';
import './hero.css';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const navigate = useNavigate();
  // Background images for slideshow
  const slides = [
    'url("/pictures/photo1.jpg")',  // Replace with your actual image paths
   'url("/pictures/photo2.jpg")',
 'url("/pictures/photo3.jpg")',
  'url("/pictures/photo4.jpg")',
   'url("/pictures/photo5.jpg")'
  ];
  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="hero" id="home">
      {/* Background Slideshow */}
      <div className="hero-slideshow">
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: slide }}
          />
        ))}
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          <span className="title-line">Welcome to </span>

            <span className="animated-text">𝐀𝐍𝐊𝐔𝐑𝐈𝐓</span>
          
        </h1>
        
        <p className="hero-subtitle">
          Revolutionizing agricultural commerce through direct farmer-market connections
        </p>
        
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">10,000+</span>
            <span className="stat-label">Farmers Connected</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Markets Served</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Support</span>
          </div>
        </div>
        
        <div className="hero-buttons">
  <button 
    className="btn-primary"
    onClick={() => navigate('/products')}
  >
    Explore Markets <i className="fas fa-arrow-right"></i>
  </button>
  <button 
    className="btn-secondary"
    onClick={() => navigate('/profile')}
  >
    Join as a Farmer <i className="fas fa-user-plus"></i>
  </button>
</div>
        
        <div className="hero-scroll-indicator">
          <span>Scroll Down</span>
          <div className="scroll-arrow"></div>
        </div>
      </div>
      
      {/* Floating agricultural icons */}
      <div className="hero-icons">
        <i className="fas fa-tractor"></i>
        <i className="fas fa-seedling"></i>
        <i className="fas fa-apple-alt"></i>
        <i className="fas fa-truck"></i>
      </div>
    </section>
  );
};

export default Hero;