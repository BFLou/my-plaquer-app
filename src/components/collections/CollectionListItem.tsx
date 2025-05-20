// src/components/collections/CollectionListItem.tsx
import React from 'react';
import { CheckCircle, Star, MoreHorizontal, MapPin } from 'lucide-react';
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

const CollectionListItem = ({
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
  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (onToggleSelect) onToggleSelect(collection.id);
    } else if (!e.target.closest('button') && onClick) {
      onClick(collection.id);
    }
  };
  
  // Handle menu operations
  const handleMenuOperation = (e, operation) => {
    e.stopPropagation();
    if (operation) operation(collection.id);
  };
  
  // Get plaque count
  const plaqueCount = getPlaqueCount(collection);
  
  return (
    <div 
      className={`bg-white rounded-lg shadow hover:shadow-md transition border-l-4 ${
        collection.color ? collection.color.replace('bg-', 'border-') : 'border-blue-500'
      } ${isSelected ? 'ring-2 ring-blue-500' : ''} overflow-hidden cursor-pointer group ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center p-3">
        <div className={`h-12 w-12 rounded-lg ${collection.color} flex items-center justify-center text-white text-2xl mr-4 flex-shrink-0`}>
          {collection.icon}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-800 truncate mr-2">{collection.name}</h3>
            {collection.is_favorite && (
              <Star size={16} className="fill-amber-400 text-amber-400 flex-shrink-0" />
            )}
            {isSelected && (
              <div className="bg-blue-100 text-blue-600 p-1 rounded-full ml-1 flex-shrink-0">
                <CheckCircle size={14} />
              </div>
            )}
          </div>
          
          {collection.description && (
            <p className="text-sm text-gray-600 truncate">{collection.description}</p>
          )}
          
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 py-0.5">
              <MapPin size={12} /> {plaqueCount}
            </Badge>
            <span className="text-xs text-gray-400">
              Updated {formatTimeAgo(collection.updated_at)}
            </span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 rounded-full hover:bg-gray-100 p-0 flex-shrink-0 ml-2"
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
  );
};

export default CollectionListItem;