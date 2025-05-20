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
  
  // Function to get the left border color style directly
  const getLeftBorderStyle = () => {
    // Default color
    let borderColor = '#3b82f6'; // blue-500
    
    // Extract color information from the collection.color class
    if (collection.color) {
      const colorClass = collection.color;
      
      // Map of common Tailwind color names to hex values
      const colorMap = {
        'blue': '#3b82f6',
        'red': '#ef4444',
        'green': '#10b981',
        'yellow': '#eab308',
        'purple': '#a855f7',
        'pink': '#ec4899',
        'indigo': '#6366f1',
        'gray': '#6b7280',
        'amber': '#f59e0b',
        'lime': '#84cc16',
        'emerald': '#10b981',
        'teal': '#14b8a6',
        'cyan': '#06b6d4',
        'sky': '#0ea5e9',
        'violet': '#8b5cf6',
        'fuchsia': '#d946ef',
        'rose': '#f43f5e',
        'orange': '#f97316'
      };
      
      // Extract the color name
      for (const [colorName, hexValue] of Object.entries(colorMap)) {
        if (colorClass.includes(colorName)) {
          borderColor = hexValue;
          break;
        }
      }
    }
    
    return {
      borderLeftColor: borderColor,
      borderLeftWidth: '4px'
    };
  };
  
  return (
    <div 
      className={`bg-white rounded-lg shadow hover:shadow-md transition ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } overflow-hidden cursor-pointer group ${className}`}
      onClick={handleClick}
      style={getLeftBorderStyle()}
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