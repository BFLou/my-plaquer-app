// src/components/plaques/ActiveFiltersDisplay.tsx
import React from 'react';
import { X, Circle, MapPin, User, CheckCircle, Star } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterOption = {
  label: string;
  value: string;
  color?: string;
};

type ActiveFiltersDisplayProps = {
  // Selected filters
  selectedColors: string[];
  selectedPostcodes: string[];
  selectedProfessions: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
  
  // Filter options (for display labels)
  colorOptions: FilterOption[];
  postcodeOptions: FilterOption[];
  professionOptions: FilterOption[];
  
  // Actions
  onRemoveColor: (value: string) => void;
  onRemovePostcode: (value: string) => void;
  onRemoveProfession: (value: string) => void;
  onRemoveVisited: () => void;
  onRemoveFavorite: () => void;
  onClearAll: () => void;
  
  className?: string;
};

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  selectedColors,
  selectedPostcodes,
  selectedProfessions,
  onlyVisited,
  onlyFavorites,
  
  colorOptions,
  postcodeOptions,
  professionOptions,
  
  onRemoveColor,
  onRemovePostcode,
  onRemoveProfession,
  onRemoveVisited,
  onRemoveFavorite,
  onClearAll,
  
  className = ''
}) => {
  // Calculate total active filters
  const activeFiltersCount = 
    selectedColors.length + 
    selectedPostcodes.length + 
    selectedProfessions.length + 
    (onlyVisited ? 1 : 0) + 
    (onlyFavorites ? 1 : 0);
  
  if (activeFiltersCount === 0) {
    return null;
  }
  
  return (
    <div className={cn("bg-white rounded-lg p-2 shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center mr-1">
          <span className="text-sm text-gray-700 font-medium">Filters:</span>
        </div>
        
        {/* Color filters */}
        {selectedColors.map(value => {
          const option = colorOptions.find(c => c.value === value);
          return (
            <Badge 
              key={`color-${value}`} 
              variant="outline"
              className="flex items-center gap-1 py-1 px-2 bg-white"
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                value === 'blue' ? "bg-blue-500" :
                value === 'green' ? "bg-green-500" :
                value === 'brown' ? "bg-amber-700" :
                value === 'black' ? "bg-gray-800" :
                value === 'gray' ? "bg-gray-600" :
                "bg-blue-500"
              )}></div>
              <span className="text-xs">{option?.label || value}</span>
              <button
                onClick={() => onRemoveColor(value)}
                className="ml-1 rounded-full hover:bg-gray-100 h-4 w-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          );
        })}
        
        {/* Location filters */}
        {selectedPostcodes.map(value => {
          const option = postcodeOptions.find(p => p.value === value);
          return (
            <Badge 
              key={`location-${value}`} 
              variant="outline"
              className="flex items-center gap-1 py-1 px-2 bg-white"
            >
              <MapPin size={10} className="text-blue-500" />
              <span className="text-xs">{option?.label || value}</span>
              <button
                onClick={() => onRemovePostcode(value)}
                className="ml-1 rounded-full hover:bg-gray-100 h-4 w-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          );
        })}
        
        {/* Profession filters */}
        {selectedProfessions.map(value => {
          const option = professionOptions.find(p => p.value === value);
          return (
            <Badge 
              key={`profession-${value}`} 
              variant="outline"
              className="flex items-center gap-1 py-1 px-2 bg-white"
            >
              <User size={10} className="text-blue-500" />
              <span className="text-xs">{option?.label || value}</span>
              <button
                onClick={() => onRemoveProfession(value)}
                className="ml-1 rounded-full hover:bg-gray-100 h-4 w-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          );
        })}
        
        {/* Additional filters */}
        {onlyVisited && (
          <Badge 
            variant="outline"
            className="flex items-center gap-1 py-1 px-2 bg-white"
          >
            <CheckCircle size={10} className="text-blue-500" />
            <span className="text-xs">Visited</span>
            <button
              onClick={onRemoveVisited}
              className="ml-1 rounded-full hover:bg-gray-100 h-4 w-4 flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </Badge>
        )}
        
        {onlyFavorites && (
          <Badge 
            variant="outline"
            className="flex items-center gap-1 py-1 px-2 bg-white"
          >
            <Star size={10} className="text-blue-500" />
            <span className="text-xs">Favorites</span>
            <button
              onClick={onRemoveFavorite}
              className="ml-1 rounded-full hover:bg-gray-100 h-4 w-4 flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </Badge>
        )}
        
        {/* Clear all button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll}
          className="h-7 px-2 ml-auto text-xs text-blue-600 hover:text-blue-800"
        >
          Clear all
        </Button>
      </div>
    </div>
  );
};

export default ActiveFiltersDisplay;