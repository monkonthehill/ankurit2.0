import React from 'react';
import './Features.css'
const Feature = () => {
  const features = [
    {
      icon: 'https://cdn.prod.website-files.com/626c26681a12a6a932c8a39a/64de6f21931c1e05b2a6ad43_Free%20Icons-09.svg',
      title: '2x faster Sales',
      description: 'Gain customers twice faster'
    },
    {
      icon: 'https://cdn.prod.website-files.com/626c26681a12a6a932c8a39a/649c4dff1b742b8725ed17ed_Free%20Icons-25.svg',
      title: 'Scalable solution',
      description: 'Can make you reach all over India'
    },
    {
      icon: 'https://cdn.prod.website-files.com/626c26681a12a6a932c8a39a/649c4d9938bca8c36fc55cbb_Free%20Icons-45.svg',
      title: 'Peace of mind',
      description: 'We take care of your product vision so you can focus on the business'
    },
    {
      icon: 'https://cdn.prod.website-files.com/626c26681a12a6a932c8a39a/649c89b6572a30d994441ad1_Free%20Icons-48.svg',
      title: 'Dedicated community',
      description: 'Join the community of farmers where everyone can help anyone'
    },
    {
      icon: 'https://cdn.prod.website-files.com/626c26681a12a6a932c8a39a/649c4c9abebb549ef332628f_Free%20Icons-10.svg',
      title: 'Direct communication',
      description: 'Stay in the loop with weekly updates and monthly strategy sessions'
    },
    {
      icon: 'https://cdn.prod.website-files.com/626c26681a12a6a932c8a39a/64de6f21931c1e05b2a6ad43_Free%20Icons-09.svg',
      title: '100% guarantee',
      description: 'We offer 100% farmers satisfaction guarantee with average client retention of 1.5+ years'
    }
  ];

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h1 className="feature-main-title">Why Ankurit?</h1>
        <p className="feature-subtitle">Farmers choose us because...</p>
      </div>
      
      <div className="feature-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-box">
            <div className="feature-icon-container">
              <img src={feature.icon} alt={feature.title} className="feature-icon" />
            </div>
            <h3 className="feature-box-title">{feature.title}</h3>
            <p className="feature-box-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feature;