// src/components/collections/CollectionListItem.tsx
import React from 'react';
import { MoreHorizontal, Edit, Trash, Copy, Share2, Star, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { type Collection } from './CollectionCard';

type CollectionListItemProps = {
  collection: Collection;
  isSelected?: boolean;
  showMenu?: boolean;
  menuOpenId?: number | null;
  onToggleSelect?: (id: number) => void;
  onMenuOpen?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDuplicate?: (id: number) => void;
  onShare?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  onDelete?: (id: number) => void;
};

export const CollectionListItem: React.FC<CollectionListItemProps> = ({
  collection,
  isSelected = false,
  showMenu = true,
  menuOpenId,
  onToggleSelect,
  onMenuOpen,
  onEdit,
  onDuplicate,
  onShare,
  onToggleFavorite,
  onDelete,
}) => {
  
  const handleClick = (e: React.MouseEvent) => {
    if (onToggleSelect) {
      // If we're selecting or using a modifier key, toggle selection
      if (isSelected || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onToggleSelect(collection.id);
      }
      // Otherwise normal link behavior continues
    }
  };
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering item click
    if (onMenuOpen) onMenuOpen(collection.id);
  };
  
  const handleMenuItemClick = (e: React.MouseEvent, action?: (id: number) => void) => {
    e.stopPropagation(); // Prevent triggering item click
    if (action) action(collection.id);
  };
  
  return (
    <div className={`relative bg-white rounded-2xl shadow hover:shadow-md p-4 transition ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <Link 
        to={`/collections/${collection.id}`} 
        className="flex items-center gap-4 cursor-pointer"
        onClick={handleClick}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl ${collection.color}`}>
          {collection.icon}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold truncate">{collection.name}</h2>
            {collection.isPublic && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                Public
              </Badge>
            )}
            {collection.isFavorite && (
              <Star size={16} className="fill-amber-500 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">{collection.plaques} plaques • Updated {collection.updated}</div>
        </div>
      </Link>
      
      {showMenu && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isSelected && (
            <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
              <CheckCircle size={16} />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={handleMenuClick}
          >
            <MoreHorizontal size={18} />
          </Button>
        </div>
      )}
      
      {menuOpenId === collection.id && (
        <div className="absolute top-12 right-3 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-10">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 p-3 w-full justify-start text-left"
            onClick={(e) => handleMenuItemClick(e, onEdit)}
          >
            <Edit size={16} /> Edit Collection
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 p-3 w-full justify-start text-left"
            onClick={(e) => handleMenuItemClick(e, onDuplicate)}
          >
            <Copy size={16} /> Duplicate
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 p-3 w-full justify-start text-left"
            onClick={(e) => handleMenuItemClick(e, onShare)}
          >
            <Share2 size={16} /> Share
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 p-3 w-full justify-start text-left"
            onClick={(e) => handleMenuItemClick(e, onToggleFavorite)}
          >
            <Star size={16} className={collection.isFavorite ? 'fill-amber-500 text-amber-500' : ''} /> 
            {collection.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 p-3 w-full justify-start text-left text-red-600 hover:bg-red-50"
            onClick={(e) => handleMenuItemClick(e, onDelete)}
          >
            <Trash size={16} /> Delete
          </Button>
        </div>
      )}
    </div>
  );
};

export default CollectionListItem;