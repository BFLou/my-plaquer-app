// ============================================================================
// 1. MOBILE-OPTIMIZED DISCOVERFILTERS.TSX
// ============================================================================

// src/components/discover/DiscoverFilters.tsx
import React, { useState } from 'react';
import { X, MapPin, Filter, ChevronDown } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { capitalizeWords } from '@/utils/stringUtils';
import DiscoverFilterDialog from '../plaques/DiscoverFilterDialog';

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
  distanceFilter: DistanceFilter;
  onClearDistanceFilter: () => void;
}

const DiscoverFilters: React.FC<DiscoverFiltersProps> = ({
  urlState,
  activeFiltersCount,

  onRemoveFilter,
  onResetFilters,
  filtersOpen,
  onCloseFilters,
  filterOptions,
  onApplyFilters,
  distanceFilter,
  onClearDistanceFilter
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (activeFiltersCount === 0) {
    return null;
  }

  // Group filters for mobile display
  const allActiveFilters = [
    ...urlState.colors.map(color => ({ type: 'color', value: color, label: capitalizeWords(color) })),
    ...urlState.postcodes.map(postcode => ({ type: 'postcode', value: postcode, label: postcode })),
    ...urlState.professions.map(profession => ({ type: 'profession', value: profession, label: capitalizeWords(profession) })),
    ...(urlState.onlyVisited ? [{ type: 'visited', value: 'visited', label: 'Visited Only' }] : []),
    ...(urlState.onlyFavorites ? [{ type: 'favorites', value: 'favorites', label: 'Favorites Only' }] : []),
    ...(distanceFilter.enabled && distanceFilter.center && distanceFilter.locationName ? 
      [{ type: 'distance', value: 'distance', label: `${distanceFilter.locationName} (${distanceFilter.radius < 1 ? `${Math.round(distanceFilter.radius * 1000)}m` : `${distanceFilter.radius}km`})` }] : [])
  ];

  const removeFilter = (filter: any) => {
    switch (filter.type) {
      case 'color':
        onRemoveFilter({ colors: urlState.colors.filter(c => c !== filter.value) });
        break;
      case 'postcode':
        onRemoveFilter({ postcodes: urlState.postcodes.filter(p => p !== filter.value) });
        break;
      case 'profession':
        onRemoveFilter({ professions: urlState.professions.filter(p => p !== filter.value) });
        break;
      case 'visited':
        onRemoveFilter({ onlyVisited: false });
        break;
      case 'favorites':
        onRemoveFilter({ onlyFavorites: false });
        break;
      case 'distance':
        onClearDistanceFilter();
        break;
    }
  };

  return (
    <>
      {/* Mobile-First Active Filters Display */}
      <div className="container mx-auto px-4 mt-3">
        <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
          {/* Filter Summary Bar */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Filter className="text-gray-500 flex-shrink-0" size={16} />
              <span className="text-sm font-medium text-gray-700">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </span>
              
              {/* Show first 2 filters on mobile */}
              <div className="hidden sm:flex items-center gap-1 overflow-hidden">
                {allActiveFilters.slice(0, 2).map((filter) => (
                  <Badge key={`${filter.type}-${filter.value}`} variant="secondary" className="gap-1 text-xs">
                    <span className="truncate max-w-[100px]">{filter.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilter(filter);
                      }}
                      className="ml-1 hover:bg-gray-300 rounded-full w-3 h-3 flex items-center justify-center min-w-[12px] min-h-[12px]"
                    >
                      <X size={8} />
                    </button>
                  </Badge>
                ))}
                {allActiveFilters.length > 2 && (
                  <span className="text-xs text-gray-500">+{allActiveFilters.length - 2} more</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 min-w-[44px] min-h-[32px]">
                  <span className="text-xs mr-1 sm:hidden">View</span>
                  <span className="text-xs mr-1 hidden sm:inline">
                    {isCollapsed ? 'Show' : 'Hide'}
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} 
                  />
                </Button>
              </CollapsibleTrigger>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="text-gray-600 hover:text-gray-800 h-8 px-2 min-w-[44px] min-h-[32px]"
              >
                <span className="text-xs">Clear all</span>
              </Button>
            </div>
          </div>

          {/* Expanded Filters List */}
          <CollapsibleContent className="mt-2">
            <div className="p-3 bg-white border rounded-lg space-y-3">
              {/* All Active Filters */}
              <div className="flex flex-wrap gap-2">
                {allActiveFilters.map((filter, index) => (
                  <Badge 
                    key={`${filter.type}-${filter.value}-${index}`} 
                    variant="secondary" 
                    className={`gap-1 ${
                      filter.type === 'distance' ? 'bg-green-100 text-green-800 border-green-200' : ''
                    }`}
                  >
                    {filter.type === 'distance' && <MapPin size={12} />}
                    <span className="break-words">{filter.label}</span>
                    <button
                      onClick={() => removeFilter(filter)}
                      className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center min-w-[16px] min-h-[16px]"
                      title={`Remove ${filter.label} filter`}
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyFilters({})} // Opens filter dialog
                  className="text-xs h-8 min-w-[44px] min-h-[32px]"
                >
                  <Filter size={12} className="mr-1" />
                  Edit Filters
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetFilters}
                  className="text-xs h-8 text-red-600 hover:text-red-700 min-w-[44px] min-h-[32px]"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
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