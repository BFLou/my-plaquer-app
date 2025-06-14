// src/components/collections/CollectionListItem.tsx - COMPLETE MOBILE OPTIMIZED
import { CheckCircle, Star, MoreHorizontal, MapPin } from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile-button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatTimeAgo, getPlaqueCount } from '../../utils/collectionHelpers';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

// FIXED: Added proper TypeScript interfaces
interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_favorite?: boolean;
  updated_at: string | Date;
  tags?: string[];
}

interface CollectionListItemProps {
  collection: Collection;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

const CollectionListItem: React.FC<CollectionListItemProps> = ({
  collection,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onDelete,
  onClick,
  className = '',
}) => {
  const mobile = isMobile();

  // Handle click events with mobile optimization - FIXED: Added proper event typing
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (mobile) triggerHapticFeedback('selection');
      if (onToggleSelect) onToggleSelect(collection.id);
    } else if (!(e.target as Element).closest('button') && onClick) {
      if (mobile) triggerHapticFeedback('light');
      onClick(collection.id);
    }
  };

  // Handle menu operations with haptic feedback - FIXED: Added proper typing
  const handleMenuOperation = (
    e: React.MouseEvent,
    operation?: (id: string) => void
  ) => {
    e.stopPropagation();
    if (mobile) triggerHapticFeedback('selection');
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
        blue: '#3b82f6',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#eab308',
        purple: '#a855f7',
        pink: '#ec4899',
        indigo: '#6366f1',
        gray: '#6b7280',
        amber: '#f59e0b',
        lime: '#84cc16',
        emerald: '#10b981',
        teal: '#14b8a6',
        cyan: '#06b6d4',
        sky: '#0ea5e9',
        violet: '#8b5cf6',
        fuchsia: '#d946ef',
        rose: '#f43f5e',
        orange: '#f97316',
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
      borderLeftWidth: mobile ? '6px' : '4px',
    };
  };

  return (
    <div
      className={`bg-white rounded-lg shadow hover:shadow-md transition ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } overflow-hidden cursor-pointer group ${className} ${
        mobile ? 'active:scale-[0.99] active:shadow-sm' : ''
      }`}
      onClick={handleClick}
      style={{
        ...getLeftBorderStyle(),
        minHeight: mobile ? '80px' : '60px',
        touchAction: 'manipulation',
      }}
    >
      <div className={`flex items-center ${mobile ? 'p-4' : 'p-3'}`}>
        {/* Collection Icon - Mobile optimized */}
        <div
          className={`${mobile ? 'h-16 w-16' : 'h-12 w-12'} rounded-lg ${collection.color} flex items-center justify-center text-white ${mobile ? 'text-3xl' : 'text-2xl'} mr-4 flex-shrink-0 shadow-sm`}
        >
          {collection.icon}
        </div>

        {/* Content Section - Mobile optimized */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center">
            <h3
              className={`font-semibold text-gray-800 truncate mr-2 ${mobile ? 'text-lg' : 'text-base'}`}
            >
              {collection.name}
            </h3>
            {collection.is_favorite && (
              <Star
                size={mobile ? 18 : 16}
                className="fill-amber-400 text-amber-400 flex-shrink-0"
              />
            )}
            {isSelected && (
              <div
                className={`bg-blue-100 text-blue-600 p-1 rounded-full ml-1 flex-shrink-0 ${mobile ? 'p-1.5' : ''}`}
              >
                <CheckCircle size={mobile ? 16 : 14} />
              </div>
            )}
          </div>

          {/* Description - Mobile responsive */}
          {collection.description && (
            <p
              className={`${mobile ? 'text-base' : 'text-sm'} text-gray-600 truncate ${mobile ? 'mt-1' : ''}`}
            >
              {collection.description}
            </p>
          )}

          {/* Metadata Row - Mobile optimized */}
          <div
            className={`flex items-center gap-3 ${mobile ? 'mt-2' : 'mt-1'}`}
          >
            <Badge
              variant="outline"
              className={`flex items-center gap-1 bg-gray-50 ${mobile ? 'py-1 px-2' : 'py-0.5'}`}
            >
              <MapPin size={mobile ? 14 : 12} />
              {plaqueCount}
            </Badge>
            <span className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-400`}>
              Updated {formatTimeAgo(collection.updated_at)}
            </span>
          </div>

          {/* Tags on Mobile - FIXED: Added proper typing for tag parameter */}
          {mobile && collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {collection.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {collection.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{collection.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions Section - Mobile optimized */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile Quick Actions - FIXED: Added proper event typing */}
          {mobile && (
            <div className="flex flex-col gap-1 mr-2">
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  triggerHapticFeedback(
                    collection.is_favorite ? 'light' : 'success'
                  );
                  if (onToggleFavorite) onToggleFavorite(collection.id);
                }}
                className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600"
              >
                <Star
                  size={14}
                  className={collection.is_favorite ? 'fill-current' : ''}
                />
              </MobileButton>

              <MobileButton
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  triggerHapticFeedback('selection');
                  if (onEdit) onEdit(collection.id);
                }}
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
              >
                ✏️
              </MobileButton>
            </div>
          )}

          {/* Dropdown Menu - Mobile optimized */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MobileButton
                variant="ghost"
                size="sm"
                className={`${mobile ? 'h-12 w-12' : 'h-8 w-8'} rounded-full hover:bg-gray-100 p-0 flex-shrink-0 ml-2`}
              >
                <span className="sr-only">Options</span>
                <MoreHorizontal size={mobile ? 20 : 16} />
              </MobileButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={mobile ? 'w-56' : 'w-48'}
            >
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
                {collection.is_favorite
                  ? 'Remove Favorite'
                  : 'Add to Favorites'}
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

      {/* Mobile-specific touch feedback overlay */}
      {mobile && (
        <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-5 transition-opacity pointer-events-none" />
      )}

      {/* FIXED: Removed jsx prop - Use CSS modules or styled-components for complex styles */}
    </div>
  );
};

export default CollectionListItem;
