// src/components/plaques/PlaqueImage.tsx
import React, { useState, useEffect } from 'react';

type PlaqueImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  plaqueColor?: string;
  onLoad?: () => void;
};

/**
 * A component to handle plaque images with a fallback system
 */
export const PlaqueImage: React.FC<PlaqueImageProps> = ({
  src,
  alt,
  className = '',
  placeholderClassName = 'bg-gray-50',
  plaqueColor = 'blue',
  onLoad
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Check if the image URL is valid
  const hasValidSrc = src && src !== 'Unknown' && src !== 'null';
  
  // Get initials for the placeholder
  const getInitials = () => {
    if (!alt) return '?';
    return alt.split(' ')
      .filter(word => word.length > 0)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };
  
  // Handle image loading completion
  const handleImageLoaded = () => {
    setLoading(false);
    if (onLoad) onLoad();
  };
  
  // Handle image loading error
  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };
  
  // Map color names to classes
  const getColorClass = () => {
    switch (plaqueColor.toLowerCase()) {
      case 'blue': return 'bg-blue-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      case 'brown': return 'bg-amber-700 text-white';
      case 'black': return 'bg-gray-800 text-white';
      case 'grey':
      case 'gray': return 'bg-gray-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };
  
  // Preload the image
  useEffect(() => {
    if (hasValidSrc) {
      const img = new Image();
      img.src = src as string;
      img.onload = handleImageLoaded;
      img.onerror = handleImageError;
      
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    } else {
      setError(true);
      setLoading(false);
    }
  }, [src, hasValidSrc]);
  
  // Show fallback placeholder if error or no src
  if (error || !hasValidSrc) {
    return (
      <div className={`${placeholderClassName} ${className} flex items-center justify-center`}>
        <div className={`${getColorClass()} w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold`}>
          {getInitials()}
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full">
      {/* Loading placeholder */}
      {loading && (
        <div className={`absolute inset-0 ${placeholderClassName} flex items-center justify-center`}>
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Actual image */}
      <img 
        src={src as string}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoaded}
        onError={handleImageError}
      />
    </div>
  );
};

export default PlaqueImage;