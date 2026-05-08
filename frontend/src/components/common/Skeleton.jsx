import React from 'react';

/**
 * Skeleton component for loading states.
 * Uses the .skeleton class defined in index.css for shimmer effect.
 */
const Skeleton = ({ width, height, borderRadius = '0.5rem', className = '' }) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '1rem',
        borderRadius: borderRadius
      }}
    />
  );
};

export default Skeleton;
