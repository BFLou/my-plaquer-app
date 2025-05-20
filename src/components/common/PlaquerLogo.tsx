// src/components/common/PlaquerLogo.tsx
import React from 'react';
import { MapPin } from 'lucide-react'; // Import the MapPin icon from lucide-react

interface PlaquerLogoProps {
  className?: string;
  size?: number;
}

const PlaquerLogo: React.FC<PlaquerLogoProps> = ({ className = '', size = 32 }) => {
  // Calculate the icon size based on the container size
  const iconSize = Math.floor(size * 0.6);
  
  return (
    <div 
      className={`rounded-lg bg-blue-600 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <MapPin className="text-white" size={iconSize} />
    </div>
  );
};

export default PlaquerLogo;