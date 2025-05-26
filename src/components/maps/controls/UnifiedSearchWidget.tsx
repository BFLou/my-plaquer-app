// src/components/maps/controls/UnifiedSearchWidget.tsx - FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader, Target } from 'lucide-react';
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
    [key: string]: string | undefined;
  };
  importance?: number;
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
  
  // Map controls
  onFindUserLocation: () => void;
  isLoadingLocation: boolean;
  
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
  onFindUserLocation,
  isLoadingLocation,
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

  // Search input handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Detect search type
    if (value.length > 0) {
      // Simple heuristic for search type detection
      const isLocation = /\d/.test(value) || 
                        /london|street|road|avenue|park|square|borough|postcode/i.test(value) ||
                        value.length < 15; // Short queries are likely locations
      
      setSearchType(isLocation ? 'location' : 'plaque');
      
      // Only fetch location suggestions for location searches
      if (isLocation && value.length >= 2) {
        // Check cache first
        if (autocompleteCache.current.has(value)) {
          setSuggestions(autocompleteCache.current.get(value) || []);
          setShowSuggestions(true);
          return;
        }
        
        // Debounce API calls
        debounceTimerRef.current = setTimeout(() => {
          fetchLocationSuggestions(value);
        }, 300);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSearchType(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Fetch location suggestions
  const fetchLocationSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;
    
    setIsFetching(true);
    
    try {
      // London-focused search with bounding box
      const londonBounds = 'viewbox=-0.489,51.28,0.236,51.686&bounded=1';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', London')}&limit=6&addressdetails=1&${londonBounds}&countrycodes=gb`
      );
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      
      // Format and prioritize suggestions
      const formattedSuggestions = data
        .map((item: any) => ({
          id: item.place_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
          address: item.address,
          importance: item.importance || 0
        }))
        .sort((a: LocationSuggestion, b: LocationSuggestion) => {
          // Prioritize by type and importance
          const typeOrder = { 
            'street': 5, 'road': 5, 'suburb': 4, 'neighbourhood': 4,
            'postcode': 3, 'city_district': 2, 'borough': 2, 'city': 1 
          };
          
          const aScore = (typeOrder[a.type as keyof typeof typeOrder] || 0) + (a.importance || 0);
          const bScore = (typeOrder[b.type as keyof typeof typeOrder] || 0) + (b.importance || 0);
          
          return bScore - aScore;
        });
      
      // Cache results
      autocompleteCache.current.set(query, formattedSuggestions);
      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
      
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Handle suggestion selection
  const handleSuggestionClick = useCallback((suggestion: LocationSuggestion) => {
    setSearchValue(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Set location
    onLocationSet([suggestion.lat, suggestion.lon], suggestion.display_name);
    toast.success("Location set! Distance filter activated.");
  }, [onLocationSet]);

  // Handle search submit
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    
    if (searchType === 'location') {
      // Search for location
      fetchLocationSuggestions(searchValue);
    } else {
      // For plaque search, we could integrate with the main search
      // For now, show a message
      toast.info("Plaque search integrated with main search bar");
    }
  }, [searchValue, searchType, fetchLocationSuggestions]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchType(null);
  }, []);

  // Handle location actions
  const handleFindMyLocation = useCallback(() => {
    onFindUserLocation();
  }, [onFindUserLocation]);

  const handleRemoveLocation = useCallback(() => {
    onLocationClear();
    toast.info("Location cleared");
  }, [onLocationClear]);

  // Distance slider change
  const handleDistanceChange = useCallback((values: number[]) => {
    const displayValue = values[0];
    const kmValue = getKmFromDisplay(displayValue);
    onDistanceChange(kmValue, hideOutsidePlaques);
  }, [getKmFromDisplay, onDistanceChange, hideOutsidePlaques]);

  // Toggle hide distant plaques
  const handleToggleHide = useCallback((checked: boolean) => {
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
              onClick={activeLocation ? handleRemoveLocation : handleFindMyLocation}
              disabled={isLoadingLocation}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                activeLocation 
                  ? 'bg-green-100 border-green-500 hover:bg-green-200' 
                  : 'bg-gray-100 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
              }`}
              title={activeLocation ? 'Remove location' : 'Find my location'}
            >
              {isLoadingLocation ? (
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <MapPin className={`w-4 h-4 ${
                  activeLocation ? 'text-green-600' : 'text-gray-500'
                }`} />
              )}
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
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="pl-10 pr-20 h-11 border-2 border-gray-200 focus:border-blue-500 bg-white shadow-sm"
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

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 border-t border-gray-100 pt-3">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.display_name.split(',').slice(0, 2).join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {suggestion.type} {suggestion.address?.postcode && `• ${suggestion.address.postcode}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Location Controls - Show when location is set */}
          {isExpanded && activeLocation && (
            <div className="space-y-4 border-t border-gray-100 pt-4 animate-in slide-in-from-top-2 duration-300">
              
              {/* Current Location Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">
                    {getLocationDisplayName()}
                  </span>
                </div>
                <button
                  onClick={handleRemoveLocation}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>

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
            </div>
          )}
        </div>
      </div>

      {/* Quick Action - Show when no location is set */}
      {!activeLocation && !isLoadingLocation && (
        <div className="flex justify-center mt-3">
          <Button
            onClick={handleFindMyLocation}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm border-white/20 hover:bg-white hover:shadow-md transition-all"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Find My Location
          </Button>
        </div>
      )}
    </div>
  );
};

export default UnifiedSearchWidget;