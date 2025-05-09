// src/components/collections/ImprovedCollectionCard.tsx
import React from 'react';
import { MoreHorizontal, Star, CheckCircle, MapPin } from 'lucide-react';
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
  plaques: number[] | number; // Can be array of IDs or count
  updated_at: string;
  is_favorite?: boolean;
};

type ImprovedCollectionCardProps = {
  collection: Collection;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDuplicate?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  onDelete?: (id: number) => void;
  onClick?: (id: number) => void;
  className?: string;
};

const ImprovedCollectionCard: React.FC<ImprovedCollectionCardProps> = ({
  collection,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onDelete,
  onClick,
  className = ''
}) => {
  // Handle click events
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
  
  // Get the plaque count safely
  const getPlaqueCount = () => {
    if (Array.isArray(collection.plaques)) {
      return collection.plaques.length;
    }
    return collection.plaques;
  };
  
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
  
  // Extract color name for gradient
  const colorName = collection.color.replace('bg-', '').split('-')[0];
  
  return (
    <div 
      className={`relative bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden group ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${className}`}
      onClick={handleClick}
    >
      {/* Top actions */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {isSelected && (
          <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
            <CheckCircle size={16} />
          </div>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 rounded-full bg-white bg-opacity-80 backdrop-blur-sm shadow-sm p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onEdit)}>
              Edit Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onDuplicate)}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onToggleFavorite)}>
              {collection.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={(e) => handleMenuOperation(e, onDelete)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Header section with gradient and decorative elements */}
      <div className="h-40 relative overflow-hidden">
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${colorName}-50 to-white`}></div>
        
        {/* Decorative elements */}
        <div className={`absolute top-4 right-4 w-24 h-24 rounded-full ${collection.color} opacity-10`}></div>
        <div className={`absolute bottom-8 left-8 w-16 h-16 rounded-full ${collection.color} opacity-5`}></div>
        
        {/* Small map pins */}
        <div className="absolute top-10 left-10 text-gray-200">
          <MapPin size={12} />
        </div>
        <div className="absolute top-20 left-20 text-gray-200">
          <MapPin size={14} />
        </div>
        <div className="absolute top-8 left-28 text-gray-200">
          <MapPin size={10} />
        </div>
        
        {/* Large icon */}
        <div className="absolute right-6 bottom-6 text-5xl opacity-40">{collection.icon}</div>
        
        {/* Collection icon and color indicator */}
        <div className={`absolute top-6 left-6 w-14 h-14 rounded-2xl flex items-center justify-center text-white text-3xl ${collection.color} shadow-md`}>
          {collection.icon}
        </div>

        {/* Collection favorite indicator */}
        {collection.is_favorite && (
          <div className="absolute top-4 left-24">
            <Star size={18} className="fill-amber-500 text-amber-500" />
          </div>
        )}
      </div>
      
      {/* Content section */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-1 group-hover:text-blue-600 transition-colors">
          {collection.name}
        </h2>
        
        {collection.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collection.description}</p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-500 flex items-center">
            <span className="font-medium">{getPlaqueCount()}</span>
            <span className="ml-1">{getPlaqueCount() === 1 ? 'plaque' : 'plaques'}</span>
          </div>
          <div className="text-xs text-gray-400">
            Updated {formatTimeAgo(collection.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedCollectionCard;