// src/components/plaques/PlaqueListItem.tsx
import React, { useState } from 'react';
import { MapPin, Star, CheckCircle, MoreVertical, Trash2, Plus } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import PlaqueImage from './PlaqueImage';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import AddToCollectionDialog from './AddToCollectionDialog';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PlaqueListItemProps = {
  plaque: Plaque;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onClick?: (plaque: Plaque) => void;
  onMarkVisited?: (id: number) => void;
  onRemovePlaque?: (id: number) => void;
  onAddToRoute?: (plaque: Plaque) => void;
  showSelection?: boolean;
  variant?: 'discover' | 'collection';
  className?: string;
};

export const PlaqueListItem = ({
  plaque,
  isSelected = false,
  onSelect,
  onClick,
  onMarkVisited,
  onRemovePlaque,
  onAddToRoute,
  showSelection = false,
  variant = 'discover',
  className = ''
}: PlaqueListItemProps) => {
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  
  // Use hooks for consistent state management
  const { isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Determine if the plaque is visited and favorited
  const isVisited = plaque.visited || isPlaqueVisited(plaque.id);
  const isFav = isFavorite(plaque.id);

  const handleClick = () => {
    if (onClick) onClick(plaque);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(plaque.id);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect(plaque.id);
  };

  const handleMarkVisited = async () => {
    try {
      await markAsVisited(plaque.id, {
        visitedAt: new Date().toISOString(),
        notes: '',
      });
      
      if (onMarkVisited) onMarkVisited(plaque.id);
      toast.success("Marked as visited");
    } catch (error) {
      console.error("Error marking as visited:", error);
      toast.error("Failed to mark as visited");
    }
  };

  const handleRemove = () => {
    if (onRemovePlaque) onRemovePlaque(plaque.id);
  };

  const handleAddToCollection = () => {
    setShowAddToCollection(true);
  };

  const handleAddToRoute = () => {
    if (onAddToRoute) onAddToRoute(plaque);
  };

  // Handle color for display (merging color and colour fields)
  const plaqueColor = plaque.color || plaque.colour || 'unknown';
  
  // Handle location display (address or custom formatted location)
  const locationDisplay = plaque.location || plaque.address || '';

  // Image source with fallback
  const imageUrl = plaque.image || plaque.main_photo;

  return (
    <Card 
      className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${className}`}
      onClick={handleClick}
    >
      <div className="flex">
        {/* Image - responsive sizing */}
        <div className="relative w-20 h-20 sm:w-32 sm:h-32 shrink-0">
          <PlaqueImage 
            src={imageUrl}
            alt={plaque.title} 
            className="w-full h-full object-cover"
            placeholderClassName="bg-blue-50"
            plaqueColor={plaqueColor}
          />
        </div>
        
        {/* Content */}
        <div className="flex-grow p-3 sm:p-4 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="min-w-0 flex-grow pr-2">
              <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1">
                {plaque.title}
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm flex items-start">
                <MapPin size={12} className="mr-1 mt-0.5 shrink-0" /> 
                <span className="line-clamp-2">{locationDisplay}</span>
              </p>
            </div>
            
            {/* Actions - Mobile and Desktop */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Mobile: Simple buttons */}
              <div className="flex sm:hidden gap-1">
                {!isVisited && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkVisited();
                    }}
                  >
                    <CheckCircle size={14} />
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 w-8 p-0 ${isFav ? 'text-amber-500' : 'text-gray-400'}`}
                  onClick={handleFavoriteClick}
                >
                  <Star size={14} className={isFav ? 'fill-amber-500' : ''} />
                </Button>
              </div>

              {/* Desktop: Dropdown menu */}
              <div className="hidden sm:flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 w-8 p-0 ${isFav ? 'text-amber-500' : 'text-gray-400'}`}
                  onClick={handleFavoriteClick}
                >
                  <Star size={16} className={isFav ? 'fill-amber-500' : ''} />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isVisited && (
                      <DropdownMenuItem onClick={handleMarkVisited}>
                        <CheckCircle size={14} className="mr-2 text-green-600" />
                        Mark as visited
                      </DropdownMenuItem>
                    )}
                    
                    {variant === 'discover' && (
                      <DropdownMenuItem onClick={handleAddToCollection}>
                        <Plus size={14} className="mr-2 text-blue-600" />
                        Add to collection
                      </DropdownMenuItem>
                    )}

                    {onAddToRoute && (
                      <DropdownMenuItem onClick={handleAddToRoute}>
                        <MapPin size={14} className="mr-2 text-blue-600" />
                        Add to route
                      </DropdownMenuItem>
                    )}

                    {variant === 'collection' && onRemovePlaque && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={handleRemove}>
                          <Trash2 size={14} className="mr-2" />
                          Remove from collection
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Selection checkbox */}
              {showSelection && onSelect && (
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer ${
                    isSelected ? 'bg-blue-500 text-white' : 'border border-gray-300'
                  }`}
                  onClick={handleSelectClick}
                >
                  {isSelected && <CheckCircle size={14} />}
                </div>
              )}
            </div>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {plaqueColor && plaqueColor !== "Unknown" && (
              <Badge 
                variant="outline" 
                className={`text-xs
                  ${plaqueColor === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${plaqueColor === 'green' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${plaqueColor === 'brown' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                  ${plaqueColor === 'black' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
                  ${plaqueColor === 'grey' ? 'bg-gray-100 text-gray-700 border-gray-300' : ''}
                `}
              >
                {plaqueColor.charAt(0).toUpperCase() + plaqueColor.slice(1)} Plaque
              </Badge>
            )}
            
            {plaque.lead_subject_primary_role && plaque.lead_subject_primary_role !== "Unknown" && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                {(plaque.lead_subject_primary_role as string).charAt(0).toUpperCase() + 
                 (plaque.lead_subject_primary_role as string).slice(1)}
              </Badge>
            )}
            
            {isVisited && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                <CheckCircle size={10} className="mr-1" /> Visited
              </Badge>
            )}

            {isFav && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                <Star size={10} className="mr-1 fill-amber-600" /> Favorite
              </Badge>
            )}
          </div>
          
          {/* Short description preview - responsive text size */}
          {plaque.inscription && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {plaque.inscription}
            </p>
          )}
        </div>
      </div>

      {/* Add to Collection Dialog */}
      <AddToCollectionDialog
        isOpen={showAddToCollection}
        onClose={() => setShowAddToCollection(false)}
        plaque={plaque}
      />
    </Card>
  );
};

export default PlaqueListItem;