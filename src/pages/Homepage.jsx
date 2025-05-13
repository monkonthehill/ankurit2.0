import React from 'react';

import Hero from '../components/Hero';
import Features from '../components/Features';
import Slideshow from '../components/Slideshow';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import './Homepage.css';
import './animation.css';

const Homepage = () => {
  return (
    <div className="homepage">
      
      <main>
        <Hero />
        <Features />
        <Slideshow />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Homepage;