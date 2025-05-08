// src/components/collections/CollectionCard.tsx
import React from 'react';
import { MoreHorizontal, Edit, Trash, Copy, Share2, Star, CheckCircle, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';

export type Collection = {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  plaques: number;
  updated: string;
  isPublic?: boolean;
  isFavorite?: boolean;
};

type CollectionCardProps = {
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

export const CollectionCard: React.FC<CollectionCardProps> = ({
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
    e.stopPropagation(); // Prevent triggering card click
    if (onMenuOpen) onMenuOpen(collection.id);
  };
  
  const handleMenuItemClick = (e: React.MouseEvent, action?: (id: number) => void) => {
    e.stopPropagation(); // Prevent triggering card click
    if (action) action(collection.id);
  };
  
  // Extract the color name from the bg class
  const colorName = collection.color.replace('bg-', '').replace('-500', '');
  
  return (
    <div 
      className={`relative bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden group ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Top menu and selection indicator */}
      {showMenu && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {isSelected && (
            <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
              <CheckCircle size={16} />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full bg-white bg-opacity-80 backdrop-blur-sm shadow-sm"
            onClick={handleMenuClick}
          >
            <MoreHorizontal size={18} />
          </Button>
        </div>
      )}
      
      {/* Dropdown menu */}
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
      
      <Link 
        to={`/collections/${collection.id}`} 
        className="block cursor-pointer"
        onClick={handleClick}
      >
        {/* Header section with gradient and decorative elements */}
        <div className="h-40 relative overflow-hidden">
          {/* Gradient background that matches collection color */}
          <div className={`absolute inset-0 bg-gradient-to-br from-${colorName}-50 to-white`}></div>
          
          {/* Decorative elements for visual interest */}
          <div className={`absolute top-4 right-4 w-24 h-24 rounded-full ${collection.color} opacity-10`}></div>
          <div className={`absolute bottom-8 left-8 w-16 h-16 rounded-full ${collection.color} opacity-5`}></div>
          
          {/* Large icon */}
          <div className="absolute right-6 bottom-6 text-5xl opacity-40">{collection.icon}</div>
          
          {/* Small map pins scattered across the header */}
          <div className="absolute top-10 left-10 text-gray-200">
            <MapPin size={12} />
          </div>
          <div className="absolute top-20 left-20 text-gray-200">
            <MapPin size={14} />
          </div>
          <div className="absolute top-8 left-28 text-gray-200">
            <MapPin size={10} />
          </div>
          
          {/* Collection icon and color indicator */}
          <div className={`absolute top-6 left-6 w-14 h-14 rounded-2xl flex items-center justify-center text-white text-3xl ${collection.color} shadow-md`}>
            {collection.icon}
          </div>

          {/* Collection favorite indicator */}
          {collection.isFavorite && (
            <div className="absolute top-4 left-24">
              <Star size={18} className="fill-amber-500 text-amber-500" />
            </div>
          )}
          
          {/* Public badge if applicable */}
          {collection.isPublic && (
            <Badge 
              variant="secondary" 
              className="absolute top-4 left-[90px] bg-green-100 text-green-800 border-green-200"
            >
              Public
            </Badge>
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
              <span className="font-medium">{collection.plaques}</span>
              <span className="ml-1">{collection.plaques === 1 ? 'plaque' : 'plaques'}</span>
            </div>
            <div className="text-xs text-gray-400">
              Updated {collection.updated}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CollectionCard;