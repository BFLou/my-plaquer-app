// src/components/routes/RouteListItem.tsx
import React, { useState } from 'react';
import { 
  Route as RouteIcon, 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Star,
  MapPin,
  Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTimeAgo } from '@/utils/timeUtils';
import { RouteData } from '@/hooks/useRoutes';

interface RouteListItemProps {
  route: RouteData;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onView: (route: RouteData) => void;
  onEdit: (route: RouteData) => void;
  onDuplicate: (route: RouteData) => void;
  onDelete: (route: RouteData) => void;
  onToggleFavorite?: (route: RouteData) => void;
  showSelection?: boolean;
}

const RouteListItem: React.FC<RouteListItemProps> = ({
  route,
  isSelected = false,
  onToggleSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  showSelection = true
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Calculate walking time (rough estimate: 12 minutes per km)
  const walkingTime = Math.ceil(route.total_distance * 12);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <div 
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group ${
        isSelected ? 'ring-2 ring-green-500 border-green-200' : ''
      }`}
      onClick={() => onView(route)}
    >
      <div className="flex items-center gap-4">
        {/* Selection checkbox */}
        {showSelection && onToggleSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />
        )}
        
        {/* Route icon */}
        <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
          <RouteIcon size={20} />
        </div>
        
        {/* Route info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg group-hover:text-green-600 transition-colors line-clamp-1" title={route.name}>
                {route.name}
              </h3>
              {route.description && (
                <p className="text-sm text-gray-600 line-clamp-1 mt-1" title={route.description}>
                  {route.description}
                </p>
              )}
            </div>
            
            {/* Favorite button */}
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(route);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <Star 
                  size={16} 
                  className={route.is_favorite ? "fill-current text-yellow-500" : ""} 
                />
              </Button>
            )}
          </div>
          
          {/* Route stats */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{route.points.length} stops</span>
            </div>
            <div className="flex items-center gap-1">
              <RouteIcon size={14} />
              <span>{route.total_distance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>~{walkingTime} min</span>
            </div>
          </div>
          
          {/* Badges and metadata */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
            </div>
            
            <span className="text-xs text-gray-500">
              {formatTimeAgo(route.updated_at || route.created_at)}
            </span>
          </div>
        </div>
        
        {/* Actions menu */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => onView(route));
            }}>
              <Eye size={16} className="mr-2" />
              View Route
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => onEdit(route));
            }}>
              <Edit size={16} className="mr-2" />
              Edit Route
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => onDuplicate(route));
            }}>
              <Copy size={16} className="mr-2" />
              Duplicate
            </DropdownMenuItem>
            {onToggleFavorite && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleMenuAction(() => onToggleFavorite(route));
                }}>
                  <Star size={16} className="mr-2" />
                  {route.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction(() => onDelete(route));
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Route
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default RouteListItem;