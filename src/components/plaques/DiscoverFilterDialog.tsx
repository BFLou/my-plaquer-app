// src/components/plaques/DiscoverFilterDialog.tsx - COMPLETE FIXED VERSION
import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, Circle, Building, Users,
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
  
  organisations: FilterOption[];
  selectedOrganisations: string[];
  onOrganisationsChange: (values: string[]) => void;

  subjectTypes: FilterOption[];
  selectedSubjectTypes: string[];
  onSubjectTypesChange: (values: string[]) => void;
  
  eras?: FilterOption[];
  selectedEras?: string[];
  onErasChange?: (values: string[]) => void;
  
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

// Helper functions for safe type conversions
const getValidCoordinate = (coord: number | string | undefined): number => {
  if (typeof coord === 'number' && !isNaN(coord)) {
    return coord;
  }
  if (typeof coord === 'string') {
    const parsed = parseFloat(coord);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper to safely convert field values to strings for comparison
const getFieldValueAsString = (value: string | number | boolean | undefined): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  return '';
};

// Helper to safely parse JSON for organisations
const safeParseJSON = (jsonString: string): string[] => {
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'string' && item.trim()) : [jsonString];
  } catch {
    return [jsonString];
  }
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

  organisations,
  selectedOrganisations,
  onOrganisationsChange,

  subjectTypes,
  selectedSubjectTypes,
  onSubjectTypesChange,
  
  eras,
  selectedEras,
  onErasChange,
  
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
  
  // Filter plaques based on distance filter with safe coordinate conversion
  const distanceFilteredPlaques = useMemo(() => {
    if (!distanceFilter?.enabled || !distanceFilter.center || !allPlaques.length) {
      return allPlaques;
    }
    
    return allPlaques.filter(plaque => {
      if (!plaque.latitude || !plaque.longitude) return false;
      
      // Safe coordinate conversion
      const lat = getValidCoordinate(plaque.latitude);
      const lng = getValidCoordinate(plaque.longitude);
      
      if (lat === 0 && lng === 0) return false;
      
      const distance = calculateDistance(
        distanceFilter.center![0],
        distanceFilter.center![1],
        lat,
        lng
      );
      
      return distance <= distanceFilter.radius;
    });
  }, [distanceFilter, allPlaques]);
  
  // FIXED: Enhanced filter options with corrected field access
  const enhancedFilterOptions = useMemo(() => {
    const calculateFilteredCounts = (
      originalOptions: FilterOption[],
      fieldName: keyof Plaque | string,
      isOrganisation: boolean = false,
      isSubjectType: boolean = false
    ): FilterOption[] => {
      if (!distanceFilter?.enabled || !allPlaques.length) {
        return originalOptions;
      }
      
      console.log(`=== CALCULATING FILTERED COUNTS FOR ${fieldName} ===`);
      console.log('Original options:', originalOptions.length);
      console.log('Is organisation:', isOrganisation);
      console.log('Is subject type:', isSubjectType);
      
      return originalOptions.map(option => {
        const filteredCount = distanceFilteredPlaques.filter(plaque => {
          // FIXED: Handle organisation comparison with correct field name
          if (isOrganisation) {
            const orgField = (plaque as any).organisations; // Use plural form
            const orgsStr = getFieldValueAsString(orgField);
            
            console.log(`Checking org for ${plaque.title}:`, {
              orgField,
              orgsStr,
              optionValue: option.value
            });
            
            if (orgsStr === '' || orgsStr === '[]' || orgsStr === 'Unknown') return false;
            
            // Handle both string and array formats
            if (orgsStr.startsWith('[') && orgsStr.endsWith(']')) {
              const orgs = safeParseJSON(orgsStr);
              return orgs.some(org => 
                org.toLowerCase().trim() === option.value.toLowerCase().trim()
              );
            } else {
              return orgsStr.toLowerCase().trim() === option.value.toLowerCase().trim();
            }
          }

          // FIXED: Handle subject type comparison with correct field name
          if (isSubjectType) {
            const subjectField = (plaque as any).lead_subject_type; // Use correct field name
            const fieldStr = getFieldValueAsString(subjectField);
            
            console.log(`Checking subject for ${plaque.title}:`, {
              subjectField,
              fieldStr,
              optionValue: option.value
            });
            
            return fieldStr.toLowerCase().trim() === option.value.toLowerCase().trim();
          }
          
          // Handle color comparison
          if (fieldName === 'color') {
            const fieldStr = getFieldValueAsString(plaque[fieldName as keyof Plaque]);
            return fieldStr.toLowerCase().trim() === option.value.toLowerCase().trim();
          }
          
          // Standard string comparison for other fields
          const fieldValue = plaque[fieldName as keyof Plaque];
          const fieldStr = getFieldValueAsString(fieldValue);
          return fieldStr.toLowerCase().trim() === option.value.toLowerCase().trim();
        }).length;
        
        console.log(`Option ${option.value}: ${filteredCount} matches`);
        
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
      organisations: calculateFilteredCounts(organisations, 'organisations', true, false), // FIXED: Use correct field
      subjectTypes: calculateFilteredCounts(subjectTypes, 'lead_subject_type', false, true), // FIXED: Use correct field
      eras: eras ? calculateFilteredCounts(eras, 'erected') : undefined
    };
  }, [postcodes, colors, professions, organisations, subjectTypes, eras, distanceFilter, distanceFilteredPlaques, allPlaques]);
  
  // Calculate total active filters
  const colorCount = selectedColors.length;
  const postcodeCount = selectedPostcodes.length;
  const professionCount = selectedProfessions.length;
  const organisationCount = selectedOrganisations.length;
  const subjectTypeCount = selectedSubjectTypes.length;
  const eraCount = selectedEras?.length || 0;
  const togglesCount = (onlyVisited ? 1 : 0) + (onlyFavorites ? 1 : 0);
  
  const activeFiltersCount = 
    colorCount + postcodeCount + professionCount + 
    organisationCount + subjectTypeCount + eraCount + togglesCount;
  
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
  
  // Option disabled check
  const isOptionDisabled = (option: FilterOption): boolean => {
    // Only disable if distance filter is active AND the option has 0 results in the area
    return !!distanceFilter?.enabled && option.filteredCount === 0;
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
    },
    {
      id: 'organisations',
      name: 'Organisations',
      icon: <Building size={24} className="text-purple-500" />,
      options: enhancedFilterOptions.organisations,
      selectedValues: selectedOrganisations,
      onChange: onOrganisationsChange,
      searchable: true
    },
    {
      id: 'subjectTypes',
      name: 'Subject Types',
      icon: <Users size={24} className="text-orange-500" />,
      options: enhancedFilterOptions.subjectTypes,
      selectedValues: selectedSubjectTypes,
      onChange: onSubjectTypesChange,
      searchable: false
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
  
  const currentCategory = filterCategories.find(cat => cat.id === currentView);
  
  // Calculate filtered toggle counts with safe property access
  const filteredToggleCounts = useMemo(() => {
    if (!distanceFilter?.enabled || !allPlaques.length) {
      return { visited: 0, favorites: 0 };
    }
    
    const visited = distanceFilteredPlaques.filter(plaque => {
      // Safe boolean check
      const plaqueVisited = plaque.visited === true;
      const userVisited = isPlaqueVisited ? isPlaqueVisited(plaque.id) === true : false;
      return plaqueVisited || userVisited;
    }).length;
    
    const favorites = distanceFilteredPlaques.filter(plaque =>
      isFavorite ? isFavorite(plaque.id) === true : false
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
  
  // Navigation with improved debugging
  const navigateToCategory = (categoryId: string) => {
    const category = filterCategories.find(c => c.id === categoryId);
    console.log('=== FILTER NAVIGATION DEBUG ===');
    console.log('Category ID:', categoryId);
    console.log('Category found:', category);
    console.log('Options available:', category?.options.length);
    console.log('All options:', category?.options.map(o => ({ label: o.label, count: o.count, filteredCount: o.filteredCount })));
    
    if (category && category.options.length > 0) {
      triggerHapticFeedback('selection');
      setCurrentView(categoryId);
      setSearchQuery('');
      setShowAll(false);
      console.log('Successfully navigated to category:', categoryId);
    } else {
      console.log('Navigation blocked - no category or no options');
      if (category && category.options.length === 0) {
        console.warn(`Category ${categoryId} has no options available`);
      }
    }
  };
  
  const navigateBack = () => {
    triggerHapticFeedback('selection');
    setCurrentView('main');
  };
  
  // Render Main Menu View
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
      
      {/* Categories List - Mobile optimized with better debugging */}
      <div className="space-y-3 mb-6">
        {filterCategories.map((category) => {
          const availableOptionsCount = category.options.filter(opt => !isOptionDisabled(opt)).length;
          const totalOptions = category.options.length;
          const isDisabled = totalOptions === 0;
          
          console.log(`Category ${category.id}: ${totalOptions} total, ${availableOptionsCount} available, disabled: ${isDisabled}`);
          
          return (
            <MobileButton
              key={category.id}
              variant="outline"
              className={cn(
                "w-full p-4 h-auto flex items-center justify-between text-left",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => {
                console.log(`Clicked category: ${category.id}, disabled: ${isDisabled}`);
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
                  <div className="text-sm text-gray-500">
                    {totalOptions} total
                    {distanceFilter?.enabled && (
                      <span>, {availableOptionsCount} in area</span>
                    )}
                  </div>
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
                // Non-color option
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
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate font-medium">{option.label}</span>
                    <span className="text-sm text-gray-500">
                      {formatCount(option)}
                    </span>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-2">No {category.name.toLowerCase()} match your search</div>
              {searchQuery && (
                <MobileButton 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600"
                >
                  Clear search
                </MobileButton>
              )}
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
        
        {/* Debug information when no results */}
        {process.env.NODE_ENV === 'development' && filteredOptions.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-yellow-800">
              <strong>Debug Info:</strong> No options available for {category.name}
              <br />
              Original options: {options.length}
              {searchable && searchQuery && (
                <>
                  <br />
                  Search query: "{searchQuery}"
                </>
              )}
              {distanceFilter?.enabled && (
                <>
                  <br />
                  Distance filter: {distanceFilter.radius}km from {distanceFilter.locationName}
                  <br />
                  Filtered plaques: {distanceFilteredPlaques.length}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Debug component for development - shows data structure
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development' || !allPlaques.length) return null;
    
    const samplePlaque = allPlaques[0];
    const availableFields = Object.keys(samplePlaque);
    
    return (
      <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
        <details className="text-xs">
          <summary className="cursor-pointer font-medium mb-2">Debug: Data Structure</summary>
          <div className="space-y-2">
            <div>
              <strong>Available Fields:</strong>
              <br />
              {availableFields.join(', ')}
            </div>
            <div>
              <strong>Organisation Fields:</strong>
              <br />
              {availableFields.filter(f => 
                f.toLowerCase().includes('org') || 
                f.toLowerCase().includes('institution')
              ).join(', ') || 'None found'}
            </div>
            <div>
              <strong>Subject Type Fields:</strong>
              <br />
              {availableFields.filter(f => 
                f.toLowerCase().includes('subject') || 
                f.toLowerCase().includes('type') ||
                f.toLowerCase().includes('category')
              ).join(', ') || 'None found'}
            </div>
            <div>
              <strong>Sample Values:</strong>
              <br />
              Organisation: {JSON.stringify((samplePlaque as any).organisations || 'undefined')}
              <br />
              Subject Type: {JSON.stringify((samplePlaque as any).lead_subject_type || 'undefined')}
            </div>
            <div>
              <strong>Filter Counts:</strong>
              <br />
              Organisations: {organisations.length} options
              <br />
              Subject Types: {subjectTypes.length} options
              <br />
              Total Plaques: {allPlaques.length}
              {distanceFilter?.enabled && (
                <>
                  <br />
                  Filtered Plaques: {distanceFilteredPlaques.length}
                </>
              )}
            </div>
          </div>
        </details>
      </div>
    );
  };
  
  return (
    <MobileDialog
      isOpen={isOpen}
      onClose={() => {
        // Reset state when closing
        setCurrentView('main');
        setSearchQuery('');
        setShowAll(false);
        onClose();
      }}
      title={currentView === 'main' ? 'Filter Plaques' : undefined}
      description={currentView === 'main' && distanceFilter?.enabled 
        ? `Filtering ${distanceFilteredPlaques.length} plaques in ${distanceFilter.locationName}`
        : currentView === 'main' ? "Select a category to filter plaques" : undefined
      }
      size="lg"
      className="z-[9999] [&>div]:z-[9999]"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {currentView !== 'main' ? (
            // Back button for category views
            <MobileButton 
              variant="outline"
              onClick={navigateBack}
              className="w-full sm:w-auto"
            >
              ← Back to Categories
            </MobileButton>
          ) : activeFiltersCount > 0 ? (
            // Main view with active filters
            <>
              <MobileButton 
                variant="outline"
                onClick={() => {
                  triggerHapticFeedback('light');
                  onReset();
                  setCurrentView('main');
                  setSearchQuery('');
                  setShowAll(false);
                }}
                className="flex-1"
              >
                Reset ({activeFiltersCount})
              </MobileButton>
              <MobileButton 
                onClick={() => {
                  triggerHapticFeedback('success');
                  onApply();
                  setCurrentView('main');
                  setSearchQuery('');
                  setShowAll(false);
                  onClose();
                }}
                className="flex-1"
              >
                Apply Filters
              </MobileButton>
            </>
          ) : (
            // Main view with no active filters
            <MobileButton 
              onClick={() => {
                setCurrentView('main');
                setSearchQuery('');
                setShowAll(false);
                onClose();
              }}
              className="w-full"
            >
              Close
            </MobileButton>
          )}
        </div>
      }
    >
      <div className="relative">
        {currentView === 'main' 
          ? renderMainMenu()
          : currentCategory && renderCategoryView(currentCategory)
        }
        
        {/* Debug info at bottom in development */}
        {currentView === 'main' && renderDebugInfo()}
      </div>
    </MobileDialog>
  );
};

export default DiscoverFilterDialog;