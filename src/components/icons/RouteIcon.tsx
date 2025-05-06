// src/components/icons/RouteIcon.tsx
import React from 'react';

interface RouteIconProps {
  size?: number;
  className?: string;
}

/**
 * Route icon component used across the application
 */
export const RouteIcon: React.FC<RouteIconProps> = ({ 
  size = 24, 
  className = ""
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`lucide lucide-route ${className}`}
    >
      <circle cx="6" cy="19" r="3"/>
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  );
};

export default RouteIcon;