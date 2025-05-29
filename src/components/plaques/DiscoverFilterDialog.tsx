// src/components/plaques/DiscoverFilterDialog.tsx - UPDATED: Integrated with distance filter
import React, { useState, useMemo } from 'react';
import { 
  Search, X, MapPin, Circle,
  User, Star, CheckCircle, ArrowLeft, ArrowRight, Calendar,
  Crosshair, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Plaque } from '@/types/plaque';
import { calculateDistance } from '../maps/utils/routeUtils';

type FilterOption = {
  label: string;
  value: string;
  color?: string;
  count?: number;
  // NEW: Distance-filtered count
  filteredCount?: number;
};

// NEW: Distance filter interface
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
  
  // Filter options
  postcodes: FilterOption[];
  selectedPostcodes: string[];
  onPostcodesChange: (values: string[]) => void;
  
  colors: FilterOption[];
  selectedColors: string[];
  onColorsChange: (values: string[]) => void;
  
  professions: FilterOption[];
  selectedProfessions: string[];
  onProfessionsChange: (values: string[]) => void;
  
  // Possible additional filters
  eras?: FilterOption[];
  selectedEras?: string[];
  onErasChange?: (values: string[]) => void;
  
  organisations?: FilterOption[];
  selectedOrganisations?: string[];
  onOrganisationsChange?: (values: string[]) => void;
  
  // Toggle options
  onlyVisited: boolean;
  onVisitedChange: (value: boolean) => void;
  
  onlyFavorites: boolean;
  onFavoritesChange: (value: boolean) => void;
  
  // Actions
  onApply: () => void;
  onReset: () => void;
  
  // NEW: Distance filter integration
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
  
  // NEW: Distance filter props
  distanceFilter,
  allPlaques = [],
  isPlaqueVisited,
  isFavorite
}) => {
  // State for the current view (main menu or specific category)
  const [currentView, setCurrentView] = useState<string>('main');
  
  // Search state for each filterable category
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for expanded view
  const [showAll, setShowAll] = useState(false);
  
  // Default number of items to show
  const DEFAULT_ITEMS_TO_SHOW = 8;
  
  // NEW: Filter plaques based on distance filter
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
  
  // NEW: Enhanced filter options with distance-filtered counts
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
  
  // Toggle selection in an array
  const toggleSelection = (array: string[], setter: (values: string[]) => void, value: string) => {
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
  
  // NEW: Format count display based on distance filter
  const formatCount = (option: FilterOption): string => {
    if (distanceFilter?.enabled && option.filteredCount !== undefined) {
      if (option.filteredCount === 0) {
        return `(0 in area)`;
      } else if (option.filteredCount !== option.count) {
        return `(${option.filteredCount} in area, ${option.count} total)`;
      }
    }
    return option.count ? `(${option.count})` : '';
  };
  
  // NEW: Check if option should be disabled (no plaques in filtered area)
  const isOptionDisabled = (option: FilterOption): boolean => {
    return distanceFilter?.enabled && option.filteredCount === 0;
  };
  
  // Define filter categories with enhanced options
  const filterCategories: FilterCategory[] = [
    {
      id: 'colors',
      name: 'Colors',
      icon: <Circle size={20} className="text-blue-500" />,
      options: enhancedFilterOptions.colors,
      selectedValues: selectedColors,
      onChange: onColorsChange,
      showColors: true
    },
    {
      id: 'locations',
      name: 'Locations',
      icon: <MapPin size={20} className="text-blue-500" />,
      options: enhancedFilterOptions.postcodes,
      selectedValues: selectedPostcodes,
      onChange: onPostcodesChange,
      searchable: true
    },
    {
      id: 'professions',
      name: 'Professions',
      icon: <User size={20} className="text-blue-500" />,
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
      icon: <Calendar size={20} className="text-blue-500" />,
      options: enhancedFilterOptions.eras,
      selectedValues: selectedEras || [],
      onChange: onErasChange
    });
  }
  
  if (enhancedFilterOptions.organisations && onOrganisationsChange) {
    filterCategories.push({
      id: 'organisations',
      name: 'Organisations',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
      options: enhancedFilterOptions.organisations,
      selectedValues: selectedOrganisations || [],
      onChange: onOrganisationsChange,
      searchable: true
    });
  }
  
  // Get the current category being viewed
  const currentCategory = filterCategories.find(cat => cat.id === currentView);
  
  // NEW: Calculate filtered toggle counts
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
  
  // Render Main Menu View
  const renderMainMenu = () => (
    <>
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-white rounded-t-lg relative">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Filter Plaques</h2>
          <DialogClose className="h-8 w-8 p-1 rounded-full hover:bg-white/20 -mr-1">
            <X size={18} />
          </DialogClose>
        </div>
        
        <div className="text-sm text-blue-100">
          {distanceFilter?.enabled 
            ? `Filtering ${distanceFilteredPlaques.length} plaques in ${distanceFilter.locationName}`
            : "Select a category to filter plaques"
          }
        </div>
      </div>
      
      {/* NEW: Distance filter status */}
      {distanceFilter?.enabled && (
        <div className="px-4 py-3 bg-blue-50 border-b">
          <Alert className="border-blue-200">
            <Crosshair className="h-4 w-4 text-blue-600" />
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
      
      <div className="divide-y">
        {/* Categories List */}
        {filterCategories.map((category) => {
          const availableOptionsCount = category.options.filter(opt => !isOptionDisabled(opt)).length;
          const isDisabled = distanceFilter?.enabled && availableOptionsCount === 0;
          
          return (
            <button
              key={category.id}
              className={cn(
                "w-full py-3 px-4 flex items-center justify-between transition-colors",
                isDisabled 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:bg-gray-50"
              )}
              onClick={() => {
                if (!isDisabled) {
                  setCurrentView(category.id);
                  setSearchQuery('');
                  setShowAll(false);
                }
              }}
              disabled={isDisabled}
            >
              <div className="flex items-center">
                {category.icon}
                <span className="ml-3 font-medium">{category.name}</span>
                {/* NEW: Show availability indicator */}
                {distanceFilter?.enabled && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({availableOptionsCount} available)
                  </span>
                )}
              </div>
              <div className="flex items-center">
                {category.selectedValues.length > 0 && (
                  <Badge className="mr-2 bg-blue-100 text-blue-700">
                    {category.selectedValues.length}
                  </Badge>
                )}
                {!isDisabled && <ArrowRight size={16} className="text-gray-400" />}
                {isDisabled && <AlertCircle size={16} className="text-gray-400" />}
              </div>
            </button>
          );
        })}
        
        {/* Additional Filters */}
        <div className="px-4 py-3">
          <h3 className="font-medium mb-3">Additional Filters</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle size={18} className="text-blue-500 mr-2" />
                <div>
                  <div className="font-medium text-sm">Only Visited</div>
                  <div className="text-xs text-gray-500">
                    Show plaques you've visited
                    {/* NEW: Show filtered count */}
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
                onCheckedChange={onVisitedChange}
                disabled={distanceFilter?.enabled && filteredToggleCounts.visited === 0}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star size={18} className="text-blue-500 mr-2" />
                <div>
                  <div className="font-medium text-sm">Only Favorites</div>
                  <div className="text-xs text-gray-500">
                    Show only your favorite plaques
                    {/* NEW: Show filtered count */}
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
                onCheckedChange={onFavoritesChange}
                disabled={distanceFilter?.enabled && filteredToggleCounts.favorites === 0}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
  // Render Category Filter View
  const renderCategoryView = (category: FilterCategory) => {
    const { options, selectedValues, onChange, showColors, searchable } = category;
    const filteredOptions = searchable 
      ? filterOptions(options, searchQuery)
      : options;
    
    // Show top items first if there are selected values, then by availability if distance filter is active
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
    
    // Limit number of items shown unless expanded
    const visibleOptions = showAll ? filteredOptions : filteredOptions.slice(0, DEFAULT_ITEMS_TO_SHOW);
    const hasMoreToShow = filteredOptions.length > DEFAULT_ITEMS_TO_SHOW;
    
    return (
      <>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-white rounded-t-lg relative">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentView('main')} 
                className="h-8 w-8 p-0 text-white hover:bg-white/20 mr-2"
              >
                <ArrowLeft size={18} />
              </Button>
              <h2 className="text-lg font-semibold">{category.name}</h2>
            </div>
            <DialogClose className="h-8 w-8 p-1 rounded-full hover:bg-white/20 -mr-1">
              <X size={18} />
            </DialogClose>
          </div>
          
          <div className="text-sm text-blue-100">
            {selectedValues.length > 0 
              ? `${selectedValues.length} ${category.name.toLowerCase()} selected`
              : `Select ${category.name.toLowerCase()} to filter plaques`
            }
            {/* NEW: Show area context */}
            {distanceFilter?.enabled && (
              <span className="block mt-1 text-xs">
                In {distanceFilter.locationName} area
              </span>
            )}
          </div>
        </div>
        
        <div className="p-4">
          {/* Select/Clear All buttons at the top */}
          <div className="flex justify-between mb-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onChange([])}
              disabled={selectedValues.length === 0}
            >
              Clear All
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onChange(filteredOptions.filter(o => !isOptionDisabled(o)).map(o => o.value))}
              disabled={selectedValues.length === filteredOptions.filter(o => !isOptionDisabled(o)).length}
            >
              Select Available
            </Button>
          </div>
          
          {/* Search bar for searchable categories */}
          {searchable && (
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input
                placeholder={`Search ${category.name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          )}
          
          {/* Options list */}
          <div className={showColors ? "grid grid-cols-2 gap-2" : "divide-y border rounded-lg"}>
            {visibleOptions.length > 0 ? (
              visibleOptions.map(option => {
                const disabled = isOptionDisabled(option);
                
                return showColors ? (
                  // Color option with colored circle
                  <label 
                    key={option.value}
                    className={cn(
                      "flex items-center p-2 rounded-lg border cursor-pointer transition-colors",
                      disabled ? "opacity-50 cursor-not-allowed bg-gray-50" :
                      selectedValues.includes(option.value) ? "border-blue-300 bg-blue-50" : 
                      "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <input 
                      type="checkbox"
                      className="rounded text-blue-500 mr-2"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => !disabled && toggleSelection(selectedValues, onChange, option.value)}
                      disabled={disabled}
                    />
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={cn(
                        "w-4 h-4 rounded-full mr-2 flex-shrink-0",
                        option.value === 'blue' ? "bg-blue-500" :
                        option.value === 'green' ? "bg-green-500" :
                        option.value === 'brown' ? "bg-amber-700" :
                        option.value === 'black' ? "bg-gray-800" :
                        option.value === 'gray' ? "bg-gray-600" :
                        option.value === 'red' ? "bg-red-500" :
                        "bg-blue-500"
                      )}></div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{option.label}</span>
                        <span className="text-xs text-gray-500">
                          {formatCount(option)}
                        </span>
                      </div>
                    </div>
                  </label>
                ) : (
                  // Standard option
                  <label 
                    key={option.value}
                    className={cn(
                      "flex items-center justify-between p-2 cursor-pointer transition-colors",
                      disabled ? "opacity-50 cursor-not-allowed bg-gray-50" :
                      selectedValues.includes(option.value) ? "bg-blue-50" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <input 
                        type="checkbox"
                        className="rounded text-blue-500 mr-2 flex-shrink-0"
                        checked={selectedValues.includes(option.value)}
                        onChange={() => !disabled && toggleSelection(selectedValues, onChange, option.value)}
                        disabled={disabled}
                      />
                      <span className="truncate">{option.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatCount(option)}
                    </span>
                  </label>
                )
              })
            ) : (
              <div className="p-2 text-center text-sm text-gray-500">
                No {category.name.toLowerCase()} match your search
              </div>
            )}
          </div>
          
          {/* Show more/less button if needed */}
          {hasMoreToShow && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAll(!showAll)} 
              className="w-full mt-3 text-blue-600"
            >
              {showAll ? "Show Less" : `Show All (${filteredOptions.length})`}
            </Button>
          )}
        </div>
      </>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 h-[85vh] max-h-[650px] flex flex-col overflow-hidden rounded-lg z-[9999] [&>div]:z-[9999]">
        {/* Render the appropriate view */}
        <div className="flex-grow overflow-auto">
          {currentView === 'main' 
            ? renderMainMenu()
            : currentCategory && renderCategoryView(currentCategory)
          }
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t mt-auto">
          <div className="flex gap-3">
            {activeFiltersCount > 0 ? (
              <>
                <Button 
                  variant="outline"
                  onClick={() => {
                    onReset();
                    setCurrentView('main');
                  }}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button 
                  onClick={() => {
                    onApply();
                    onClose();
                  }}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </>
            ) : (
              <Button 
                onClick={onClose}
                className="w-full"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscoverFilterDialog;