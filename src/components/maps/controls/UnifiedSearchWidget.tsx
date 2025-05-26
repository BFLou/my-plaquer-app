// src/components/maps/controls/UnifiedSearchWidget.tsx - Complete Enhanced Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

interface LocationSuggestion {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  address?: {
    country?: string;
    city?: string;
    state?: string;
    postcode?: string;
    borough?: string;
    [key: string]: string | undefined;
  };
  importance?: number;
  class?: string;
  boundingbox?: string[];
}

interface UnifiedSearchWidgetProps {
  // Location state
  activeLocation: [number, number] | null;
  locationType: 'user' | 'search' | null;
  onLocationSet: (location: [number, number], address?: string) => void;
  onLocationClear: () => void;
  
  // Distance filter state
  maxDistance: number;
  onDistanceChange: (distance: number, hideOutside: boolean) => void;
  hideOutsidePlaques: boolean;
  
  // Results
  filteredPlaquesCount: number;
  totalPlaques: number;
  
  // Units
  useImperial?: boolean;
  
  // Layout
  className?: string;
}

const UnifiedSearchWidget: React.FC<UnifiedSearchWidgetProps> = ({
  activeLocation,
  locationType,
  onLocationSet,
  onLocationClear,
  maxDistance,
  onDistanceChange,
  hideOutsidePlaques,
  filteredPlaquesCount,
  totalPlaques,
  useImperial = false,
  className = ''
}) => {
  // Component state
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchType, setSearchType] = useState<'location' | 'plaque' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteCache = useRef<Map<string, LocationSuggestion[]>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Expand widget when location is set
  useEffect(() => {
    setIsExpanded(!!activeLocation);
  }, [activeLocation]);
  
  // Distance conversion helpers
  const getDisplayDistance = useCallback((kmValue: number) => {
    return useImperial ? (kmValue * 0.621371) : kmValue;
  }, [useImperial]);

  const getKmFromDisplay = useCallback((displayValue: number) => {
    return useImperial ? (displayValue / 0.621371) : displayValue;
  }, [useImperial]);

  const formatDistance = useCallback((distance: number) => {
    const unit = useImperial ? 'mi' : 'km';
    return `${distance.toFixed(1)} ${unit}`;
  }, [useImperial]);

  // Search input handler - ENHANCED: Better autocomplete triggering
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Always clear suggestions when typing
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Detect search type and fetch suggestions
    if (value.length >= 2) {
      // Improved heuristic for search type detection
      const isLocationSearch = /\d/.test(value) || 
                             /london|street|road|avenue|park|square|borough|postcode|station|bridge|market|church|school|hospital|theatre|museum|gallery|library|town|city|centre|center/i.test(value) ||
                             value.length <= 20; // Longer queries might be plaque names
      
      setSearchType(isLocationSearch ? 'location' : 'plaque');
      
      // Fetch location suggestions for location searches
      if (isLocationSearch) {
        // Check cache first
        const cacheKey = value.toLowerCase().trim();
        if (autocompleteCache.current.has(cacheKey)) {
          const cachedSuggestions = autocompleteCache.current.get(cacheKey) || [];
          setSuggestions(cachedSuggestions);
          setShowSuggestions(cachedSuggestions.length > 0);
          return;
        }
        
        // Debounce API calls
        debounceTimerRef.current = setTimeout(() => {
          fetchLocationSuggestions(value);
        }, 250); // Reduced debounce for faster response
      }
    } else {
      setSearchType(null);
    }
  }, []);

  // ENHANCED: Fetch location suggestions with better error handling
  const fetchLocationSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;
    
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return;
    
    setIsFetching(true);
    
    try {
      // Enhanced London-focused search with better bounding box
      const londonBounds = 'viewbox=-0.489,51.28,0.236,51.686&bounded=1';
      const searchQuery = encodeURIComponent(`${query}, London, UK`);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=8&addressdetails=1&${londonBounds}&countrycodes=gb&dedupe=1`,
        {
          headers: {
            'User-Agent': 'PlaquerApp/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      // Enhanced formatting and prioritization
      const formattedSuggestions = data
        .filter((item: any) => item.lat && item.lon && item.display_name)
        .map((item: any) => ({
          id: item.place_id || Math.random().toString(),
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type || 'location',
          address: item.address || {},
          importance: parseFloat(item.importance) || 0,
          class: item.class || '',
          boundingbox: item.boundingbox || []
        }))
        .sort((a: LocationSuggestion, b: LocationSuggestion) => {
          // Enhanced prioritization
          const getTypeScore = (type: string, cls: string) => {
            if (cls === 'highway' && ['primary', 'secondary', 'tertiary'].includes(type)) return 10;
            if (type === 'road' || type === 'street') return 9;
            if (type === 'suburb' || type === 'neighbourhood') return 8;
            if (cls === 'railway' && type === 'station') return 7;
            if (cls === 'amenity') return 6;
            if (type === 'postcode') return 5;
            if (type === 'city_district' || type === 'borough') return 4;
            return 3;
          };
          
          const aScore = getTypeScore(a.type, a.class || '') + (a.importance * 2);
          const bScore = getTypeScore(b.type, b.class || '') + (b.importance * 2);
          
          return bScore - aScore;
        })
        .slice(0, 6); // Limit to 6 results
      
      // Cache results with lowercase key
      autocompleteCache.current.set(trimmedQuery, formattedSuggestions);
      
      // Only show suggestions if the query hasn't changed
      if (searchValue.toLowerCase().trim() === trimmedQuery) {
        setSuggestions(formattedSuggestions);
        setShowSuggestions(formattedSuggestions.length > 0);
      }
      
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      // Show user-friendly error for network issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error("Network error. Please check your connection.");
      }
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsFetching(false);
    }
  }, [searchValue]);

  // ENHANCED: Handle suggestion selection
  const handleSuggestionClick = useCallback((suggestion: LocationSuggestion) => {
    setSearchValue(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Set location with coordinates
    onLocationSet([suggestion.lat, suggestion.lon], suggestion.display_name);
    toast.success("Location set! Distance filter activated.");
  }, [onLocationSet]);

  // ENHANCED: Keyboard navigation for suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else if (suggestions.length > 0) {
          handleSuggestionClick(suggestions[0]);
        } else {
          handleSearchSubmit(e as any);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, handleSuggestionClick]);
  
  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);

  // Handle search submit
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    
    if (searchType === 'location' && suggestions.length > 0) {
      // Use first suggestion if available
      handleSuggestionClick(suggestions[0]);
    } else if (searchType === 'location') {
      // Manual search for location
      fetchLocationSuggestions(searchValue);
    } else {
      // For plaque search, we could integrate with the main search
      toast.info("Plaque search integrated with main search bar");
    }
  }, [searchValue, searchType, suggestions, handleSuggestionClick, fetchLocationSuggestions]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchType(null);
  }, []);

  // Handle location removal
  const handleRemoveLocation = useCallback(() => {
    onLocationClear();
    setSearchValue(''); // Clear search input too
    toast.info("Location cleared");
  }, [onLocationClear]);

  // FIXED: Distance slider change with proper state management
  const handleDistanceChange = useCallback((values: number[]) => {
    const displayValue = values[0];
    const kmValue = getKmFromDisplay(displayValue);
    console.log('Distance slider changed:', { displayValue, kmValue, hideOutsidePlaques });
    onDistanceChange(kmValue, hideOutsidePlaques);
  }, [getKmFromDisplay, onDistanceChange, hideOutsidePlaques]);

  // FIXED: Toggle hide distant plaques with proper state management
  const handleToggleHide = useCallback((checked: boolean) => {
    console.log('Hide toggle changed:', { checked, maxDistance });
    onDistanceChange(maxDistance, checked);
  }, [maxDistance, onDistanceChange]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Distance range settings
  const displayDistance = getDisplayDistance(maxDistance);
  const unit = useImperial ? 'mi' : 'km';
  const distanceMarkers = useImperial 
    ? [0.3, 0.6, 1.2, 1.9, 3.1] // miles
    : [0.5, 1, 2, 3, 5]; // kilometers
  const minDistance = Math.min(...distanceMarkers);
  const maxDistanceLimit = Math.max(...distanceMarkers);

  // Get location display name
  const getLocationDisplayName = () => {
    if (!activeLocation) return '';
    if (locationType === 'user') return 'Current Location';
    if (searchValue && searchValue.includes(',')) {
      return searchValue.split(',').slice(0, 2).join(', ');
    }
    return 'Search Location';
  };

  return (
    <div className={`relative z-[1001] ${className}`} style={{ zIndex: 1001 }}>
      {/* Main Search Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 transition-all duration-300">
        <div className="p-4 space-y-4">
          
          {/* Search Input Row */}
          <div className="flex items-center space-x-3">
            {/* Location Status Indicator */}
            <button
              onClick={activeLocation ? handleRemoveLocation : undefined}
              disabled={!activeLocation}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                activeLocation 
                  ? 'bg-green-100 border-green-500 hover:bg-green-200 cursor-pointer' 
                  : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
              }`}
              title={activeLocation ? 'Remove location' : 'No location set'}
            >
              <MapPin className={`w-4 h-4 ${
                activeLocation ? 'text-green-600' : 'text-gray-400'
              }`} />
            </button>

            {/* Search Input */}
            <div className="flex-1 relative" ref={inputRef}>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search location in London..."
                    value={searchValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="pl-10 pr-20 h-11 border-2 border-gray-200 focus:border-blue-500 bg-white shadow-sm"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
              </form>
              
              {/* Search Type Indicator */}
              {searchType && searchValue && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    searchType === 'location' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {searchType === 'location' ? 'Location' : 'Plaque'}
                  </span>
                </div>
              )}
              
              {/* Clear Button */}
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Loading Indicator */}
            {isFetching && (
              <div className="w-6 h-6 flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          {/* IMPROVED: Search Suggestions with keyboard navigation */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1 border-t border-gray-100 pt-3 bg-white rounded-b-lg">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    index === selectedSuggestionIndex 
                      ? 'bg-blue-100 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.display_name.split(',').slice(0, 2).join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
                      <span>{suggestion.type.replace('_', ' ')}</span>
                      {suggestion.address?.postcode && (
                        <>
                          <span>•</span>
                          <span>{suggestion.address.postcode}</span>
                        </>
                      )}
                      {suggestion.address?.borough && (
                        <>
                          <span>•</span>
                          <span>{suggestion.address.borough}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {index === selectedSuggestionIndex && '↵'}
                  </div>
                </button>
              ))}
              
              {/* Keyboard hints */}
              <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                Use ↑↓ to navigate, ↵ to select, Esc to close
              </div>
            </div>
          )}

          {/* Location Controls - Show when location is set */}
          {isExpanded && activeLocation && (
            <div className="space-y-4 border-t border-gray-100 pt-4 animate-in slide-in-from-top-2 duration-300">
              
              {/* Location Display with Collapse Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">
                    {getLocationDisplayName()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRemoveLocation}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                  {/* Collapse Button */}
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center"
                    title={isCollapsed ? 'Expand controls' : 'Collapse controls'}
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Distance Controls */}
              {!isCollapsed && (
                <>
                  {/* Distance Filter */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        Distance Range
                      </label>
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {formatDistance(displayDistance)}
                      </span>
                    </div>
                    
                    {/* Distance Slider */}
                    <div className="px-1">
                      <Slider
                        value={[displayDistance]}
                        min={minDistance}
                        max={maxDistanceLimit}
                        step={useImperial ? 0.1 : 0.1}
                        onValueChange={handleDistanceChange}
                        className="w-full"
                      />
                      
                      {/* Range Labels */}
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{distanceMarkers[0]}{unit}</span>
                        <span>{distanceMarkers[2]}{unit}</span>
                        <span>{distanceMarkers[4]}{unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Results & Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-blue-600">{filteredPlaquesCount}</span>
                      <span className="mx-1">of</span>
                      <span className="font-semibold">{totalPlaques}</span>
                      <span className="ml-1">plaques found</span>
                    </div>
                    
                    {/* Hide Toggle */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hide-distant"
                        checked={hideOutsidePlaques}
                        onCheckedChange={handleToggleHide}
                        size="sm"
                      />
                      <Label htmlFor="hide-distant" className="text-xs text-gray-600">
                        Hide distant
                      </Label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedSearchWidget;