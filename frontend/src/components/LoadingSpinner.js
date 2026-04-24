import React from 'react';

function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p className="loading-spinner-text">{text}</p>
    </div>
  );
}

export default LoadingSpinner;
