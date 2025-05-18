// src/features/collections/components/CollectionListItem.tsx
import React from 'react';
import { CheckCircle, Star, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collection } from './CollectionCard';
import { formatTimeAgo, getPlaqueCount } from '../utils/collectionHelpers';

type CollectionListItemProps = {
  collection: Collection;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
};

const CollectionListItem: React.FC<CollectionListItemProps> = ({
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
  const handleMenuOperation = (e: React.MouseEvent, operation?: (id: string) => void) => {
    e.stopPropagation();
    if (operation) operation(collection.id);
  };
  
  // Get plaque count
  const plaqueCount = getPlaqueCount(collection);
  
  return (
    <div 
      className={`bg-white rounded-lg shadow hover:shadow-md transition border border-gray-50 overflow-hidden cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${className}`}
      onClick={handleClick}
    >
      <div className="flex flex-col sm:flex-row">
        <div className={`sm:w-16 h-16 sm:h-auto flex-shrink-0 ${collection.color} p-4 flex items-center justify-center text-white text-3xl`}>
          {collection.icon}
        </div>
        
        <div className="flex-grow p-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{collection.name}</h3>
              {collection.is_favorite && (
                <Star size={16} className="fill-amber-500 text-amber-500" />
              )}
              {isSelected && (
                <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
                  <CheckCircle size={14} />
                </div>
              )}
            </div>
            
            {collection.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{collection.description}</p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-gray-50">
                {plaqueCount} {plaqueCount === 1 ? 'plaque' : 'plaques'}
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
                className="h-8 w-8 rounded-full hover:bg-gray-100 p-0"
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
    </div>
  );
};

export default CollectionListItem;