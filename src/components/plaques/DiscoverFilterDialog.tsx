// src/components/plaques/DiscoverFilterDialog.tsx - Mobile optimized with swipe navigation
import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, Circle,
  User, Star, CheckCircle, ArrowLeft, ArrowRight, Calendar,
  Crosshair, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { MobileDialog } from "@/components/ui/mobile-dialog";
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileInput } from "@/components/ui/mobile-input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Plaque } from '@/types/plaque';
import { calculateDistance } from '../maps/utils/routeUtils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { triggerHapticFeedback } from '@/utils/mobileUtils';

type FilterOption = {
  label: string;
  value: string;
  color?: string;
  count?: number;
  filteredCount?: number;
};

interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

type FilterCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  showColors?: boolean;
  searchable?: boolean;
};

type DiscoverFilterDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  
  postcodes: FilterOption[];
  selectedPostcodes: string[];
  onPostcodesChange: (values: string[]) => void;
  
  colors: FilterOption[];
  selectedColors: string[];
  onColorsChange: (values: string[]) => void;
  
  professions: FilterOption[];
  selectedProfessions: string[];
  onProfessionsChange: (values: string[]) => void;
  
  eras?: FilterOption[];
  selectedEras?: string[];
  onErasChange?: (values: string[]) => void;
  
  organisations?: FilterOption[];
  selectedOrganisations?: string[];
  onOrganisationsChange?: (values: string[]) => void;
  
  onlyVisited: boolean;
  onVisitedChange: (value: boolean) => void;
  
  onlyFavorites: boolean;
  onFavoritesChange: (value: boolean) => void;
  
  onApply: () => void;
  onReset: () => void;
  
  distanceFilter?: DistanceFilter;
  allPlaques?: Plaque[];
  isPlaqueVisited?: (id: number) => boolean;
  isFavorite?: (id: number) => boolean;
};

export const DiscoverFilterDialog: React.FC<DiscoverFilterDialogProps> = ({
  isOpen,
  onClose,
  
  postcodes,
  selectedPostcodes,
  onPostcodesChange,
  
  colors,
  selectedColors,
  onColorsChange,
  
  professions,
  selectedProfessions,
  onProfessionsChange,
  
  eras,
  selectedEras,
  onErasChange,
  
  organisations,
  selectedOrganisations,
  onOrganisationsChange,
  
  onlyVisited,
  onVisitedChange,
  
  onlyFavorites,
  onFavoritesChange,
  
  onApply,
  onReset,
  
  distanceFilter,
  allPlaques = [],
  isPlaqueVisited,
  isFavorite
}) => {
  const [currentView, setCurrentView] = useState<string>('main');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAll, setShowAll] = useState(false);
  const [expandedToggles, setExpandedToggles] = useState(true);
  
  const DEFAULT_ITEMS_TO_SHOW = 6; // Reduced for mobile
  
  // Swipe gesture handling for category navigation
  const { handleTouchStart, handleTouchEnd, handleTouchMove } = useSwipeGesture({
    onSwipe: (direction) => {
      if (currentView !== 'main') {
        if (direction === 'right') {
          triggerHapticFeedback('selection');
          setCurrentView('main');
          setSearchQuery('');
          setShowAll(false);
        }
      }
    },
    threshold: 100
  });
  
  // Filter plaques based on distance filter
  const distanceFilteredPlaques = useMemo(() => {
    if (!distanceFilter?.enabled || !distanceFilter.center || !allPlaques.length) {
      return allPlaques;
    }
    
    return allPlaques.filter(plaque => {
      if (!plaque.latitude || !plaque.longitude) return false;
      
      const lat = parseFloat(plaque.latitude as string);
      const lng = parseFloat(plaque.longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      const distance = calculateDistance(
        distanceFilter.center![0],
        distanceFilter.center![1],
        lat,
        lng
      );
      
      return distance <= distanceFilter.radius;
    });
  }, [distanceFilter, allPlaques]);
  
  // Enhanced filter options with distance-filtered counts
  const enhancedFilterOptions = useMemo(() => {
    const calculateFilteredCounts = (
      originalOptions: FilterOption[],
      fieldName: keyof Plaque
    ): FilterOption[] => {
      if (!distanceFilter?.enabled || !allPlaques.length) {
        return originalOptions;
      }
      
      return originalOptions.map(option => {
        const filteredCount = distanceFilteredPlaques.filter(plaque => {
          const fieldValue = plaque[fieldName];
          if (fieldName === 'color') {
            return fieldValue?.toLowerCase() === option.value.toLowerCase();
          }
          return fieldValue === option.value;
        }).length;
        
        return {
          ...option,
          filteredCount
        };
      });
    };
    
    return {
      postcodes: calculateFilteredCounts(postcodes, 'postcode'),
      colors: calculateFilteredCounts(colors, 'color'),
      professions: calculateFilteredCounts(professions, 'profession'),
      eras: eras ? calculateFilteredCounts(eras, 'erected') : undefined,
      organisations: organisations ? calculateFilteredCounts(organisations, 'organisations') : undefined
    };
  }, [postcodes, colors, professions, eras, organisations, distanceFilter, distanceFilteredPlaques, allPlaques]);
  
  // Calculate total active filters
  const colorCount = selectedColors.length;
  const postcodeCount = selectedPostcodes.length;
  const professionCount = selectedProfessions.length;
  const eraCount = selectedEras?.length || 0;
  const organisationCount = selectedOrganisations?.length || 0;
  const togglesCount = (onlyVisited ? 1 : 0) + (onlyFavorites ? 1 : 0);
  
  const activeFiltersCount = 
    colorCount + postcodeCount + professionCount + 
    eraCount + organisationCount + togglesCount;
  
  // Toggle selection in an array with haptic feedback
  const toggleSelection = (array: string[], setter: (values: string[]) => void, value: string) => {
    triggerHapticFeedback('selection');
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };
  
  // Filter options based on search
  const filterOptions = (options: FilterOption[], query: string): FilterOption[] => {
    if (!query.trim()) return options;
    return options.filter(option => 
      option.label.toLowerCase().includes(query.toLowerCase())
    );
  };
  
  // Format count display based on distance filter
  const formatCount = (option: FilterOption): string => {
    if (distanceFilter?.enabled && option.filteredCount !== undefined) {
      if (option.filteredCount === 0) {
        return `(0 in area)`;
      } else if (option.filteredCount !== option.count) {
        return `(${option.filteredCount} in area)`;
      }
    }
    return option.count ? `(${option.count})` : '';
  };
  
  // Check if option should be disabled
  const isOptionDisabled = (option: FilterOption): boolean => {
    return distanceFilter?.enabled && option.filteredCount === 0;
  };
  
  // Define filter categories with enhanced options
  const filterCategories: FilterCategory[] = [
    {
      id: 'colors',
      name: 'Colors',
      icon: <Circle size={24} className="text-blue-500" />,
      options: enhancedFilterOptions.colors,
      selectedValues: selectedColors,
      onChange: onColorsChange,
      showColors: true
    },
    {
      id: 'locations',
      name: 'Locations',
      icon: <MapPin size={24} className="text-blue-500" />,
      options: enhancedFilterOptions.postcodes,
      selectedValues: selectedPostcodes,
      onChange: onPostcodesChange,
      searchable: true
    },
    {
      id: 'professions',
      name: 'Professions',
      icon: <User size={24} className="text-blue-500" />,
      options: enhancedFilterOptions.professions,
      selectedValues: selectedProfessions,
      onChange: onProfessionsChange,
      searchable: true
    }
  ];
  
  // Add optional categories if they exist
  if (enhancedFilterOptions.eras && onErasChange) {
    filterCategories.push({
      id: 'eras',
      name: 'Time Periods',
      icon: <Calendar size={24} className="text-blue-500" />,
      options: enhancedFilterOptions.eras,
      selectedValues: selectedEras || [],
      onChange: onErasChange
    });
  }
  
  if (enhancedFilterOptions.organisations && onOrganisationsChange) {
    filterCategories.push({
      id: 'organisations',
      name: 'Organisations',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
      options: enhancedFilterOptions.organisations,
      selectedValues: selectedOrganisations || [],
      onChange: onOrganisationsChange,
      searchable: true
    });
  }
  
  const currentCategory = filterCategories.find(cat => cat.id === currentView);
  
  // Calculate filtered toggle counts
  const filteredToggleCounts = useMemo(() => {
    if (!distanceFilter?.enabled || !allPlaques.length) {
      return { visited: 0, favorites: 0 };
    }
    
    const visited = distanceFilteredPlaques.filter(plaque => 
      plaque.visited || (isPlaqueVisited && isPlaqueVisited(plaque.id))
    ).length;
    
    const favorites = distanceFilteredPlaques.filter(plaque =>
      isFavorite && isFavorite(plaque.id)
    ).length;
    
    return { visited, favorites };
  }, [distanceFilteredPlaques, isPlaqueVisited, isFavorite, distanceFilter]);
  
  // Enhanced toggle handlers with haptic feedback
  const handleVisitedToggle = (checked: boolean) => {
    triggerHapticFeedback('selection');
    onVisitedChange(checked);
  };
  
  const handleFavoritesToggle = (checked: boolean) => {
    triggerHapticFeedback('selection');
    onFavoritesChange(checked);
  };
  
  // Navigation with haptic feedback
  const navigateToCategory = (categoryId: string) => {
    const category = filterCategories.find(c => c.id === categoryId);
    if (category && !isOptionDisabled(category.options[0])) {
      triggerHapticFeedback('selection');
      setCurrentView(categoryId);
      setSearchQuery('');
      setShowAll(false);
    }
  };
  
  const navigateBack = () => {
    triggerHapticFeedback('selection');
    setCurrentView('main');
  };
  
  // Render Main Menu View - Mobile optimized
  const renderMainMenu = () => (
    <div 
      className="h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Distance filter status */}
      {distanceFilter?.enabled && (
        <div className="mb-4">
          <Alert className="border-blue-200">
            <Crosshair className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Location Filter Active:</strong> Showing results within{' '}
              {distanceFilter.radius < 1 
                ? `${Math.round(distanceFilter.radius * 1000)}m` 
                : `${distanceFilter.radius}km`}{' '}
              of {distanceFilter.locationName}.{' '}
              <span className="font-medium">
                {distanceFilteredPlaques.length} of {allPlaques.length} plaques in this area.
              </span>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Categories List - Mobile optimized */}
      <div className="space-y-3 mb-6">
        {filterCategories.map((category) => {
          const availableOptionsCount = category.options.filter(opt => !isOptionDisabled(opt)).length;
          const isDisabled = distanceFilter?.enabled && availableOptionsCount === 0;
          
          return (
            <MobileButton
              key={category.id}
              variant="outline"
              className={cn(
                "w-full p-4 h-auto flex items-center justify-between text-left",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => {
                if (!isDisabled) {
                  navigateToCategory(category.id);
                }
              }}
              disabled={isDisabled}
              touchOptimized={true}
            >
              <div className="flex items-center">
                {category.icon}
                <div className="ml-4">
                  <span className="font-medium text-base">{category.name}</span>
                  {distanceFilter?.enabled && (
                    <div className="text-sm text-gray-500">
                      {availableOptionsCount} available
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {category.selectedValues.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-700">
                    {category.selectedValues.length}
                  </Badge>
                )}
                {!isDisabled && <ArrowRight size={20} className="text-gray-400" />}
                {isDisabled && <AlertCircle size={20} className="text-gray-400" />}
              </div>
            </MobileButton>
          );
        })}
      </div>
      
      {/* Additional Filters - Mobile optimized */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg">Additional Filters</h3>
          <MobileButton
            variant="ghost"
            size="sm"
            onClick={() => setExpandedToggles(!expandedToggles)}
            className="p-2"
          >
            {expandedToggles ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </MobileButton>
        </div>
        
        {expandedToggles && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle size={24} className="text-blue-500 mr-3" />
                <div>
                  <div className="font-medium text-base">Only Visited</div>
                  <div className="text-sm text-gray-500">
                    Show plaques you've visited
                    {distanceFilter?.enabled && (
                      <span className="ml-1">
                        ({filteredToggleCounts.visited} in area)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Switch 
                checked={onlyVisited}
                onCheckedChange={handleVisitedToggle}
                disabled={distanceFilter?.enabled && filteredToggleCounts.visited === 0}
                className="scale-125"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Star size={24} className="text-blue-500 mr-3" />
                <div>
                  <div className="font-medium text-base">Only Favorites</div>
                  <div className="text-sm text-gray-500">
                    Show only your favorite plaques
                    {distanceFilter?.enabled && (
                      <span className="ml-1">
                        ({filteredToggleCounts.favorites} in area)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Switch 
                checked={onlyFavorites}
                onCheckedChange={handleFavoritesToggle}
                disabled={distanceFilter?.enabled && filteredToggleCounts.favorites === 0}
                className="scale-125"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  // Render Category Filter View - Mobile optimized
  const renderCategoryView = (category: FilterCategory) => {
    const { options, selectedValues, onChange, showColors, searchable } = category;
    const filteredOptions = searchable 
      ? filterOptions(options, searchQuery)
      : options;
    
    // Sort options - selected first, then by availability
    filteredOptions.sort((a, b) => {
      const aSelected = selectedValues.includes(a.value);
      const bSelected = selectedValues.includes(b.value);
      const aDisabled = isOptionDisabled(a);
      const bDisabled = isOptionDisabled(b);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      if (distanceFilter?.enabled) {
        if (!aDisabled && bDisabled) return -1;
        if (aDisabled && !bDisabled) return 1;
        return (b.filteredCount || 0) - (a.filteredCount || 0);
      }
      return (b.count || 0) - (a.count || 0);
    });
    
    const visibleOptions = showAll ? filteredOptions : filteredOptions.slice(0, DEFAULT_ITEMS_TO_SHOW);
    const hasMoreToShow = filteredOptions.length > DEFAULT_ITEMS_TO_SHOW;
    
    return (
      <div 
        className="h-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {/* Back navigation */}
        <div className="flex items-center gap-3 mb-4">
          <MobileButton 
            variant="ghost" 
            size="sm" 
            onClick={navigateBack}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </MobileButton>
          <div>
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <div className="text-sm text-gray-500">
              {selectedValues.length > 0 
                ? `${selectedValues.length} ${category.name.toLowerCase()} selected`
                : `Select ${category.name.toLowerCase()} to filter plaques`
              }
              {distanceFilter?.enabled && (
                <span className="block">In {distanceFilter.locationName} area</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Control buttons */}
        <div className="flex justify-between mb-4">
          <MobileButton 
            variant="ghost" 
            size="sm"
            onClick={() => onChange([])}
            disabled={selectedValues.length === 0}
          >
            Clear All
          </MobileButton>
          <MobileButton 
            variant="ghost" 
            size="sm"
            onClick={() => onChange(filteredOptions.filter(o => !isOptionDisabled(o)).map(o => o.value))}
            disabled={selectedValues.length === filteredOptions.filter(o => !isOptionDisabled(o)).length}
          >
            Select Available
          </MobileButton>
        </div>
        
        {/* Search bar for searchable categories */}
        {searchable && (
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <MobileInput
              placeholder={`Search ${category.name.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        )}
        
        {/* Options list - Mobile optimized */}
        <div className={showColors ? "grid grid-cols-2 gap-3" : "space-y-3"}>
          {visibleOptions.length > 0 ? (
            visibleOptions.map(option => {
              const disabled = isOptionDisabled(option);
              const isSelected = selectedValues.includes(option.value);
              
              return showColors ? (
                // Color option with colored circle - Mobile optimized
                <label 
                  key={option.value}
                  className={cn(
                    "flex items-center p-4 rounded-lg border cursor-pointer transition-colors touch-manipulation",
                    disabled ? "opacity-50 cursor-not-allowed bg-gray-50" :
                    isSelected ? "border-blue-300 bg-blue-50" : 
                    "border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                  )}
                >
                  <input 
                    type="checkbox"
                    className="rounded text-blue-500 mr-3 w-5 h-5"
                    checked={isSelected}
                    onChange={() => !disabled && toggleSelection(selectedValues, onChange, option.value)}
                    disabled={disabled}
                  />
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={cn(
                      "w-6 h-6 rounded-full mr-3 flex-shrink-0",
                      option.value === 'blue' ? "bg-blue-500" :
                      option.value === 'green' ? "bg-green-500" :
                      option.value === 'brown' ? "bg-amber-700" :
                      option.value === 'black' ? "bg-gray-800" :
                      option.value === 'gray' ? "bg-gray-600" :
                      option.value === 'red' ? "bg-red-500" :
                      "bg-blue-500"
                    )}></div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-medium">{option.label}</span>
                      <span className="text-sm text-gray-500">
                        {formatCount(option)}
                      </span>
                    </div>
                  </div>
                </label>
              ) : (
                // Standard option - Mobile optimized
                <label 
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer transition-colors border rounded-lg touch-manipulation",
                    disabled ? "opacity-50 cursor-not-allowed bg-gray-50" :
                    isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50 active:bg-gray-100 border-gray-200"
                  )}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <input 
                      type="checkbox"
                      className="rounded text-blue-500 mr-3 w-5 h-5 flex-shrink-0"
                      checked={isSelected}
                      onChange={() => !disabled && toggleSelection(selectedValues, onChange, option.value)}
                      disabled={disabled}
                    />
                    <span className="truncate font-medium">{option.label}</span>
                  </div>
                  <span className="text-sm text-gray-500 ml-3 flex-shrink-0">
                    {formatCount(option)}
                  </span>
                </label>
              )
            })
          ) : (
            <div className="p-8 text-center text-gray-500">
              No {category.name.toLowerCase()} match your search
            </div>
          )}
        </div>
        
        {/* Show more/less button */}
        {hasMoreToShow && (
          <MobileButton 
            variant="ghost" 
            onClick={() => {
              triggerHapticFeedback('selection');
              setShowAll(!showAll);
            }}
            className="w-full mt-4 text-blue-600"
          >
            {showAll ? "Show Less" : `Show All (${filteredOptions.length})`}
          </MobileButton>
        )}
      </div>
    );
  };
  
  return (
    <MobileDialog
      isOpen={isOpen}
      onClose={onClose}
      title={currentView === 'main' ? 'Filter Plaques' : undefined}
      description={currentView === 'main' && distanceFilter?.enabled 
        ? `Filtering ${distanceFilteredPlaques.length} plaques in ${distanceFilter.locationName}`
        : currentView === 'main' ? "Select a category to filter plaques" : undefined
      }
      size="lg"
      className="z-[9999] [&>div]:z-[9999]"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {activeFiltersCount > 0 ? (
            <>
              <MobileButton 
                variant="outline"
                onClick={() => {
                  triggerHapticFeedback('light');
                  onReset();
                  setCurrentView('main');
                }}
                className="flex-1"
              >
                Reset ({activeFiltersCount})
              </MobileButton>
              <MobileButton 
                onClick={() => {
                  triggerHapticFeedback('success');
                  onApply();
                  onClose();
                }}
                className="flex-1"
              >
                Apply Filters
              </MobileButton>
            </>
          ) : (
            <MobileButton 
              onClick={onClose}
              className="w-full"
            >
              Close
            </MobileButton>
          )}
        </div>
      }
    >
      {currentView === 'main' 
        ? renderMainMenu()
        : currentCategory && renderCategoryView(currentCategory)
      }
    </MobileDialog>
  );
};

export default DiscoverFilterDialog;