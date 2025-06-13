// Simplified SearchBar Component focused on plaque search, using the useSearch hook
import React, { useState, useRef, useCallback } from 'react';
import { Search, MapPin, X, ChevronRight, Loader } from 'lucide-react'; // Import Loader for isSearching state
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plaque } from '@/types/plaque';
import { highlightSearchTerms } from './enhancedSearchLogic'; // Keep highlight utility
import { useSearch } from './useSearch'; // Import the useSearch hook

// Simplified interface for plaque search results (matches enhancedSearchLogic)
interface PlaqueSearchResult {
  type: 'plaque';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  plaque: Plaque; // Keep plaque object for onSelect
  matchedFields: string[];
}

// Props now only need onSelect and plaques (to pass to useSearch)
interface SearchBarProps {
  plaques: Plaque[]; // Pass plaques to the hook
  onSelect: (result: PlaqueSearchResult) => void;
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  plaques,
  onSelect,
  className = '',
  placeholder = "Search plaques..."
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the search hook to manage search state and logic
  const { searchTerm, results, isSearching, handleSearchTermChange, clearSearch } = useSearch(plaques);

  // Determine if suggestions should be shown
  // Show if there's a search term and results, OR if input is focused and there's a term
  const showSuggestions = (searchTerm.length > 0 && results.length > 0) || (searchTerm.length > 0 && searchInputRef.current === document.activeElement);

  // Handle result selection
  const handleSelectResult = useCallback((result: PlaqueSearchResult) => {
    onSelect({
      type: 'plaque',
      coordinates: result.coordinates,
      plaque: result.plaque,
      title: result.title,
      id: result.id,
      subtitle: result.subtitle,
      matchedFields: result.matchedFields,
    });

    // Clear search state after selection
    clearSearch();
    setSelectedIndex(-1);
    // Keep dropdown open briefly on mobile if needed, or close
    // For now, relying on the blur handler to close

  }, [onSelect, clearSearch]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    // Suggestions visibility now primarily driven by searchTerm and results state in useSearch
    // We don't need to manage a local showSuggestionsState here directly for visibility
    // The blur handler below will hide suggestions if focus leaves the container
  }, []);

  // Handle blur - hide suggestions if focus moves outside the container
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        // We don't clear the search term or results here, just hide the dropdown
        // The state in useSearch persists until the user clears the input
        // No local state to update here anymore
      }
    }, 150);
  }, []);

  // Keyboard navigation using the hook's results
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = results.length;

    if (!showSuggestions || totalItems === 0) return;

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
        if (selectedIndex >= 0 && selectedIndex < totalItems) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        // Close suggestions dropdown
        setSelectedIndex(-1);
        searchInputRef.current?.blur(); // Trigger blur to hide dropdown
        break;
    }
  }, [showSuggestions, results, selectedIndex, handleSelectResult]);


  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Search Input Container */}
      <div className={`
        relative bg-white/95 backdrop-blur-sm border border-gray-200
        ${showSuggestions ? 'ring-2 ring-blue-500/20 border-blue-300' : 'hover:border-gray-300'}
        h-11 px-4 flex items-center gap-3 rounded-xl shadow-sm transition-all duration-200
      `}>
        {/* Search Icon */}
        <Search
          size={18}
          className={`${showSuggestions ? 'text-blue-600' : 'text-gray-400'} flex-shrink-0 transition-colors`}
        />

        {/* Input Field */}
        <Input
          ref={searchInputRef}
          type="text"
          // Bind input value and onChange to the hook
          value={searchTerm}
          onChange={(e) => handleSearchTermChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none p-0
            text-sm placeholder:text-gray-500
          `}
        />

        {/* Loading Indicator */}
        {isSearching && (
           <Loader size={16} className="text-blue-500 animate-spin flex-shrink-0" />
        )}

        {/* Clear Button */}
        {searchTerm && !isSearching && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
                clearSearch();
                searchInputRef.current?.focus(); // Keep focus on input after clearing
            }}
            className="h-7 w-7 p-0 hover:bg-gray-100 rounded-full flex-shrink-0"
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[1010] max-h-[400px]">
          <ScrollArea className="max-h-[350px]">
            <div className="py-2">

              {/* Search Results Section */}
              {results.length > 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    Historic Plaques
                  </div>
                  {results.map((result, index) => (
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
                        bg-purple-100 text-purple-600
                      `}>
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-gray-900 text-sm leading-tight"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerms(result.title, searchTerm)
                          }}
                        />
                        <div className="text-gray-500 text-xs mt-1 leading-tight">
                          {result.subtitle}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              ) : (
                /* No Results State or Min Length Message */
                 searchTerm.length > 0 && !isSearching ? (
                    <div className="px-4 py-8 text-center">
                      <div className="text-gray-900 font-medium mb-2">No results found</div>
                      <div className="text-gray-500 text-sm">
                        Try different keywords or check spelling
                      </div>
                    </div>
                 ) : searchTerm.length < 2 && searchTerm.length > 0 && !isSearching ? (
                     <div className="px-4 py-8 text-center">
                       <div className="text-gray-900 font-medium mb-2">Keep typing...</div>
                       <div className="text-gray-500 text-sm">
                         Enter at least 2 characters to search.
                       </div>
                     </div>
                 ) : null // No message if input is empty or is searching
              )}

              {/* Helper Text - Show only when input is empty and not searching */}
              {!searchTerm && !isSearching && (
                <div className="px-4 py-3 text-xs text-gray-500 bg-blue-50 border-t border-gray-100">
                  💡 Search for people or professions. Try "Hendrix" or "author"
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default SearchBar;