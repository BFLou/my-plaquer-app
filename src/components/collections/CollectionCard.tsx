// src/components/collections/CollectionCard.jsx
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
import { formatTimeAgo, getPlaqueCount } from '../../utils/collectionHelpers';

export type Collection = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  plaques: number[] | number;
  updated_at: string;
  is_favorite?: boolean;
};

const CollectionCard = ({
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
  // Extract color name for gradient
  const colorName = collection.color.replace('bg-', '').split('-')[0];
  const plaqueCount = getPlaqueCount(collection);
  
  // Handle click events
  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onToggleSelect(collection.id);
    } else if (!e.target.closest('button') && onClick) {
      onClick(collection.id);
    }
  };
  
  // Handle menu operations
  const handleMenuOperation = (e, operation) => {
    e.stopPropagation();
    if (operation) operation(collection.id);
  };
  
  return (
    <div 
      className={`relative bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden h-full group ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${className}`}
      onClick={handleClick}
    >
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
        
        {/* Top actions */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <span className="font-medium">{plaqueCount}</span>
            <span className="ml-1">{plaqueCount === 1 ? 'plaque' : 'plaques'}</span>
          </div>
          <div className="text-xs text-gray-400">
            Updated {formatTimeAgo(collection.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;