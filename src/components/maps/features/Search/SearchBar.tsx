// src/components/maps/features/Search/SearchBar.tsx - COMPLETE FIXED VERSION

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, MapPin, X, ChevronRight, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plaque } from '@/types/plaque';
import { highlightSearchTerms } from './enhancedSearchLogic';
import { useSearch } from './useSearch';

// Interface for plaque search results
interface PlaqueSearchResult {
  type: 'plaque';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  plaque: Plaque;
  matchedFields: string[];
}

// Props interface
interface SearchBarProps {
  plaques: Plaque[];
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
  console.log('🔍 SearchBar rendering with', plaques.length, 'plaques');
  
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(true); // Debug visibility
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the search hook to manage search state and logic
  const { searchTerm, results, isSearching, handleSearchTermChange, clearSearch } = useSearch(plaques);

  // Debug effect to track rendering
  useEffect(() => {
    console.log('🔍 SearchBar mounted, container ref:', containerRef.current);
    console.log('🔍 Search results:', results.length);
    
    // Force visibility check
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      console.log('🔍 SearchBar position:', rect);
      
      // Apply emergency styling if not visible
      if (rect.width === 0 || rect.height === 0) {
        console.warn('🔍 SearchBar has zero dimensions - applying emergency fix');
        containerRef.current.classList.add('search-bar-emergency-fix');
      }
    }
  }, [results.length]);

  // Determine if suggestions should be shown
  const showSuggestions = (searchTerm.length > 0 && results.length > 0) || 
                         (searchTerm.length > 0 && searchInputRef.current === document.activeElement);

  // Handle result selection
  const handleSelectResult = useCallback((result: PlaqueSearchResult) => {
    console.log('🔍 Selecting search result:', result.title);
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
  }, [onSelect, clearSearch]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    console.log('🔍 SearchBar focused');
    setIsVisible(true);
  }, []);

  // Handle blur - hide suggestions if focus moves outside the container
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        console.log('🔍 SearchBar blurred');
      }
    }, 150);
  }, []);

  // Keyboard navigation
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
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  }, [showSuggestions, results, selectedIndex, handleSelectResult]);

  // Debug toggle function
  const toggleDebugMode = () => {
    if (containerRef.current) {
      containerRef.current.classList.toggle('debug');
      console.log('🔍 Debug mode toggled');
    }
  };

  return (
    <>
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px',
          fontSize: '10px',
          zIndex: 999999,
          borderRadius: '4px'
        }}>
          SearchBar: {isVisible ? 'Visible' : 'Hidden'} | 
          Results: {results.length} | 
          Term: "{searchTerm}"
          <button onClick={toggleDebugMode} style={{marginLeft: '5px', fontSize: '10px'}}>
            Debug
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className={`search-bar-container ${className}`}
        style={{
          position: 'absolute',
          zIndex: 99999,
          isolation: 'isolate',
          pointerEvents: 'auto',
          transform: 'translateZ(0)',
        }}
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
            style={{
              fontSize: '16px', // Prevent iOS zoom
              minHeight: '40px'
            }}
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
                  searchInputRef.current?.focus();
              }}
              className="h-7 w-7 p-0 hover:bg-gray-100 rounded-full flex-shrink-0"
            >
              <X size={14} />
            </Button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="search-suggestions absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[99999] max-h-[400px]">
            <ScrollArea className="max-h-[350px]">
              <div className="py-2">

                {/* Search Results Section */}
                {results.length > 0 ? (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Historic Plaques ({results.length})
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
                  /* No Results State */
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
                   ) : null
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
    </>
  );
};

export default SearchBar;