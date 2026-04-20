import React from 'react';
import './Loader.css';

export function Loader({ size = 'md', fullscreen = false }) {
  const sizeClasses = {
    sm: 'loader-sm',
    md: 'loader-md',
    lg: 'loader-lg'
  };

  const loaderClass = fullscreen ? `loader-overlay ${sizeClasses[size]}` : `loader ${sizeClasses[size]}`;

  return (
    <div className={loaderClass}>
      <div className="loader-spinner" />
      <p className="loader-text">Loading...</p>
    </div>
  );
}

export function LoadingSkeleton({ count = 1, type = 'product' }) {
  return (
    <div className="loading-skeleton-container">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton skeleton-${type}`} />
      ))}
    </div>
  );
}

export default Loader;
