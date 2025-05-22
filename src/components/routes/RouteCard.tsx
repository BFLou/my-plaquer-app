// src/components/routes/RouteCard.tsx
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
  onView: (route: RouteData) => void;
  onEdit: (route: RouteData) => void;
  onDuplicate: (route: RouteData) => void;
  onDelete: (route: RouteData) => void;
  onToggleFavorite?: (route: RouteData) => void;
  className?: string;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  className = ''
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
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group ${className}`}
      onClick={() => onView(route)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
            <RouteIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg group-hover:text-green-600 transition-colors line-clamp-1" title={route.name}>
              {route.name}
            </h3>
            {route.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1" title={route.description}>
                {route.description}
              </p>
            )}
          </div>
        </div>
        
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
      
      <div className="space-y-2">
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
    </div>
  );
};

export default RouteCard;