// Enhanced SearchBar Component with Improved Search and Styling
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Search, MapPin, X, Loader, Navigation, Star, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { useMapboxGeocoding } from '@/hooks/useMapboxGeocoding';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { toast } from 'sonner';
import { searchPlaques, highlightSearchTerms, getSearchSuggestions } from './enhancedSearchLogic';
import './SearchBar.css';

interface SearchResult {
  type: 'plaque' | 'location';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  plaque?: Plaque;
  relevanceScore?: number;
  matchedFields?: string[];
}

interface SearchBarProps {
  plaques: Plaque[];
  value: string;
  onChange: (query: string) => void;
  onSelect: (result: any) => void;
  onLocationSelect: (result: any) => void;
  className?: string;
  placeholder?: string;
  showSuggestions?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  plaques,
  value,
  onChange,
  onSelect,
  onLocationSelect,
  className = '',
  placeholder = "Search for plaques, people, or locations...",
  showSuggestions = true
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

  // Enhanced plaque search with fuzzy matching
  const plaqueResults = useMemo(() => {
    if (!value.trim() || value.length < 2) return [];
    
    const results = searchPlaques(plaques, value);
    return results.slice(0, 4); // Limit plaque results to make room for locations
  }, [plaques, value]);

  // Filter and enhance location results
  const locationResults = useMemo(() => {
    return mapboxHook.suggestions
      .filter(feature => {
        const placeName = feature.place_name.toLowerCase();
        const isInLondon = placeName.includes('london') ||
                          placeName.includes('greater london') ||
                          feature.context?.some(ctx => 
                            ctx.text.toLowerCase().includes('london')
                          );
        
        const [lng, lat] = feature.center;
        const inLondonBounds = lat >= 51.28 && lat <= 51.686 && 
                              lng >= -0.489 && lng <= 0.236;
        
        return isInLondon || inLondonBounds;
      })
      .slice(0, 4)
      .map(feature => ({
        type: 'location' as const,
        id: feature.id,
        title: feature.text,
        subtitle: feature.place_name,
        coordinates: [feature.center[1], feature.center[0]] as [number, number],
        feature
      }));
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

  // Get search suggestions
  const searchSuggestions = useMemo(() => {
    if (value.trim() || !showSuggestions) return [];
    return getSearchSuggestions(plaques).slice(0, 6);
  }, [plaques, value, showSuggestions]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestionsState(newValue.length > 0 || searchSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [onChange, searchSuggestions.length]);

  // Enhanced result selection
  const handleSelectResult = useCallback((result: SearchResult) => {
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

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    onChange(suggestion);
    setShowSuggestionsState(true);
    setIsExpanded(true);
    searchInputRef.current?.focus();
    if (mobile) triggerHapticFeedback('light');
  }, [onChange, mobile]);

  // Handle recent search selection
  const handleSelectRecentSearch = useCallback((search: string) => {
    onChange(search);
    setShowSuggestionsState(true);
    setIsExpanded(true);
    searchInputRef.current?.focus();
    if (mobile) triggerHapticFeedback('light');
  }, [onChange, mobile]);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = allResults.length + searchSuggestions.length + recentSearches.length;
    
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
          } else if (selectedIndex < allResults.length + searchSuggestions.length) {
            const suggestionIndex = selectedIndex - allResults.length;
            handleSelectSuggestion(searchSuggestions[suggestionIndex]);
          } else {
            const recentIndex = selectedIndex - allResults.length - searchSuggestions.length;
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
  }, [showSuggestionsState, allResults, searchSuggestions, recentSearches, selectedIndex, handleSelectResult, handleSelectSuggestion, handleSelectRecentSearch]);

  // Handle focus and blur
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    setShowSuggestionsState(value.length > 0 || searchSuggestions.length > 0 || recentSearches.length > 0);
  }, [value, searchSuggestions.length, recentSearches.length]);

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
      className={`search-bar-container ${className}`}
    >
      {/* Enhanced Search Input Container */}
      <div className={`
        search-input-container
        ${isExpanded ? 'focused' : ''}
        ${mobile ? 'h-14' : 'h-12'}
        px-4 flex items-center gap-3
      `}>
        {/* Search Icon */}
        <Search 
          size={mobile ? 22 : 20} 
          className="search-icon flex-shrink-0"
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
            search-input flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none p-0
            ${mobile ? 'text-base' : 'text-sm'}
          `}
        />
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {mapboxHook.isLoading && (
            <Loader size={18} className="text-gray-400 animate-spin" />
          )}
          
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 w-7 p-0 hover:bg-white/20 rounded-full search-action-button"
            >
              <X size={16} />
            </Button>
          )}
          
          {mobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCurrentLocation}
              className="h-7 w-7 p-0 hover:bg-white/20 rounded-full search-action-button"
              title="Use current location"
            >
              <Navigation size={16} className="text-blue-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Suggestions Dropdown */}
      {showSuggestionsState && (
        <div className="search-suggestions">
          {mapboxHook.error && (
            <div className="px-4 py-3 text-red-400 text-sm border-b border-white/5">
              ⚠️ {mapboxHook.error}
            </div>
          )}
          
          <ScrollArea className="max-h-80">
            <div className="py-2">
              
              {/* Search Results Section */}
              {allResults.length > 0 && (
                <div>
                  <div className="suggestion-section-header">
                    {plaqueResults.length > 0 ? '🏛️ Blue Plaques' : '📍 Locations'}
                  </div>
                  {allResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className={`
                        suggestion-item ${result.type}-result
                        ${selectedIndex === index ? 'selected' : ''}
                      `}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={`suggestion-icon ${result.type}`}>
                        {result.type === 'plaque' ? (
                          <MapPin size={18} />
                        ) : (
                          <Navigation size={18} />
                        )}
                      </div>
                      <div className="suggestion-content">
                        <div 
                          className="suggestion-title"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerms(result.title, value)
                          }}
                        />
                        <div className="suggestion-subtitle">
                          {result.subtitle}
                        </div>
                        {result.type === 'plaque' && result.plaque?.profession && (
                          <Badge variant="secondary" className="suggestion-badge mt-2">
                            {result.plaque.profession}
                          </Badge>
                        )}
                        {result.type === 'plaque' && result.relevanceScore && result.relevanceScore > 0.8 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={12} className="text-yellow-400 fill-current" />
                            <span className="text-xs text-yellow-400">High match</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Quick Search Suggestions */}
              {!value.trim() && searchSuggestions.length > 0 && (
                <div className={allResults.length > 0 ? 'border-t border-white/5 mt-2 pt-2' : ''}>
                  <div className="suggestion-section-header">
                    ⚡ Quick Search
                  </div>
                  {searchSuggestions.map((suggestion: string, index: number) => {
                    const adjustedIndex = allResults.length + index;
                    return (
                      <button
                        key={`suggestion-${suggestion}`}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`
                          suggestion-item
                          ${selectedIndex === adjustedIndex ? 'selected' : ''}
                        `}
                        onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                      >
                        <div className="suggestion-icon" style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        }}>
                          <Zap size={16} />
                        </div>
                        <div className="suggestion-content">
                          <div className="suggestion-title">
                            {suggestion}
                          </div>
                          <div className="suggestion-subtitle">
                            Popular search term
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Recent Searches */}
              {!value.trim() && recentSearches.length > 0 && (
                <div className={
                  (allResults.length > 0 || searchSuggestions.length > 0) 
                    ? 'border-t border-white/5 mt-2 pt-2' 
                    : ''
                }>
                  <div className="suggestion-section-header">
                    🕒 Recent Searches
                  </div>
                  {recentSearches.map((search, index) => {
                    const adjustedIndex = allResults.length + searchSuggestions.length + index;
                    return (
                      <button
                        key={`recent-${search}`}
                        onClick={() => handleSelectRecentSearch(search)}
                        className={`
                          suggestion-item
                          ${selectedIndex === adjustedIndex ? 'selected' : ''}
                        `}
                        onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                      >
                        <div className="suggestion-icon" style={{
                          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                        }}>
                          <Search size={16} />
                        </div>
                        <div className="suggestion-content">
                          <div className="suggestion-title">
                            {search}
                          </div>
                          <div className="suggestion-subtitle">
                            Previous search
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* No Results State */}
          {value.length > 0 && !mapboxHook.isLoading && allResults.length === 0 && (
            <div className="search-empty-state">
              <div className="search-empty-title">No results found</div>
              <div className="search-empty-description">
                Try different keywords or check spelling
              </div>
            </div>
          )}
          
          {/* Helper Text */}
          {!value && allResults.length === 0 && (
            <div className="search-helper-text">
              💡 Search for people, professions, or London locations. Try "Hendrix", "author", or "Camden"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;