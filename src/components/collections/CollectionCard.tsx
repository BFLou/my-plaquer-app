// src/components/collections/CollectionCard.tsx - COMPLETE MOBILE OPTIMIZED
import React from 'react';
import { MoreHorizontal, Star, CheckCircle, MapPin } from 'lucide-react';
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTimeAgo, getPlaqueCount } from '../../utils/collectionHelpers';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

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
  const mobile = isMobile();
  const plaqueCount = getPlaqueCount(collection);
  
  // Handle click events with mobile optimization
  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (mobile) triggerHapticFeedback('selection');
      onToggleSelect(collection.id);
    } else if (!e.target.closest('button') && onClick) {
      if (mobile) triggerHapticFeedback('light');
      onClick(collection.id);
    }
  };
  
  // Handle menu operations with haptic feedback
  const handleMenuOperation = (e, operation) => {
    e.stopPropagation();
    if (mobile) triggerHapticFeedback('selection');
    if (operation) operation(collection.id);
  };
  
  // Handle favorite toggle with haptic feedback
  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (mobile) {
      triggerHapticFeedback(collection.is_favorite ? 'light' : 'success');
    }
    if (onToggleFavorite) onToggleFavorite(collection.id);
  };
  
  return (
    <div 
      className={`relative bg-white rounded-lg shadow hover:shadow-md transition-all h-full ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${className} group cursor-pointer overflow-hidden ${
        mobile ? 'active:scale-[0.98] active:shadow-sm' : ''
      }`}
      onClick={handleClick}
      style={{
        minHeight: mobile ? '140px' : '120px',
        touchAction: 'manipulation'
      }}
    >
      {/* Top color bar - Mobile optimized */}
      <div className={`${mobile ? 'h-3' : 'h-2'} w-full ${collection.color}`}></div>
      
      <div className={mobile ? 'p-5' : 'p-4'}>
        {/* Header - Mobile optimized */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`${mobile ? 'h-16 w-16' : 'h-12 w-12'} rounded-lg ${collection.color} flex items-center justify-center text-white ${mobile ? 'text-3xl' : 'text-2xl'}`}>
              {collection.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold ${mobile ? 'text-xl' : 'text-lg'} text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1`}>
                {collection.name}
              </h3>
              <p className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500`}>
                Updated {formatTimeAgo(collection.updated_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            {collection.is_favorite && (
              <MobileButton
                variant="ghost"
                size="sm"
                className={`${mobile ? 'h-10 w-10' : 'h-8 w-8'} p-0 mr-2 text-amber-400 hover:text-amber-500`}
                onClick={handleFavoriteToggle}
              >
                <Star size={mobile ? 20 : 16} className="fill-current" />
              </MobileButton>
            )}
            {isSelected && (
              <div className={`bg-blue-100 text-blue-600 p-1 rounded-full mr-2 ${mobile ? 'p-2' : ''}`}>
                <CheckCircle size={mobile ? 18 : 14} />
              </div>
            )}
            
            {/* Dropdown Menu - Mobile optimized */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MobileButton 
                  variant="ghost" 
                  size="sm" 
                  className={`${mobile ? 'h-10 w-10' : 'h-8 w-8'} rounded-full hover:bg-gray-100 p-0`}
                >
                  <span className="sr-only">Options</span>
                  <MoreHorizontal size={mobile ? 20 : 16} />
                </MobileButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={mobile ? 'w-56' : 'w-48'}>
                <DropdownMenuItem 
                  onClick={(e) => handleMenuOperation(e, onEdit)}
                  className={mobile ? 'py-3 text-base' : ''}
                >
                  Edit Collection
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => handleMenuOperation(e, onDuplicate)}
                  className={mobile ? 'py-3 text-base' : ''}
                >
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => handleMenuOperation(e, onToggleFavorite)}
                  className={mobile ? 'py-3 text-base' : ''}
                >
                  {collection.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className={`text-red-600 focus:text-red-600 focus:bg-red-50 ${mobile ? 'py-3 text-base' : ''}`}
                  onClick={(e) => handleMenuOperation(e, onDelete)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Description - Mobile optimized */}
        {collection.description && (
          <p className={`${mobile ? 'text-base' : 'text-sm'} text-gray-600 mb-4 line-clamp-2`}>
            {collection.description}
          </p>
        )}
        
        {/* Footer with info - Mobile optimized */}
        <div className="flex items-center justify-between mt-4">
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1 bg-gray-50 ${mobile ? 'py-2 px-3 text-sm' : 'py-1 px-2'}`}
          >
            <MapPin size={mobile ? 14 : 12} /> 
            {plaqueCount} {plaqueCount === 1 ? 'plaque' : 'plaques'}
          </Badge>
          
          {/* Mobile-specific additional info */}
          {mobile && collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 max-w-32">
              {collection.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {collection.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{collection.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Mobile-only quick actions bar */}
        {mobile && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(collection.id);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 h-8"
            >
              Edit
            </MobileButton>
            
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                triggerHapticFeedback(collection.is_favorite ? 'light' : 'success');
                if (onToggleFavorite) onToggleFavorite(collection.id);
              }}
              className={`text-xs h-8 ${collection.is_favorite ? 'text-amber-600' : 'text-gray-600'}`}
            >
              {collection.is_favorite ? (
                <>
                  <Star size={12} className="fill-current mr-1" />
                  Favorited
                </>
              ) : (
                <>
                  <Star size={12} className="mr-1" />
                  Favorite
                </>
              )}
            </MobileButton>
            
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(collection.id);
              }}
              className="text-xs text-gray-600 hover:text-gray-700 h-8"
            >
              View
            </MobileButton>
          </div>
        )}
      </div>
      
      {/* Mobile-specific touch feedback overlay */}
      {mobile && (
        <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-5 transition-opacity pointer-events-none" />
      )}
      
      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .collection-card {
            margin-bottom: 1rem;
          }
          
          .collection-card:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
          }
          
          .collection-card .dropdown-trigger {
            min-height: 44px;
            min-width: 44px;
          }
          
          .collection-card .quick-action-button {
            min-height: 44px;
            padding: 0.5rem 1rem;
          }
          
          .collection-card .icon-container {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }
        
        /* Touch optimization */
        .collection-card {
          touch-action: manipulation;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
          -webkit-touch-callout: none;
          user-select: none;
        }
        
        /* Improve accessibility on mobile */
        @media (prefers-reduced-motion: reduce) {
          .collection-card {
            transition: none;
          }
          
          .collection-card:active {
            transform: none;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .collection-card {
            border: 2px solid #000;
          }
          
          .collection-card.selected {
            border-color: #0066cc;
            border-width: 3px;
          }
        }
      `}</style>
    </div>
  );
};

export default CollectionCard;