import React, { useState } from 'react';

type PlaqueImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  plaqueColor?: string;
};

/**
 * A component to handle plaque images with a simplified circular plaque fallback
 */
const PlaqueImage = ({
  src,
  alt,
  className = '',
  placeholderClassName = 'bg-gray-50',
  plaqueColor = 'blue'
}: PlaqueImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Check if the image URL is valid
  const hasValidSrc = src && src !== 'Unknown' && src !== 'null';
  
  // Handle image loading completion
  const handleImageLoaded = () => {
    setIsLoading(false);
  };
  
  // Handle image loading error
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  // Determine color palette based on plaque color
  let mainColor = '#1d4ed8'; // blue default
  let bgColor = '#eff6ff';
  let textColor = '#1e40af';
  
  switch ((plaqueColor || '').toLowerCase()) {
    case 'green':
      mainColor = '#15803d';
      bgColor = '#f0fdf4';
      textColor = '#166534';
      break;
    case 'brown':
      mainColor = '#b45309';
      bgColor = '#fffbeb';
      textColor = '#92400e';
      break;
    case 'grey':
    case 'gray':
      mainColor = '#4b5563';
      bgColor = '#f9fafb';
      textColor = '#374151';
      break;
    case 'black':
      mainColor = '#1f2937';
      bgColor = '#f9fafb';
      textColor = '#111827';
      break;
    default:
      // Blue is default
      break;
  }
  
  // Render fallback if src is invalid or image failed to load
  if (!hasValidSrc || hasError) {
    return (
      <div className={`${placeholderClassName} w-full h-full flex items-center justify-center`}>
        <div className="w-3/5 max-w-[140px] aspect-square relative">
          {/* Circular Plaque SVG */}
          <svg 
            viewBox="0 0 120 120" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full filter drop-shadow-md"
          >
            {/* Outer circle */}
            <circle 
              cx="60" 
              cy="60" 
              r="55" 
              fill={bgColor} 
              stroke={mainColor}
              strokeWidth="3"
            />
            
            {/* Inner circle */}
            <circle
              cx="60"
              cy="60"
              r="42"
              fill={bgColor}
              stroke={mainColor}
              strokeWidth="1.5"
            />
            
            {/* Subtle highlight */}
            <path 
              d="M30,45 Q60,35 90,45" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              opacity="0.4"
            />
          </svg>
          
          {/* Text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p 
              className="font-serif font-medium text-center px-2"
              style={{ 
                color: textColor,
                fontSize: 'calc(7px + 0.8vmin)',
                maxWidth: '70px'
              }}
            >
              No Image Available
            </p>
          </div>
          
          {/* Paper/sketch texture overlay */}
          <div 
            className="absolute inset-0 opacity-10 rounded-full" 
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              mixBlendMode: 'overlay'
            }} 
          />
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Placeholder while loading */}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center ${placeholderClassName}`}>
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200 mb-2"></div>
            <div className="h-2 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      <img 
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoaded}
        onError={handleImageError}
      />
    </>
  );
};

export default PlaqueImage;