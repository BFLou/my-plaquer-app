import React from 'react';
import { MapPin, Clock, Star, CheckCircle, Users } from 'lucide-react';
import { cn } from "@/lib/utils";

type PlaqueBadgeVariant = 'color' | 'profession' | 'visited' | 'favorite' | 'period' | 'organization';

type PlaqueBadgeProps = {
  variant: PlaqueBadgeVariant;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
  onClick?: () => void;
  className?: string;
};

export const PlaqueBadge: React.FC<PlaqueBadgeProps> = ({
  variant,
  label,
  icon,
  color,
  tooltip,
  onClick,
  className = '',
}) => {
  // Get appropriate styles and icon based on variant
  const getStyles = () => {
    switch (variant) {
      case 'color':
        const colorStyles: Record<string, string> = {
          'blue': 'bg-blue-50 text-blue-700 border-blue-200',
          'green': 'bg-green-50 text-green-700 border-green-200',
          'brown': 'bg-amber-50 text-amber-700 border-amber-200',
          'black': 'bg-gray-100 text-gray-700 border-gray-300',
          'grey': 'bg-gray-100 text-gray-700 border-gray-300',
          'gray': 'bg-gray-100 text-gray-700 border-gray-300',
          'purple': 'bg-purple-50 text-purple-700 border-purple-200',
          'red': 'bg-red-50 text-red-700 border-red-200',
        };
        
        const lowerLabel = label.toLowerCase();
        return colorStyles[lowerLabel] || 'bg-gray-50 text-gray-600 border-gray-200';
        
      case 'profession':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        
      case 'visited':
        return 'bg-green-100 text-green-800 border-green-200';
        
      case 'favorite':
        return 'bg-amber-50 text-amber-700 border-amber-200';
        
      case 'period':
        return 'bg-blue-50 text-blue-700 border-blue-200';
        
      case 'organization':
        return 'bg-purple-50 text-purple-700 border-purple-200';
        
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };
  
  // Get appropriate icon if not provided
  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'color':
        return <MapPin size={12} />;
      case 'profession':
        return <Users size={12} />;
      case 'visited':
        return <CheckCircle size={12} />;
      case 'favorite':
        return <Star size={12} className="fill-amber-500" />;
      case 'period':
        return <Clock size={12} />;
      case 'organization':
        return <Users size={12} />;
      default:
        return null;
    }
  };
  
  // Apply custom color if provided
  const customStyle = color ? { backgroundColor: color, borderColor: color } : {};
  
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border",
        getStyles(),
        onClick ? "cursor-pointer hover:opacity-80" : "",
        className
      )}
      style={customStyle}
      onClick={onClick}
      title={tooltip}
    >
      {getIcon()}
      <span>{label}</span>
    </div>
  );
};

export default PlaqueBadge;