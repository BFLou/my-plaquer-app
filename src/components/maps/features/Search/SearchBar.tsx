// src/components/maps/features/Search/SearchBar.tsx - FINAL VERSION with fixed Mapbox
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Search, MapPin, X, Loader, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { useMapboxGeocoding } from '@/hooks/useMapboxGeocoding';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { toast } from 'sonner';
import './SearchBar.css';

interface SearchResult {
  type: 'plaque' | 'location';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  plaque?: Plaque;
}

interface SearchBarProps {
  plaques: Plaque[];
  value: string;
  onChange: (query: string) => void;
  onSelect: (result: any) => void;
  onLocationSelect: (result: any) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  plaques,
  value,
  onChange,
  onSelect,
  onLocationSelect,
  className = ''
}) => {
  const mobile = isMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the bulletproof Mapbox hook
  const mapboxHook = useMapboxGeocoding({
    debounceTime: 300,
    country: ['gb'],
    bbox: [-0.489, 51.28, 0.236, 51.686] // London bounding box
  });

  // Sync the internal query with the external value
  React.useEffect(() => {
    if (mapboxHook.query !== value) {
      mapboxHook.setQuery(value);
    }
  }, [value, mapboxHook.setQuery, mapboxHook.query]);

  // Search plaques locally - memoized
  const plaqueResults = useMemo(() => {
    if (!value.trim() || value.length < 2) return [];
    
    const searchTerm = value.toLowerCase();
    return plaques
      .filter(p => 
        p.title?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.location?.toLowerCase().includes(searchTerm) ||
        p.address?.toLowerCase().includes(searchTerm) ||
        p.profession?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 3)
      .map(p => {
        const lat = typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude || 0;
        const lng = typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude || 0;
        
        return {
          type: 'plaque' as const,
          id: p.id,
          title: p.title || 'Unnamed Plaque',
          subtitle: p.location || p.address || 'No location',
          coordinates: [lat, lng] as [number, number],
          plaque: p
        };
      })
      .filter(p => p.coordinates[0] !== 0 && p.coordinates[1] !== 0);
  }, [plaques, value]);

  // Filter Mapbox results for London - memoized
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
      .slice(0, 5)
      .map(feature => ({
        type: 'location' as const,
        id: feature.id,
        title: feature.text,
        subtitle: feature.place_name,
        coordinates: [feature.center[1], feature.center[0]] as [number, number], // Convert to [lat, lng]
        feature
      }));
  }, [mapboxHook.suggestions]);

  // Combined results - memoized
  const allResults = useMemo(() => {
    return [...plaqueResults, ...locationResults];
  }, [plaqueResults, locationResults]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue); // Update external state
    setShowSuggestions(newValue.length > 0);
    setSelectedIndex(-1);
  }, [onChange]);

  // Handle result selection
  const handleSelectResult = useCallback((result: SearchResult) => {
    if (mobile) triggerHapticFeedback('selection');
    
    if (result.type === 'plaque' && result.plaque) {
      onSelect({
        type: 'plaque',
        coordinates: result.coordinates,
        plaque: result.plaque,
        title: result.title
      });
      toast.success(`Found plaque: ${result.title}`);
    } else if (result.type === 'location') {
      onLocationSelect({
        type: 'location',
        coordinates: result.coordinates,
        title: result.title.split(',')[0],
        description: result.subtitle
      });
      toast.success(`Location set: ${result.title}`);
    }
    
    setShowSuggestions(false);
    setIsExpanded(false);
    setSelectedIndex(-1);
  }, [mobile, onSelect, onLocationSelect]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || allResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleSelectResult(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  }, [showSuggestions, allResults, selectedIndex, handleSelectResult]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
    if (value.length > 0) {
      setShowSuggestions(true);
    }
  }, [value]);

  // Handle blur with delay for clicks
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setIsExpanded(false);
      }
    }, 150);
  }, []);

  // Clear search
  const handleClear = useCallback(() => {
    onChange('');
    mapboxHook.clearSearch();
    setShowSuggestions(false);
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
      {/* Search Input Container */}
      <div className={`
        search-input-container
        ${isExpanded ? 'focused' : ''}
        ${mobile ? 'h-12' : 'h-11'}
      `}>
        <div className="flex items-center">
          {/* Search Icon */}
          <div className="pl-3 pr-2">
            <Search 
              size={mobile ? 20 : 18} 
              className="text-gray-400"
            />
          </div>
          
          {/* Input Field */}
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={mobile ? "Search plaques or locations..." : "Search for plaques or enter a London address..."}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`
              search-input flex-1
              ${mobile ? 'text-base' : 'text-sm'}
            `}
          />
          
          {/* Action Buttons */}
          <div className="flex items-center pr-2 gap-1">
            {mapboxHook.isLoading && (
              <Loader size={16} className="text-gray-400 animate-spin" />
            )}
            
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              >
                <X size={14} className="text-gray-400" />
              </Button>
            )}
            
            {mobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCurrentLocation}
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                title="Use current location"
              >
                <Navigation size={14} className="text-blue-500" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="search-suggestions">
          {mapboxHook.error && (
            <div className="search-error">
              {mapboxHook.error}
            </div>
          )}
          
          {allResults.length > 0 ? (
            <ScrollArea className="max-h-80">
              <div className="py-2">
                {/* Plaque Results Section */}
                {plaqueResults.length > 0 && (
                  <div>
                    <div className="suggestion-section-header">
                      Blue Plaques
                    </div>
                    {plaqueResults.map((result, index) => (
                      <button
                        key={`plaque-${result.id}`}
                        onClick={() => handleSelectResult(result)}
                        className={`
                          suggestion-item plaque-result
                          ${selectedIndex === index ? 'selected' : ''}
                        `}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="suggestion-icon plaque">
                          <MapPin size={12} />
                        </div>
                        <div className="suggestion-content">
                          <div className="suggestion-title">
                            {result.title}
                          </div>
                          <div className="suggestion-subtitle">
                            {result.subtitle}
                          </div>
                          {result.plaque?.profession && (
                            <Badge variant="secondary" className="suggestion-badge">
                              {result.plaque.profession}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Location Results Section */}
                {locationResults.length > 0 && (
                  <div className={plaqueResults.length > 0 ? 'border-t border-gray-100 mt-2 pt-2' : ''}>
                    <div className="suggestion-section-header">
                      London Locations
                    </div>
                    {locationResults.map((result, index) => {
                      const adjustedIndex = index + plaqueResults.length;
                      return (
                        <button
                          key={`location-${result.id}`}
                          onClick={() => handleSelectResult(result)}
                          className={`
                            suggestion-item location-result
                            ${selectedIndex === adjustedIndex ? 'selected' : ''}
                          `}
                          onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                        >
                          <div className="suggestion-icon location">
                            <Navigation size={12} />
                          </div>
                          <div className="suggestion-content">
                            <div className="suggestion-title">
                              {result.title}
                            </div>
                            <div className="suggestion-subtitle">
                              {result.subtitle.split(',').slice(0, 2).join(', ')}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : value.length > 0 && !mapboxHook.isLoading ? (
            <div className="search-empty-state">
              <div className="search-empty-title">No results found</div>
              <div className="search-empty-description">
                Try searching for plaque names, people, or London locations
              </div>
            </div>
          ) : null}
          
          {/* Helper Text */}
          {!value && (
            <div className="search-helper-text">
              💡 Search for blue plaques or enter London addresses for distance filtering
            </div>
          )}
        </div>
      )}
    </div>
  );
};