// src/components/collections/CollectionCard.tsx
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
      className={`relative bg-white rounded-lg shadow hover:shadow-md transition-all h-full ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${className} group cursor-pointer overflow-hidden`}
      onClick={handleClick}
    >
      {/* Top color bar */}
      <div className={`h-2 w-full ${collection.color}`}></div>
      
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-lg ${collection.color} flex items-center justify-center text-white text-2xl`}>
              {collection.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                {collection.name}
              </h3>
              <p className="text-xs text-gray-500">
                Updated {formatTimeAgo(collection.updated_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            {collection.is_favorite && (
              <Star size={16} className="fill-amber-400 text-amber-400 mr-2" />
            )}
            {isSelected && (
              <div className="bg-blue-100 text-blue-600 p-1 rounded-full mr-2">
                <CheckCircle size={14} />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 rounded-full hover:bg-gray-100 p-0"
                >
                  <span className="sr-only">Options</span>
                  <MoreHorizontal size={16} />
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
        
        {/* Description */}
        {collection.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{collection.description}</p>
        )}
        
        {/* Footer with info */}
        <div className="flex items-center justify-between mt-4">
          <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 py-1 px-2">
            <MapPin size={12} /> {plaqueCount} {plaqueCount === 1 ? 'plaque' : 'plaques'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;