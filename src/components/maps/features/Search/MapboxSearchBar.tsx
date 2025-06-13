// src/components/maps/features/Search/MapboxSearchBar.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader, MapPin, Landmark, Home, Mail } from 'lucide-react'; // Added more icons for different types
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearch } from './useSearch'; // Import the new combined useSearch hook
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import { toast } from 'sonner';
import { Plaque } from '@/types/plaque'; // Import Plaque type

interface MapboxSearchBarProps {
  onPlaceSelect: (coords: [number, number], placeName: string, type: 'plaque' | 'location' | 'postcode' | 'area') => void;
  className?: string;
  placeholder?: string;
  mobileOptimized?: boolean; // To apply mobile-specific styles/behavior
  allPlaques: Plaque[]; // Pass all plaques for plaque search
}

export const MapboxSearchBar: React.FC<MapboxSearchBarProps> = ({
  onPlaceSelect,
  className,
  placeholder = "Search for a location or plaque...", // Updated placeholder
  mobileOptimized = false,
  allPlaques, // Receive all plaques here
}) => {
  // Use the new combined search hook
  const { results: suggestions, handleSearchTermChange, isSearching: isLoading } = useSearch(allPlaques);

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const activeSuggestionIndexRef = useRef(-1);

  // Handle input change: update query and trigger search
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    // Trigger search on every input change, useSearch hook handles internal debouncing
    handleSearchTermChange(newQuery); 
    setShowSuggestions(true);
    activeSuggestionIndexRef.current = -1; // Reset active selection on new input
  }, [handleSearchTermChange]);

  // Handle selecting a suggestion from the list
  const handleSelectSuggestion = useCallback((selectedResult: typeof suggestions[0]) => {
    // Ensure coordinates are always [lat, lng] for onPlaceSelect
    const coords: [number, number] = selectedResult.coordinates; 
    onPlaceSelect(coords, selectedResult.title, selectedResult.type);
    setQuery(selectedResult.title); // Keep the selected title in the input
    setShowSuggestions(false); // Hide suggestions after selection
    activeSuggestionIndexRef.current = -1; // Reset active index
    if (mobileOptimized) triggerHapticFeedback('success');
    toast.success(`Selected: ${selectedResult.title}`);
  }, [onPlaceSelect, mobileOptimized]);

  // Handle search button click or Enter press when no specific suggestion is highlighted
  const handleSearchButtonClick = useCallback(() => {
    if (query.trim()) {
      if (suggestions.length > 0) {
        // If there are suggestions, pick the active one or the first one
        const selectedResult = activeSuggestionIndexRef.current !== -1
          ? suggestions[activeSuggestionIndexRef.current]
          : suggestions[0];
        handleSelectSuggestion(selectedResult);
      } else if (!isLoading) {
        // If no suggestions, but query exists and not loading, toast an error
        toast.error("No matching plaques or locations found for your search.");
        if (mobileOptimized) triggerHapticFeedback('error');
      }
    } else {
      // If query is empty and button is clicked, provide feedback
      toast.info("Please enter a search term.");
      if (mobileOptimized) triggerHapticFeedback('warning');
    }
  }, [query, suggestions, isLoading, handleSelectSuggestion, mobileOptimized]);

  // Handle clearing the search input
  const handleClearSearch = useCallback(() => {
    setQuery('');
    handleSearchTermChange(''); // Clear search results
    setShowSuggestions(false);
    activeSuggestionIndexRef.current = -1;
    if (mobileOptimized) triggerHapticFeedback('light');
  }, [mobileOptimized]);

  // Handle keyboard navigation for suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestionIndexRef.current = Math.min(activeSuggestionIndexRef.current + 1, suggestions.length - 1);
      // Ensure the newly active item is visible in the scroll area
      const activeItem = document.getElementById(`suggestion-${activeSuggestionIndexRef.current}`);
      activeItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestionIndexRef.current = Math.max(activeSuggestionIndexRef.current - 1, 0);
      // Ensure the newly active item is visible in the scroll area
      const activeItem = document.getElementById(`suggestion-${activeSuggestionIndexRef.current}`);
      activeItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndexRef.current !== -1) {
        handleSelectSuggestion(suggestions[activeSuggestionIndexRef.current]);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]); // Select first if nothing highlighted
      } else {
        handleSearchButtonClick(); // If no suggestions, trigger default search button logic
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      activeSuggestionIndexRef.current = -1;
      e.stopPropagation(); // Prevent other escape handlers (e.g., closing modals)
    }
  }, [suggestions, handleSelectSuggestion, handleSearchButtonClick]);

  // Effect to handle clicks outside the search bar to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        activeSuggestionIndexRef.current = -1;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to get appropriate icon based on search result type
  const getIconForType = (type: 'plaque' | 'location' | 'postcode' | 'area') => {
    switch (type) {
      case 'plaque':
        return <Landmark size={mobileOptimized ? 14 : 16} className="text-blue-500" />;
      case 'postcode':
        return <Mail size={mobileOptimized ? 14 : 16} className="text-purple-500" />;
      case 'area':
        return <Home size={mobileOptimized ? 14 : 16} className="text-green-500" />;
      case 'location':
      default:
        return <MapPin size={mobileOptimized ? 14 : 16} className="text-red-500" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchContainerRef}>
      {/* Container for the search input and buttons, using flex for better alignment */}
      <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim() && suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 border-none focus-visible:ring-0 shadow-none px-2 py-1.5 text-base md:text-sm" // Adjusted padding/font size
          aria-label="Search input for locations and plaques"
          aria-controls="suggestions-list"
          aria-expanded={showSuggestions && suggestions.length > 0}
          role="combobox"
          aria-haspopup="listbox"
          autoComplete="off" // Prevent browser auto-fill
        />
        {isLoading ? (
          <Button disabled size="sm" className={`h-9 w-9 p-0 flex items-center justify-center ${mobileOptimized ? "h-10 w-10" : ""}`}>
            <Loader className="animate-spin text-gray-500" size={mobileOptimized ? 16 : 18} />
          </Button>
        ) : (
          <>
            {query && (
              // Clear button positioned within the flex container, no absolute positioning needed
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className={`h-9 w-9 p-0 flex items-center justify-center text-gray-500 hover:bg-gray-100 ${mobileOptimized ? "h-10 w-10" : ""}`}
                aria-label="Clear search"
              >
                <X size={mobileOptimized ? 14 : 16} />
              </Button>
            )}
            <Button
              onClick={handleSearchButtonClick}
              disabled={!query.trim()}
              size="sm"
              className={`h-9 px-3 flex items-center justify-center ${mobileOptimized ? "h-10 w-12" : ""}`}
              aria-label="Search"
            >
              <Search size={mobileOptimized ? 16 : 18} />
              {!mobileOptimized && <span className="ml-1">Go</span>}
            </Button>
          </>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ScrollArea
          className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 md:max-h-80 overflow-y-auto mt-1" // Increased max-height for more results
          id="suggestions-list"
          role="listbox"
        >
          {suggestions.map((result, index) => (
            <div
              key={result.id} // Use unique ID from SearchResult
              id={`suggestion-${index}`} // For scrollIntoView
              className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 ${
                index === activeSuggestionIndexRef.current ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleSelectSuggestion(result)}
              onMouseEnter={() => (activeSuggestionIndexRef.current = index)}
              role="option"
              aria-selected={index === activeSuggestionIndexRef.current}
            >
              <div className="mr-2">
                {getIconForType(result.type)} {/* Display icon based on type */}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{result.title}</p>
                {result.subtitle && result.subtitle !== result.title && (
                  <p className="text-xs text-gray-500">{result.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
      {showSuggestions && !isLoading && !suggestions.length && query.trim() && (
        <div className="p-2 text-sm text-gray-500 mt-1">No results found.</div> // More generic message
      )}
      {showSuggestions && isLoading && query.trim() && (
        <div className="p-2 text-sm text-gray-500 mt-1 flex items-center">
          <Loader className="animate-spin mr-2" size={14} /> Searching...
        </div>
      )}
    </div>
  );
};
