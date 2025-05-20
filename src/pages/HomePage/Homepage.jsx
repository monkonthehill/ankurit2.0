import React from 'react';

import Hero from '../../components/Homepage/Hero';
import Features from '../../components/Homepage/Features';
import Slideshow from '../../components/Homepage/Slideshow';
import Contact from '../../components/Homepage/Contact';
import Footer from '../../components/Homepage/Footer';
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