// src/components/discover/DiscoverFilters.tsx - UPDATED: With distance filter indicator
import React from 'react';
import { X, Crosshair, MapPin } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { capitalizeWords } from '@/utils/stringUtils';
import DiscoverFilterDialog from '../plaques/DiscoverFilterDialog';

// NEW: Distance filter interface
interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

interface DiscoverFiltersProps {
  urlState: {
    search: string;
    colors: string[];
    postcodes: string[];
    professions: string[];
    onlyVisited: boolean;
    onlyFavorites: boolean;
  };
  activeFiltersCount: number;
  activeLocation: [number, number] | null;
  maxDistance: number;
  hideOutsidePlaques: boolean;
  formatDistance: (distance: number) => string;
  onRemoveFilter: (filters: any) => void;
  onResetFilters: () => void;
  filtersOpen: boolean;
  onCloseFilters: () => void;
  filterOptions: {
    postcodeOptions: any[];
    colorOptions: any[];
    professionOptions: any[];
  };
  onApplyFilters: (filters: any) => void;
  // NEW: Distance filter props
  distanceFilter: DistanceFilter;
  onClearDistanceFilter: () => void;
}

const DiscoverFilters: React.FC<DiscoverFiltersProps> = ({
  urlState,
  activeFiltersCount,
  activeLocation,
  maxDistance,
  hideOutsidePlaques,
  formatDistance,
  onRemoveFilter,
  onResetFilters,
  filtersOpen,
  onCloseFilters,
  filterOptions,
  onApplyFilters,
  // NEW: Distance filter props
  distanceFilter,
  onClearDistanceFilter
}) => {
  if (activeFiltersCount === 0) {
    return null;
  }

  return (
    <>
      {/* Active Filters Display */}
      <div className="container mx-auto px-4 mt-3">
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          
          {/* Color filters */}
          {urlState.colors.map(color => (
            <Badge key={color} variant="secondary" className="gap-1">
              {capitalizeWords(color)}
              <button
                onClick={() => onRemoveFilter({ 
                  colors: urlState.colors.filter(c => c !== color) 
                })}
                className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
          
          {/* Postcode filters */}
          {urlState.postcodes.map(postcode => (
            <Badge key={postcode} variant="secondary" className="gap-1">
              {postcode}
              <button
                onClick={() => onRemoveFilter({ 
                  postcodes: urlState.postcodes.filter(p => p !== postcode) 
                })}
                className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
          
          {/* Profession filters */}
          {urlState.professions.map(profession => (
            <Badge key={profession} variant="secondary" className="gap-1">
              {capitalizeWords(profession)}
              <button
                onClick={() => onRemoveFilter({ 
                  professions: urlState.professions.filter(p => p !== profession) 
                })}
                className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
          
          {/* Visited filter */}
          {urlState.onlyVisited && (
            <Badge variant="secondary" className="gap-1">
              Visited Only
              <button
                onClick={() => onRemoveFilter({ onlyVisited: false })}
                className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          )}
          
          {/* Favorites filter */}
          {urlState.onlyFavorites && (
            <Badge variant="secondary" className="gap-1">
              Favorites Only
              <button
                onClick={() => onRemoveFilter({ onlyFavorites: false })}
                className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          )}
          
          {/* NEW: Distance filter indicator */}
          {distanceFilter.enabled && distanceFilter.center && distanceFilter.locationName && (
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 border-green-200">
              <MapPin size={12} />
              <span className="font-medium">
                {distanceFilter.locationName}
              </span>
              <span className="text-xs opacity-75">
                ({distanceFilter.radius < 1 
                  ? `${Math.round(distanceFilter.radius * 1000)}m` 
                  : `${distanceFilter.radius}km`})
              </span>
              <button
                onClick={onClearDistanceFilter}
                className="ml-1 hover:bg-green-300 rounded-full w-4 h-4 flex items-center justify-center"
                title="Clear distance filter"
              >
                <X size={10} />
              </button>
            </Badge>
          )}
          
          {/* LEGACY: Keep old distance filter for backward compatibility */}
          {activeLocation && hideOutsidePlaques && !distanceFilter.enabled && (
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
              <Crosshair size={12} />
              Within {formatDistance(maxDistance)}
              <button
                onClick={() => {
                  // This should clear the distance filter
                  // Implementation depends on your distance filter logic
                }}
                className="ml-1 hover:bg-green-300 rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </Badge>
          )}
          
          {/* Clear all button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-gray-600 hover:text-gray-800 ml-auto"
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* Filter Dialog */}
      <DiscoverFilterDialog
        isOpen={filtersOpen}
        onClose={onCloseFilters}
        
        postcodes={filterOptions.postcodeOptions}
        selectedPostcodes={urlState.postcodes}
        onPostcodesChange={(values) => onApplyFilters({ postcodes: values })}
        
        colors={filterOptions.colorOptions}
        selectedColors={urlState.colors}
        onColorsChange={(values) => onApplyFilters({ colors: values })}
        
        professions={filterOptions.professionOptions}
        selectedProfessions={urlState.professions}
        onProfessionsChange={(values) => onApplyFilters({ professions: values })}
        
        onlyVisited={urlState.onlyVisited}
        onVisitedChange={(value) => onApplyFilters({ onlyVisited: value })}
        
        onlyFavorites={urlState.onlyFavorites}
        onFavoritesChange={(value) => onApplyFilters({ onlyFavorites: value })}
        
        onApply={onCloseFilters}
        onReset={onResetFilters}
      />
    </>
  );
};

export default DiscoverFilters;