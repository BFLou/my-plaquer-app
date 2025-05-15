import React from 'react';
import { MapPin, Star, CheckCircle, MoreHorizontal, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Collection = {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  plaques: number[] | number;
  updated_at: string;
  is_favorite?: boolean;
  is_public?: boolean;
};

type EnhancedCollectionCardProps = {
  collection: Collection;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDuplicate?: (id: number) => void;
  onShare?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  onDelete?: (id: number) => void;
  onClick?: (id: number) => void;
  className?: string;
};

const EnhancedCollectionCard: React.FC<EnhancedCollectionCardProps> = ({
  collection,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onShare,
  onToggleFavorite,
  onDelete,
  onClick,
  className = ''
}) => {
  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  };

  // Handle clicks with modifier key for selection
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (onToggleSelect) onToggleSelect(collection.id);
    } else if (!e.target.closest('button') && onClick) {
      onClick(collection.id);
    }
  };
  
  // Handle menu operations
  const handleMenuOperation = (e: React.MouseEvent, operation?: (id: number) => void) => {
    e.stopPropagation();
    if (operation) operation(collection.id);
  };
  
  // Get plaque count safely
  const getPlaqueCount = () => {
    if (Array.isArray(collection.plaques)) {
      return collection.plaques.length;
    }
    return collection.plaques;
  };
  
  // Get color name for gradient
  const getColorName = () => {
    if (collection.color.startsWith('bg-')) {
      const parts = collection.color.split('-');
      return parts.length > 1 ? parts[1] : 'blue';
    }
    return collection.color || 'blue';
  };
  
  const colorName = getColorName();
  
  return (
    <div 
      className={`relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-white cursor-pointer group 
      ${isSelected ? 'ring-2 ring-blue-500' : ''} ${className}`}
      onClick={handleClick}
      style={{transform: 'translateZ(0)'}} // Hardware acceleration for smoother animations
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 bg-blue-100 text-blue-600 p-1 rounded-full">
          <CheckCircle size={16} />
        </div>
      )}
      
      {/* Gradient header with decorative elements */}
      <div className="h-36 relative overflow-hidden">
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${colorName}-50 to-white`}></div>
        
        {/* Decorative elements */}
        <div className={`absolute top-4 right-4 w-20 h-20 rounded-full ${collection.color} opacity-10 
          group-hover:scale-110 transition-transform duration-500`}></div>
        <div className={`absolute bottom-8 left-8 w-16 h-16 rounded-full ${collection.color} opacity-5 
          animate-pulse`}></div>
        
        {/* Illustrative pins */}
        <div className="absolute top-10 left-10 text-gray-200">
          <MapPin size={12} className="opacity-70" />
        </div>
        <div className="absolute top-20 left-20 text-gray-200">
          <MapPin size={14} className="opacity-50" />
        </div>
        <div className="absolute top-8 left-28 text-gray-200">
          <MapPin size={10} className="opacity-30" />
        </div>
        
        {/* Large icon with 3D effect */}
        <div className="absolute right-6 bottom-4 text-5xl opacity-30 
          transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">
          {collection.icon}
        </div>
        
        {/* Collection icon with elevation effect */}
        <div className={`absolute top-6 left-6 w-14 h-14 rounded-xl flex items-center justify-center 
          text-white text-3xl ${collection.color} shadow-lg group-hover:shadow-xl 
          transform group-hover:scale-105 transition-all duration-300`}>
          {collection.icon}
        </div>

        {/* Collection status indicators */}
        <div className="absolute top-3 left-24 flex items-center gap-1">
          {collection.is_favorite && (
            <div className="transform group-hover:scale-110 transition-transform duration-300">
              <Star size={18} className="fill-amber-500 text-amber-500 drop-shadow-sm" />
            </div>
          )}
          
          {collection.is_public && (
            <Badge 
              variant="secondary" 
              className="bg-green-100 text-green-800 border-green-200 shadow-sm
              group-hover:bg-green-200 transition-colors duration-300"
            >
              Public
            </Badge>
          )}
        </div>
        
        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm
              hover:bg-white hover:shadow-md transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Options</span>
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 animate-in fade-in-80 zoom-in-95">
            <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onEdit)} className="cursor-pointer">
              <span className="w-4 h-4 mr-2">✏️</span> Edit Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onDuplicate)} className="cursor-pointer">
              <span className="w-4 h-4 mr-2">🔄</span> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onShare)} className="cursor-pointer">
              <span className="w-4 h-4 mr-2">🔗</span> Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onToggleFavorite)} className="cursor-pointer">
              <span className="w-4 h-4 mr-2">{collection.is_favorite ? '⭐' : '☆'}</span> 
              {collection.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={(e) => handleMenuOperation(e, onDelete)}
            >
              <span className="w-4 h-4 mr-2">🗑️</span> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Content section */}
      <div className="p-5">
        <h2 className="text-lg font-bold mb-1.5 text-gray-800 line-clamp-1 
          group-hover:text-blue-600 transition-colors duration-300">
          {collection.name}
        </h2>
        
        {collection.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 group-hover:line-clamp-3 transition-all duration-500">
            {collection.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center mr-3">
              <MapPin size={14} className="mr-1 opacity-70" />
              <span className="font-medium">{getPlaqueCount()}</span>
              <span className="ml-1">{getPlaqueCount() === 1 ? 'plaque' : 'plaques'}</span>
            </div>
            
            <div className="flex items-center text-xs text-gray-400">
              <Clock size={12} className="mr-1" />
              <span>{formatTimeAgo(collection.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hover overlay with subtle animation */}
      <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 
        pointer-events-none transition-opacity duration-300"></div>
      
      {/* Selection highlight animation */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default EnhancedCollectionCard;