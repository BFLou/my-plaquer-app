// src/components/discover/DiscoverFilters.tsx - FIXED: Z-index and positioning

import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DiscoverFilterDialog from '../plaques/DiscoverFilterDialog';
import { FilterStatusBar } from './FilterStatusBar';
import { FilterSuggestions } from './FilterSuggestions';

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
    organisations: string[];
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
    organisationOptions: any[];
  };
  onApplyFilters: (filters: any) => void;
  distanceFilter: DistanceFilter;
  onClearDistanceFilter: () => void;
  allPlaques?: any[];
  totalPlaqueCount?: number;
  filteredPlaqueCount?: number;
  showSuggestions?: boolean;
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
  onClearDistanceFilter,
  allPlaques = [],
  totalPlaqueCount = 0,
  filteredPlaqueCount = 0,
  showSuggestions = true
}) => {
  const [showFilterSuggestions, setShowFilterSuggestions] = useState(false);

  // Enhanced filter removal with type safety
  const removeFilterEnhanced = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'color':
        onRemoveFilter({ colors: urlState.colors.filter(c => c !== value) });
        break;
      case 'postcode':
        onRemoveFilter({ postcodes: urlState.postcodes.filter(p => p !== value) });
        break;
      case 'profession':
        onRemoveFilter({ professions: urlState.professions.filter(p => p !== value) });
        break;
      case 'organisation':
        onRemoveFilter({ organisations: urlState.organisations.filter(o => o !== value) });
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
      case 'search':
        onRemoveFilter({ search: '' });
        break;
      default:
        console.warn('Unknown filter type:', filterType);
    }
  };

  // Handle filter suggestions
  const handleFilterSuggestion = (suggestion: any) => {
    switch (suggestion.type) {
      case 'add-profession':
        onApplyFilters({ professions: [...urlState.professions, suggestion.value] });
        break;
      case 'add-color':
        onApplyFilters({ colors: [...urlState.colors, suggestion.value] });
        break;
      case 'add-postcode-area':
        const areaPostcodes = filterOptions.postcodeOptions
          .filter(p => p.value.startsWith(suggestion.value))
          .map(p => p.value);
        onApplyFilters({ postcodes: [...urlState.postcodes, ...areaPostcodes] });
        break;
      case 'add-organisation':
        onApplyFilters({ organisations: [...urlState.organisations, suggestion.value] });
        break;
      default:
        console.warn('Unknown suggestion type:', suggestion.type);
    }
  };

  // If no active filters, show suggestions instead of empty state
  if (activeFiltersCount === 0) {
    return showSuggestions && allPlaques.length > 0 && filteredPlaqueCount > 50 ? (
      <div 
        className="discover-filters-container"
        style={{ 
          position: 'relative', 
          zIndex: 1002,
          isolation: 'isolate'
        }}
      >
        <div className="container mx-auto px-4 mt-3">
          <FilterSuggestions
            plaques={allPlaques}
            currentFilters={urlState}
            onApplySuggestion={handleFilterSuggestion}
            className="mb-4"
          />
        </div>
      </div>
    ) : null;
  }

  return (
    <>
      {/* FIXED: Enhanced Filter Status Bar with proper z-index */}
      <div 
        className="discover-filters-container"
        style={{ 
          position: 'relative', 
          zIndex: 1002,
          isolation: 'isolate',
          background: 'transparent'
        }}
      >
        <div className="container mx-auto px-4 mt-3">
          <div 
            style={{ 
              position: 'relative',
              zIndex: 1003
            }}
          >
            <FilterStatusBar
              activeFilters={{
                search: urlState.search,
                colors: urlState.colors,
                postcodes: urlState.postcodes,
                professions: urlState.professions,
                organisations: urlState.organisations,
                onlyVisited: urlState.onlyVisited,
                onlyFavorites: urlState.onlyFavorites,
                distanceFilter: distanceFilter.enabled ? {
                  enabled: true,
                  locationName: distanceFilter.locationName || 'Unknown Location',
                  radius: distanceFilter.radius
                } : undefined
              }}
              resultCount={filteredPlaqueCount}
              totalCount={totalPlaqueCount}
              onRemoveFilter={removeFilterEnhanced}
              onClearAll={onResetFilters}
              onOpenFilters={onCloseFilters}
              className="filter-status-bar-component"
            />
          </div>

          {/* Filter Suggestions - Show when filters are not too restrictive */}
          {showSuggestions && activeFiltersCount < 4 && filteredPlaqueCount > 20 && (
            <Collapsible open={showFilterSuggestions} onOpenChange={setShowFilterSuggestions}>
              <div className="mt-3" style={{ position: 'relative', zIndex: 1001 }}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between p-2 text-left h-auto"
                    style={{ position: 'relative', zIndex: 1001 }}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Discover More</span>
                      <Badge variant="outline" className="text-xs">
                        Suggestions
                      </Badge>
                    </div>
                    <ChevronDown 
                      size={14} 
                      className={`transition-transform ${showFilterSuggestions ? 'rotate-180' : ''}`} 
                    />
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div style={{ position: 'relative', zIndex: 1001 }}>
                    <FilterSuggestions
                      plaques={allPlaques}
                      currentFilters={urlState}
                      onApplySuggestion={handleFilterSuggestion}
                      className="filter-suggestions-component"
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}
        </div>
      </div>

      {/* FIXED: Filter dialog with proper z-index */}
      <div style={{ position: 'relative', zIndex: 9000 }}>
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

          organisations={filterOptions.organisationOptions}
          selectedOrganisations={urlState.organisations}
          onOrganisationsChange={(values) => onApplyFilters({ organisations: values })}
          
          onlyVisited={urlState.onlyVisited}
          onVisitedChange={(value) => onApplyFilters({ onlyVisited: value })}
          
          onlyFavorites={urlState.onlyFavorites}
          onFavoritesChange={(value) => onApplyFilters({ onlyFavorites: value })}
          
          onApply={onCloseFilters}
          onReset={onResetFilters}
        />
      </div>
    </>
  );
};

export default DiscoverFilters;