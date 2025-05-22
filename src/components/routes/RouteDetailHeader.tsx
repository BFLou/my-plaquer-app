// src/components/routes/RouteDetailHeader.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  MoreVertical, 
  Edit, 
  Copy, 
  Trash2, 
  Share,
  MapPin,
  Clock,
  Route as RouteIcon
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

interface RouteDetailHeaderProps {
  route: RouteData;
  onBack: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onShare?: () => void;
  isLoading?: boolean;
}

const RouteDetailHeader: React.FC<RouteDetailHeaderProps> = ({
  route,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onShare,
  isLoading = false
}) => {
  const navigate = useNavigate();

  // Calculate estimated walking time (12 minutes per km)
  const walkingTime = Math.ceil(route.total_distance * 12);

  return (
    <section className="relative bg-gradient-to-br from-green-600 to-green-700 text-white py-8 px-4 overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
        <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
        <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white"></div>
      </div>
      
      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Back button and title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/20 h-10 w-10 p-0 shrink-0"
            >
              <ArrowLeft size={20} />
            </Button>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold truncate" title={route.name}>{route.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <RouteIcon size={14} />
                  <span>{route.points.length} stops</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{route.total_distance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>~{walkingTime} min walk</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFavorite}
              className="text-white hover:bg-white/20"
              disabled={isLoading}
            >
              <Star 
                size={16} 
                className={route.is_favorite ? "fill-current" : ""} 
              />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-white/20"
                  disabled={isLoading}
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit size={16} className="mr-2" />
                  Edit Route
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy size={16} className="mr-2" />
                  Duplicate Route
                </DropdownMenuItem>
                {onShare && (
                  <DropdownMenuItem onClick={onShare}>
                    <Share size={16} className="mr-2" />
                    Share Route
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Route
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Route description */}
        {route.description && (
          <p className="text-lg opacity-90 mb-4 max-w-3xl">
            {route.description}
          </p>
        )}
        
        {/* Route metadata */}
        <div className="flex flex-wrap items-center gap-3">
          {route.views && route.views > 0 && (
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              {route.views} views
            </Badge>
          )}
          
          <span className="text-sm opacity-75">
            Updated {formatTimeAgo(route.updated_at)}
          </span>
        </div>
      </div>
    </section>
  );
};

export default RouteDetailHeader;