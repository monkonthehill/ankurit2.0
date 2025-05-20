import React from 'react';
import './LoadingSpiner.css';

const LoadingSpinner = ({ fullPage = false }) => {
  return (
    <div className={`spinner-container ${fullPage ? 'full-page' : ''}`}>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;