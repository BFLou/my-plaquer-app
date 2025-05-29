// src/components/maps/features/MapFilterButton.tsx - NEW: Filter button for map view
import React, { useState, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import DiscoverFilterDialog from '../../plaques/DiscoverFilterDialog';
import { capitalizeWords } from '@/utils/stringUtils';

// Distance filter interface
interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

interface MapFilterButtonProps {
  plaques: Plaque[];
  visiblePlaques: Plaque[];
  distanceFilter: DistanceFilter;
  
  // Filter state
  selectedColors: string[];
  selectedPostcodes: string[];
  selectedProfessions: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
  
  // Filter handlers
  onColorsChange: (values: string[]) => void;
  onPostcodesChange: (values: string[]) => void;
  onProfessionsChange: (values: string[]) => void;
  onVisitedChange: (value: boolean) => void;
  onFavoritesChange: (value: boolean) => void;
  onResetFilters: () => void;
  
  // External functions
  isPlaqueVisited?: (id: number) => boolean;
  isFavorite?: (id: number) => boolean;
  
  className?: string;
}

export const MapFilterButton: React.FC<MapFilterButtonProps> = ({
  plaques,
  visiblePlaques,
  distanceFilter,
  selectedColors,
  selectedPostcodes,
  selectedProfessions,
  onlyVisited,
  onlyFavorites,
  onColorsChange,
  onPostcodesChange,
  onProfessionsChange,
  onVisitedChange,
  onFavoritesChange,
  onResetFilters,
  isPlaqueVisited,
  isFavorite,
  className = ''
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return selectedColors.length + 
           selectedPostcodes.length + 
           selectedProfessions.length + 
           (onlyVisited ? 1 : 0) + 
           (onlyFavorites ? 1 : 0);
  }, [selectedColors.length, selectedPostcodes.length, selectedProfessions.length, onlyVisited, onlyFavorites]);

  // Generate filter options from all plaques
  const filterOptions = useMemo(() => {
    const postcodeCount: Record<string, number> = {};
    const colorCount: Record<string, number> = {};
    const professionCount: Record<string, number> = {};
    
    plaques.forEach(plaque => {
      if (plaque.postcode && plaque.postcode !== "Unknown") {
        postcodeCount[plaque.postcode] = (postcodeCount[plaque.postcode] || 0) + 1;
      }
      
      const color = plaque.color?.toLowerCase();
      if (color && color !== "unknown") {
        colorCount[color] = (colorCount[color] || 0) + 1;
      }
      
      if (plaque.profession && plaque.profession !== "Unknown") {
        professionCount[plaque.profession] = (professionCount[plaque.profession] || 0) + 1;
      }
    });
    
    return {
      postcodeOptions: Object.entries(postcodeCount)
        .map(([value, count]) => ({ label: value, value, count }))
        .sort((a, b) => b.count - a.count),
      
      colorOptions: Object.entries(colorCount)
        .map(([value, count]) => ({
          label: capitalizeWords(value),
          value,
          count
        }))
        .sort((a, b) => b.count - a.count),
      
      professionOptions: Object.entries(professionCount)
        .map(([value, count]) => ({
          label: capitalizeWords(value),
          value,
          count
        }))
        .sort((a, b) => b.count - a.count)
    };
  }, [plaques]);

  // Active filters summary for button display
  const activeFiltersSummary = useMemo(() => {
    const filters = [];
    
    if (selectedColors.length > 0) {
      filters.push(`${selectedColors.length} color${selectedColors.length > 1 ? 's' : ''}`);
    }
    
    if (selectedPostcodes.length > 0) {
      filters.push(`${selectedPostcodes.length} location${selectedPostcodes.length > 1 ? 's' : ''}`);
    }
    
    if (selectedProfessions.length > 0) {
      filters.push(`${selectedProfessions.length} profession${selectedProfessions.length > 1 ? 's' : ''}`);
    }
    
    if (onlyVisited) {
      filters.push('visited only');
    }
    
    if (onlyFavorites) {
      filters.push('favorites only');
    }
    
    return filters;
  }, [selectedColors, selectedPostcodes, selectedProfessions, onlyVisited, onlyFavorites]);

  return (
    <>
      {/* Filter Button */}
      <div className={`relative ${className}`}>
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          size="sm"
          className="shadow-lg backdrop-blur-sm bg-white/95 border border-gray-200 hover:bg-gray-50 min-w-[120px]"
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter size={16} className={activeFiltersCount > 0 ? "text-white" : "text-gray-600"} />
          <span className={`ml-2 ${activeFiltersCount > 0 ? "text-white" : "text-gray-700"}`}>
            Filters
          </span>
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-white text-blue-600 text-xs px-1.5 py-0.5">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Active Filters Preview */}
        {activeFiltersCount > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 min-w-[280px] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 z-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
              >
                <X size={12} />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {activeFiltersSummary.map((filter, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {filter}
                </Badge>
              ))}
            </div>
            
            {/* Results summary */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-600">
                Showing <span className="font-medium">{visiblePlaques.length}</span> of{' '}
                <span className="font-medium">{plaques.length}</span> plaques
                {distanceFilter.enabled && distanceFilter.locationName && (
                  <span className="text-blue-600">
                    {' '}in {distanceFilter.locationName}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      <DiscoverFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        
        // Filter options
        postcodes={filterOptions.postcodeOptions}
        selectedPostcodes={selectedPostcodes}
        onPostcodesChange={onPostcodesChange}
        
        colors={filterOptions.colorOptions}
        selectedColors={selectedColors}
        onColorsChange={onColorsChange}
        
        professions={filterOptions.professionOptions}
        selectedProfessions={selectedProfessions}
        onProfessionsChange={onProfessionsChange}
        
        // Toggle options
        onlyVisited={onlyVisited}
        onVisitedChange={onVisitedChange}
        
        onlyFavorites={onlyFavorites}
        onFavoritesChange={onFavoritesChange}
        
        // Actions
        onApply={() => setIsFilterOpen(false)}
        onReset={() => {
          onResetFilters();
          setIsFilterOpen(false);
        }}
        
        // Distance filter integration
        distanceFilter={distanceFilter}
        allPlaques={plaques}
        isPlaqueVisited={isPlaqueVisited}
        isFavorite={isFavorite}
      />
    </>
  );
};