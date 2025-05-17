// src/components/collections/EnhancedCollectionListItem.jsx
import React from 'react';
import { CheckCircle, Star, MoreHorizontal, Pencil, Copy, Share2, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Enhanced collection list item component for list view
 */
const EnhancedCollectionListItem = ({
  collection,
  isSelected = false,
  menuOpenId = null,
  onToggleSelect,
  onMenuOpen,
  onEdit,
  onDuplicate,
  onShare,
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
  
  // Get color class safely
  const getColorClass = () => {
    if (!collection.color) return 'bg-blue-500'; // Default
    if (typeof collection.color === 'string') {
      // If it already has bg- prefix, use as is
      if (collection.color.startsWith('bg-')) return collection.color;
      // Otherwise, add the prefix
      return `bg-${collection.color}-500`;
    }
    return 'bg-blue-500'; // Fallback
  };

  const colorClass = getColorClass();
  
  return (
    <div 
      className={`bg-white rounded-lg shadow hover:shadow-md transition border border-gray-50 overflow-hidden cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${className}`}
      onClick={handleClick}
    >
      <div className="flex flex-col sm:flex-row">
        <div className={`sm:w-16 h-16 sm:h-auto flex-shrink-0 ${colorClass} p-4 flex items-center justify-center text-white text-3xl`}>
          {collection.icon}
        </div>
        
        <div className="flex-grow p-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{collection.name}</h3>
              {collection.is_favorite && (
                <Star size={16} className="fill-amber-500 text-amber-500" />
              )}
              {collection.is_public && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Public
                </Badge>
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
                {Array.isArray(collection.plaques) ? collection.plaques.length : collection.plaques}
                {Array.isArray(collection.plaques) 
                  ? (collection.plaques.length === 1 ? ' plaque' : ' plaques')
                  : (collection.plaques === 1 ? ' plaque' : ' plaques')}
              </Badge>
              <span className="text-xs text-gray-400">
                Updated {collection.updated || 'recently'}
              </span>
            </div>
          </div>
          
          <DropdownMenu onOpenChange={() => onMenuOpen && onMenuOpen(collection.id)}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onEdit)}>
                <Pencil size={16} className="mr-2" /> Edit Collection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onDuplicate)}>
                <Copy size={16} className="mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onShare)}>
                <Share2 size={16} className="mr-2" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleMenuOperation(e, onToggleFavorite)}>
                <Star size={16} className={`mr-2 ${collection.is_favorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                {collection.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={(e) => handleMenuOperation(e, onDelete)}
              >
                <Trash size={16} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCollectionListItem;