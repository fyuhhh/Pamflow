import React from 'react';
import logoImg from '../assets/logo_pamflow.png';

/**
 * PamFlow Logo Component
 * Renders the provided HD logo image
 */
const Logo = ({ className = "w-10 h-10", style = {} }) => {
  return (
    <img 
      src={logoImg} 
      alt="PamFlow Logo" 
      className={className} 
      style={{ ...style, objectFit: 'contain' }}
    />
  );
};

export default Logo;
