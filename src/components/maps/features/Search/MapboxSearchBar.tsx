// src/components/maps/features/Search/MapboxSearchBar.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMapboxGeocoding } from '@/hooks/useMapboxGeocoding';
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import { toast } from 'sonner';

interface MapboxSearchBarProps {
  onPlaceSelect: (coords: [number, number], placeName: string) => void;
  currentProximity?: [number, number] | null; // [longitude, latitude] for biasing
  currentBbox?: [number, number, number, number] | null; // [westLng, southLat, eastLng, northLat] for biasing
  className?: string;
  placeholder?: string;
  mobileOptimized?: boolean; // To apply mobile-specific styles/behavior
}

export const MapboxSearchBar: React.FC<MapboxSearchBarProps> = ({
  onPlaceSelect,
  currentProximity = null,
  currentBbox = null,
  className,
  placeholder = "Search for a location...",
  mobileOptimized = false,
}) => {
  const { query, setQuery, suggestions, isLoading, error, handleInputChange, clearSearch } = useMapboxGeocoding({
    proximity: currentProximity,
    bbox: currentBbox,
    country: ['gb'],
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const activeSuggestionIndexRef = useRef(-1);

  const handleSelectSuggestion = useCallback((feature: { center: [number, number]; place_name: string }) => {
    const coords: [number, number] = [feature.center[1], feature.center[0]]; // Mapbox is [lng, lat], Leaflet is [lat, lng]
    onPlaceSelect(coords, feature.place_name);
    setQuery(feature.place_name); // Keep the selected place name in the input
    setShowSuggestions(false);
    activeSuggestionIndexRef.current = -1;
    if (mobileOptimized) triggerHapticFeedback('success');
    toast.success(`Location set: ${feature.place_name}`);
  }, [onPlaceSelect, setQuery, mobileOptimized]);

  const handleSearchButtonClick = useCallback(() => {
    if (query.trim() && suggestions.length > 0) {
      const selectedFeature = activeSuggestionIndexRef.current !== -1
        ? suggestions[activeSuggestionIndexRef.current]
        : suggestions[0];
      handleSelectSuggestion(selectedFeature);
    } else if (query.trim() && !isLoading) {
      // If no suggestions, but a query, try a direct geocode (Mapbox hook already does this for empty suggestions)
    } else if (mobileOptimized) {
        triggerHapticFeedback('warning');
    }
  }, [query, suggestions, isLoading, handleSelectSuggestion, mobileOptimized]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestionIndexRef.current = Math.min(activeSuggestionIndexRef.current + 1, suggestions.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestionIndexRef.current = Math.max(activeSuggestionIndexRef.current - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndexRef.current !== -1) {
        handleSelectSuggestion(suggestions[activeSuggestionIndexRef.current]);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else if (query.trim() && !isLoading) {
        if (error) {
          toast.error(error);
        } else {
           handleSearchButtonClick();
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      activeSuggestionIndexRef.current = -1;
      e.stopPropagation();
    }
  }, [suggestions, query, isLoading, error, handleSelectSuggestion, handleSearchButtonClick]);


  return (
    <div className={`relative ${className}`} ref={searchContainerRef}>
      {/* Added container div for styling the search input group */}
      <div className="flex gap-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            handleInputChange(e);
            setShowSuggestions(true);
            activeSuggestionIndexRef.current = -1;
          }}
          onFocus={() => query.trim() && suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 border-none focus-visible:ring-0 shadow-none" // Remove default input border/shadow
          aria-label="Location search input"
          aria-controls="mapbox-suggestions-list"
          aria-expanded={showSuggestions && suggestions.length > 0}
          role="combobox"
          aria-haspopup="listbox"
        />
        {isLoading ? (
          <Button disabled size="sm" className={mobileOptimized ? "h-10 w-10 p-0" : ""}>
            <Loader className="animate-spin" size={mobileOptimized ? 16 : 18} />
          </Button>
        ) : (
          <>
            {query && (
              // Adjusted clear button position
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className={`h-10 w-10 p-0 absolute right-[4.5rem] top-1/2 -translate-y-1/2 ${mobileOptimized ? "right-[3.5rem]" : ""}`}
                aria-label="Clear search"
              >
                <X size={mobileOptimized ? 14 : 16} />
              </Button>
            )}
            <Button
              onClick={handleSearchButtonClick}
              disabled={!query.trim()}
              size="sm"
              className={mobileOptimized ? "h-10 w-12" : ""}
              aria-label="Search"
            >
              <Search size={mobileOptimized ? 16 : 18} />
              {!mobileOptimized && " Go"}
            </Button>
          </>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ScrollArea
          className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
          id="mapbox-suggestions-list"
          role="listbox"
        >
          {suggestions.map((feature, index) => (
            <div
              key={feature.id}
              className={`p-2 cursor-pointer hover:bg-gray-100 ${
                index === activeSuggestionIndexRef.current ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleSelectSuggestion(feature)}
              onMouseEnter={() => (activeSuggestionIndexRef.current = index)}
              role="option"
              aria-selected={index === activeSuggestionIndexRef.current}
            >
              <p className="text-sm font-medium">{feature.text}</p>
              {feature.place_name !== feature.text && (
                <p className="text-xs text-gray-500">{feature.place_name}</p>
              )}
            </div>
          ))}
        </ScrollArea>
      )}
      {showSuggestions && error && !isLoading && !suggestions.length && query.trim() && (
        <div className="p-2 text-sm text-red-600 mt-1">{error}</div>
      )}
    </div>
  );
};