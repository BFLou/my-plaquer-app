// src/components/routes/RouteCard.tsx - Enhanced version
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
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTimeAgo } from '@/utils/timeUtils';
import { RouteData } from '@/hooks/useRoutes';

interface RouteCardProps {
  route: RouteData;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onView: (route: RouteData) => void;
  onEdit: (route: RouteData) => void;
  onDuplicate: (route: RouteData) => void;
  onDelete: (route: RouteData) => void;
  onToggleFavorite?: (route: RouteData) => void;
  showSelection?: boolean;
  className?: string;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected = false,
  onToggleSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  showSelection = false,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Calculate walking time (rough estimate: 12 minutes per km)
  const walkingTime = Math.ceil(route.total_distance * 12);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  // Handle click events
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (onToggleSelect) onToggleSelect();
    } else if (!e.target.closest('button') && !e.target.closest('[role="menuitem"]')) {
      onView(route);
    }
  };

  return (
    <div 
      className={`bg-white border rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group ${
        isSelected ? 'ring-2 ring-green-500 border-green-200' : ''
      } ${className}`}
      onClick={handleClick}
    >
      {/* Top color bar */}
      <div className="h-2 w-full bg-green-500"></div>
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showSelection && onToggleSelect && (
              <div 
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect();
                }}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-300 hover:border-green-400'
                }`}>
                  {isSelected && <CheckCircle size={14} />}
                </div>
              </div>
            )}
            
            <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
              <RouteIcon size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg group-hover:text-green-600 transition-colors line-clamp-1" title={route.name}>
                  {route.name}
                </h3>
                {route.is_favorite && (
                  <Star size={16} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Updated {formatTimeAgo(route.updated_at)}
              </p>
            </div>
          </div>

          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8 p-0"
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
        
        {/* Description */}
        {route.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{route.description}</p>
        )}
        
        {/* Route Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
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
        </div>
        
        {/* Footer with badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">

            
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              Private
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteCard;