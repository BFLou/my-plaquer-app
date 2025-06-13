// Enhanced SearchBar Component with improved styling and functionality
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Search, MapPin, X, Loader, Navigation, Star, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { useMapboxGeocoding } from '@/hooks/useMapboxGeocoding';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { toast } from 'sonner';
import { searchPlaques, highlightSearchTerms } from './enhancedSearchLogic';

// FIXED: Extended interface that includes both plaque and location result properties
interface ExtendedSearchResult {
  type: 'plaque' | 'location' | 'postcode' | 'area';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  plaque?: Plaque;
  relevanceScore?: number;
  matchedFields?: string[];
  placeType?: string; // For location results from Mapbox
}

interface SearchBarProps {
  plaques: Plaque[];
  value: string;
  onChange: (query: string) => void;
  onSelect: (result: any) => void;
  onLocationSelect: (result: any) => void;
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  plaques,
  value,
  onChange,
  onSelect,
  onLocationSelect,
  className = '',
  placeholder = "Search plaques, people, or locations..."
}) => {
  const mobile = isMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestionsState, setShowSuggestionsState] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced Mapbox integration
  const mapboxHook = useMapboxGeocoding({
    debounceTime: 400,
    country: ['gb'],
    bbox: [-0.489, 51.28, 0.236, 51.686]
  });

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentPlaqueSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (error) {
      console.warn('Could not load recent searches:', error);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((query: string) => {
    if (query.trim().length < 2) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    
    try {
      localStorage.setItem('recentPlaqueSearches', JSON.stringify(updated));
    } catch (error) {
      console.warn('Could not save recent search:', error);
    }
  }, [recentSearches]);

  // Sync Mapbox query with external value
  useEffect(() => {
    if (mapboxHook.query !== value) {
      mapboxHook.setQuery(value);
    }
  }, [value, mapboxHook.setQuery, mapboxHook.query]);

  // Enhanced plaque search with fuzzy matching - convert to ExtendedSearchResult
  const plaqueResults = useMemo(() => {
    if (!value.trim() || value.length < 2) return [];
    
    const results = searchPlaques(plaques, value);
    // Convert to ExtendedSearchResult format
    return results.slice(0, 6).map(result => ({
      ...result,
      placeType: undefined // Plaque results don't have placeType
    } as ExtendedSearchResult));
  }, [plaques, value]);

  // Enhanced location results with better address formatting and FIXED typing
  const locationResults = useMemo(() => {
    console.log(`📍 Processing ${mapboxHook.suggestions.length} Mapbox suggestions`);
    
    return mapboxHook.suggestions
      .map(feature => {
        const [lng, lat] = feature.center;
        
        // Format title and subtitle based on place type
        let title = feature.text;
        let subtitle = feature.place_name;
        
        // For addresses, show the full address as title
        if (feature.place_type.includes('address')) {
          const addressParts = feature.place_name.split(',');
          title = addressParts[0]; // Full address number and street
          subtitle = addressParts.slice(1).join(',').trim(); // Area, postcode, etc.
        }
        // For postcodes, highlight them
        else if (feature.place_type.includes('postcode')) {
          title = feature.text; // The postcode
          subtitle = feature.place_name.replace(feature.text, '').replace(/^,\s*/, '');
        }
        // For POIs and places
        else {
          title = feature.text;
          const contextParts = feature.place_name.split(',');
          subtitle = contextParts.slice(1, 3).join(',').trim() || 'London';
        }
        
        console.log(`📍 ${feature.place_type.join('/')}: ${title} - ${subtitle}`);
        
        // Return properly typed ExtendedSearchResult with placeType
        return {
          type: 'location' as const,
          id: feature.id,
          title,
          subtitle,
          coordinates: [lat, lng] as [number, number],
          placeType: feature.place_type[0] // Store primary place type for styling
        } as ExtendedSearchResult;
      });
  }, [mapboxHook.suggestions]);

  // Combined results with relevance sorting
  const allResults = useMemo(() => {
    const combined = [...plaqueResults, ...locationResults];
    
    // Sort plaques by relevance score, locations by Mapbox relevance
    return combined.sort((a, b) => {
      if (a.type === 'plaque' && b.type === 'plaque') {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
      if (a.type === 'plaque') return -1; // Prioritize plaque results
      if (b.type === 'plaque') return 1;
      return 0;
    });
  }, [plaqueResults, locationResults]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestionsState(newValue.length > 0);
    setSelectedIndex(-1);
  }, [onChange]);

  // Enhanced result selection
  const handleSelectResult = useCallback((result: ExtendedSearchResult) => {
    if (mobile) triggerHapticFeedback('selection');
    
    if (result.type === 'plaque' && result.plaque) {
      saveRecentSearch(value);
      onSelect({
        type: 'plaque',
        coordinates: result.coordinates,
        plaque: result.plaque,
        title: result.title
      });
      toast.success(`Found: ${result.title}`, {
        description: result.subtitle
      });
    } else if (result.type === 'location') {
      onLocationSelect({
        type: 'location',
        coordinates: result.coordinates,
        title: result.title.split(',')[0],
        description: result.subtitle
      });
      toast.success(`Location set: ${result.title}`);
    }
    
    setShowSuggestionsState(false);
    setIsExpanded(false);
    setSelectedIndex(-1);
  }, [mobile, onSelect, onLocationSelect, saveRecentSearch, value]);



  // Handle recent search selection
  const handleSelectRecentSearch = useCallback((search: string) => {
    onChange(search);
    setShowSuggestionsState(true);
    setIsExpanded(true);
    searchInputRef.current?.focus();
    if (mobile) triggerHapticFeedback('light');
  }, [onChange, mobile]);

  // Enhanced keyboard navigation - removed quick suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = allResults.length + recentSearches.length;
    
    if (!showSuggestionsState || totalItems === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < allResults.length) {
            handleSelectResult(allResults[selectedIndex]);
          } else {
            const recentIndex = selectedIndex - allResults.length;
            handleSelectRecentSearch(recentSearches[recentIndex]);
          }
        }
        break;
      case 'Escape':
        setShowSuggestionsState(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  }, [showSuggestionsState, allResults, recentSearches, selectedIndex, handleSelectResult, handleSelectRecentSearch]);

  // Handle focus and blur - removed quick suggestions
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    setShowSuggestionsState(value.length > 0 || recentSearches.length > 0);
  }, [value, recentSearches.length]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setShowSuggestionsState(false);
        setIsExpanded(false);
      }
    }, 150);
  }, []);

  // Clear search
  const handleClear = useCallback(() => {
    onChange('');
    mapboxHook.clearSearch();
    setShowSuggestionsState(false);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
    if (mobile) triggerHapticFeedback('light');
  }, [onChange, mapboxHook.clearSearch, mobile]);

  // Current location handler
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const loadingToast = toast.loading("Finding your location...");
    if (mobile) triggerHapticFeedback('selection');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        if (mobile) triggerHapticFeedback('success');
        
        onLocationSelect({
          type: 'current-location',
          coordinates: [position.coords.latitude, position.coords.longitude],
          title: 'Your Location'
        });
        toast.success('Location found');
      },
      () => {
        toast.dismiss(loadingToast);
        if (mobile) triggerHapticFeedback('error');
        toast.error("Could not get your location");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [mobile, onLocationSelect]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Enhanced Search Input Container */}
      <div className={`
        relative bg-white/95 backdrop-blur-sm border border-gray-200
        ${isExpanded ? 'ring-2 ring-blue-500/20 border-blue-300' : 'hover:border-gray-300'}
        ${mobile ? 'h-12' : 'h-11'}
        px-4 flex items-center gap-3 rounded-xl shadow-sm transition-all duration-200
      `}>
        {/* Search Icon */}
        <Search 
          size={mobile ? 20 : 18} 
          className={`${isExpanded ? 'text-blue-600' : 'text-gray-400'} flex-shrink-0 transition-colors`}
        />
        
        {/* Input Field */}
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
            flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none p-0
            ${mobile ? 'text-base' : 'text-sm'} placeholder:text-gray-500
          `}
        />
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {mapboxHook.isLoading && (
            <Loader size={16} className="text-blue-500 animate-spin" />
          )}
          
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-full"
            >
              <X size={14} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCurrentLocation}
            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full"
            title="Use current location"
          >
            <Navigation size={14} />
          </Button>
        </div>
      </div>

      {/* Enhanced Suggestions Dropdown */}
      {showSuggestionsState && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[1010] max-h-[400px]">
          {mapboxHook.error && (
            <div className="px-4 py-3 text-red-600 text-sm border-b border-gray-100 bg-red-50">
              ⚠️ {mapboxHook.error}
            </div>
          )}
          
          <ScrollArea className="max-h-[350px]">
            <div className="py-2">
              
              {/* Search Results Section */}
              {allResults.length > 0 && (
                <div>
                  {plaqueResults.length > 0 && (
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Historic Plaques
                    </div>
                  )}
                  {locationResults.length > 0 && (
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      📍 London Addresses & Places
                    </div>
                  )}
                  {allResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                        ${selectedIndex === index ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
                        flex items-start gap-3
                      `}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                        ${result.type === 'plaque' 
                          ? 'bg-purple-100 text-purple-600' 
                          : result.placeType === 'address' 
                            ? 'bg-blue-100 text-blue-600'
                            : result.placeType === 'postcode'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-orange-100 text-orange-600'
                        }
                      `}>
                        {result.type === 'plaque' ? (
                          <MapPin size={16} />
                        ) : result.placeType === 'address' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
                            <path d="m3 9 9-7 9 7"/>
                          </svg>
                        ) : result.placeType === 'postcode' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                          </svg>
                        ) : (
                          <Navigation size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-medium text-gray-900 text-sm leading-tight"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerms(result.title, value)
                          }}
                        />
                        <div className="text-gray-500 text-xs mt-1 leading-tight">
                          {result.subtitle}
                        </div>
                        {result.type === 'plaque' && result.plaque?.profession && (
                          <Badge variant="secondary" className="mt-2 text-xs h-5 px-2">
                            {result.plaque.profession}
                          </Badge>
                        )}
                        {result.type === 'plaque' && result.relevanceScore && result.relevanceScore > 0.8 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={10} className="text-yellow-500 fill-current" />
                            <span className="text-xs text-yellow-600">High match</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Recent Searches - moved up since no more quick suggestions */}
              {!value.trim() && recentSearches.length > 0 && (
                <div className={allResults.length > 0 ? 'border-t border-gray-100' : ''}>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    🕒 Recent Searches
                  </div>
                  {recentSearches.map((search, index) => {
                    const adjustedIndex = allResults.length + index;
                    return (
                      <button
                        key={`recent-${search}`}
                        onClick={() => handleSelectRecentSearch(search)}
                        className={`
                          w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                          ${selectedIndex === adjustedIndex ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
                          flex items-center gap-3
                        `}
                        onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                      >
                        <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Search size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {search}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Previous search
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* No Results State */}
          {value.length > 0 && !mapboxHook.isLoading && allResults.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-900 font-medium mb-2">No results found</div>
              <div className="text-gray-500 text-sm">
                Try different keywords or check spelling
              </div>
            </div>
          )}
          
          {/* Helper Text - simplified without quick search reference */}
          {!value && allResults.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-500 bg-blue-50 border-t border-gray-100">
              💡 Search for people, professions, or London locations. Try "Hendrix", "author", or "Camden"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;