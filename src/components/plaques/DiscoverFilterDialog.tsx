// src/components/plaques/DiscoverFilterDialog.tsx
import React, { useState } from 'react';
import { 
  Search, Filter, X, Check, MapPin, Circle,
  User, Star, CheckCircle, ArrowLeft, ArrowRight, Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type FilterOption = {
  label: string;
  value: string;
  color?: string;
  count?: number;
};

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
  onReset
}) => {
  // State for the current view (main menu or specific category)
  const [currentView, setCurrentView] = useState<string>('main');
  
  // Search state for each filterable category
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for expanded view
  const [showAll, setShowAll] = useState(false);
  
  // Default number of items to show
  const DEFAULT_ITEMS_TO_SHOW = 8;
  
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
  
  // Define filter categories
  const filterCategories: FilterCategory[] = [
    {
      id: 'colors',
      name: 'Colors',
      icon: <Circle size={20} className="text-blue-500" />,
      options: colors,
      selectedValues: selectedColors,
      onChange: onColorsChange,
      showColors: true
    },
    {
      id: 'locations',
      name: 'Locations',
      icon: <MapPin size={20} className="text-blue-500" />,
      options: postcodes,
      selectedValues: selectedPostcodes,
      onChange: onPostcodesChange,
      searchable: true
    },
    {
      id: 'professions',
      name: 'Professions',
      icon: <User size={20} className="text-blue-500" />,
      options: professions,
      selectedValues: selectedProfessions,
      onChange: onProfessionsChange,
      searchable: true
    }
  ];
  
  // Add optional categories if they exist
  if (eras && onErasChange) {
    filterCategories.push({
      id: 'eras',
      name: 'Time Periods',
      icon: <Calendar size={20} className="text-blue-500" />,
      options: eras,
      selectedValues: selectedEras || [],
      onChange: onErasChange
    });
  }
  
  if (organisations && onOrganisationsChange) {
    filterCategories.push({
      id: 'organisations',
      name: 'Organisations',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
      options: organisations,
      selectedValues: selectedOrganisations || [],
      onChange: onOrganisationsChange,
      searchable: true
    });
  }
  
  // Get the current category being viewed
  const currentCategory = filterCategories.find(cat => cat.id === currentView);
  
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
          Select a category to filter plaques
        </div>
      </div>
      
      <div className="divide-y">
        {/* Categories List */}
        {filterCategories.map((category) => (
          <button
            key={category.id}
            className="w-full py-3 px-4 flex items-center justify-between"
            onClick={() => {
              setCurrentView(category.id);
              setSearchQuery('');
              setShowAll(false);
            }}
          >
            <div className="flex items-center">
              {category.icon}
              <span className="ml-3 font-medium">{category.name}</span>
            </div>
            <div className="flex items-center">
              {category.selectedValues.length > 0 && (
                <Badge className="mr-2 bg-blue-100 text-blue-700">
                  {category.selectedValues.length}
                </Badge>
              )}
              <ArrowRight size={16} className="text-gray-400" />
            </div>
          </button>
        ))}
        
        {/* Additional Filters */}
        <div className="px-4 py-3">
          <h3 className="font-medium mb-3">Additional Filters</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle size={18} className="text-blue-500 mr-2" />
                <div>
                  <div className="font-medium text-sm">Only Visited</div>
                  <div className="text-xs text-gray-500">Show plaques you've visited</div>
                </div>
              </div>
              <Switch 
                checked={onlyVisited}
                onCheckedChange={onVisitedChange}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star size={18} className="text-blue-500 mr-2" />
                <div>
                  <div className="font-medium text-sm">Only Favorites</div>
                  <div className="text-xs text-gray-500">Show only your favorite plaques</div>
                </div>
              </div>
              <Switch 
                checked={onlyFavorites}
                onCheckedChange={onFavoritesChange}
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
    
    // Show top items first if there are selected values
    filteredOptions.sort((a, b) => {
      const aSelected = selectedValues.includes(a.value);
      const bSelected = selectedValues.includes(b.value);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (b.count || 0) - (a.count || 0); // Then sort by count
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
              onClick={() => onChange(filteredOptions.map(o => o.value))}
              disabled={selectedValues.length === filteredOptions.length}
            >
              Select All
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
              visibleOptions.map(option => (
                showColors ? (
                  // Color option with colored circle
                  <label 
                    key={option.value}
                    className={cn(
                      "flex items-center p-2 rounded-lg border hover:bg-gray-50 cursor-pointer",
                      selectedValues.includes(option.value) ? "border-blue-300 bg-blue-50" : "border-gray-200"
                    )}
                  >
                    <input 
                      type="checkbox"
                      className="rounded text-blue-500 mr-2"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => toggleSelection(selectedValues, onChange, option.value)}
                    />
                    <div className="flex items-center">
                      <div className={cn(
                        "w-4 h-4 rounded-full mr-2",
                        option.value === 'blue' ? "bg-blue-500" :
                        option.value === 'green' ? "bg-green-500" :
                        option.value === 'brown' ? "bg-amber-700" :
                        option.value === 'black' ? "bg-gray-800" :
                        option.value === 'gray' ? "bg-gray-600" :
                        option.value === 'red' ? "bg-red-500" :
                        "bg-blue-500"
                      )}></div>
                      <span>{option.label}</span>
                      {option.count && (
                        <span className="ml-1 text-gray-500 text-xs">({option.count})</span>
                      )}
                    </div>
                  </label>
                ) : (
                  // Standard option
                  <label 
                    key={option.value}
                    className={cn(
                      "flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer",
                      selectedValues.includes(option.value) ? "bg-blue-50" : ""
                    )}
                  >
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        className="rounded text-blue-500 mr-2"
                        checked={selectedValues.includes(option.value)}
                        onChange={() => toggleSelection(selectedValues, onChange, option.value)}
                      />
                      <span>{option.label}</span>
                    </div>
                    {option.count && (
                      <span className="text-xs text-gray-500">{option.count}</span>
                    )}
                  </label>
                )
              ))
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
      <DialogContent className="sm:max-w-[400px] p-0 h-[85vh] max-h-[650px] flex flex-col overflow-hidden rounded-lg">
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