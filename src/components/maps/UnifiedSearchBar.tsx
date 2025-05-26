// src/components/map/UnifiedSearchBar.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader, Clock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Plaque } from '@/types/plaque';

interface SearchResult {
  type: 'location' | 'plaque' | 'area';
  title: string;
  subtitle?: string;
  coordinates?: [number, number];
  data?: any;
  icon?: React.ReactNode;
}

interface UnifiedSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onResultSelect: (result: SearchResult) => void;
  plaques: Plaque[];
  activeLocation: [number, number] | null;
  isLoading?: boolean;
  className?: string;
}

const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  query,
  onQueryChange,
  onResultSelect,
  plaques,
  activeLocation,
  isLoading = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('plaquer-recent-searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, 5)); // Keep only last 5
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((result: SearchResult) => {
    try {
      const newRecent = [
        result,
        ...recentSearches.filter(r => r.title !== result.title)
      ].slice(0, 5);
      
      setRecentSearches(newRecent);
      localStorage.setItem('plaquer-recent-searches', JSON.stringify(newRecent));
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  }, [recentSearches]);

  // Detect search type and perform search
  const performSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    const searchTerm = searchQuery.toLowerCase().trim();

    // Determine search type based on query patterns
    const isPostcode = /^[a-z]{1,2}\d{1,2}[a-z]?\s?\d[a-z]{2}$/i.test(searchTerm);
    const isCoordinates = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(searchTerm);
    const hasNumbers = /\d/.test(searchTerm);
    const isShort = searchTerm.length <= 15;
    
    // Prioritize location search for certain patterns
    const likelyLocation = isPostcode || isCoordinates || 
      (hasNumbers && isShort) ||
      /\b(street|road|avenue|lane|square|park|way|place|court|close|drive|gardens?|borough|area|london)\b/i.test(searchTerm);

    // Search plaques first (always show some plaque results)
    const plaqueResults = plaques
      .filter(plaque => 
        plaque.title?.toLowerCase().includes(searchTerm) ||
        plaque.inscription?.toLowerCase().includes(searchTerm) ||
        plaque.location?.toLowerCase().includes(searchTerm) ||
        plaque.profession?.toLowerCase().includes(searchTerm) ||
        plaque.address?.toLowerCase().includes(searchTerm)
      )
      .slice(0, likelyLocation ? 3 : 6) // Show fewer if likely searching for location
      .map(plaque => ({
        type: 'plaque' as const,
        title: plaque.title || 'Unnamed Plaque',
        subtitle: `${plaque.profession || 'Unknown'} • ${plaque.location || plaque.address || 'Unknown location'}`,
        coordinates: plaque.latitude && plaque.longitude ? 
          [parseFloat(plaque.latitude as string), parseFloat(plaque.longitude as string)] as [number, number] : 
          undefined,
        data: plaque,
        icon: <div className="w-3 h-3 bg-blue-500 rounded-full" />
      }));

    results.push(...plaqueResults);

    // Search locations if it seems like a location query
    if (likelyLocation || searchTerm.length >= 3) {
      try {
        const locationResults = await searchLocations(searchTerm);
        results.unshift(...locationResults); // Add location results at the top
      } catch (error) {
        console.warn('Location search failed:', error);
      }
    }

    // Add category results for profession searches
    if (searchTerm.length >= 3 && !hasNumbers) {
      const categoryResults = searchCategories(searchTerm);
      results.push(...categoryResults);
    }

    return results.slice(0, 8); // Limit total results
  }, [plaques]);

  // Search for locations using Nominatim
  const searchLocations = async (query: string): Promise<SearchResult[]> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', London, UK')}&limit=4&addressdetails=1&bounded=1&viewbox=-0.489,51.28,0.236,51.686`
    );
    
    if (!response.ok) throw new Error('Location search failed');
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      type: 'location' as const,
      title: item.display_name.split(',').slice(0, 2).join(', '),
      subtitle: `Location • ${item.type}`,
      coordinates: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
      data: item,
      icon: <MapPin className="w-4 h-4 text-green-500" />
    }));
  };

  // Search categories/professions
  const searchCategories = (query: string): SearchResult[] => {
    const professions = [...new Set(plaques.map(p => p.profession).filter(Boolean))];
    const matchingProfessions = professions
      .filter(profession => profession!.toLowerCase().includes(query))
      .slice(0, 2);

    return matchingProfessions.map(profession => ({
      type: 'area' as const,
      title: profession!,
      subtitle: `${plaques.filter(p => p.profession === profession).length} plaques`,
      data: { profession },
      icon: <div className="w-4 h-4 bg-purple-500 rounded" />
    }));
  };

  // Handle input changes with debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onQueryChange(value);

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim()) {
      setIsSearching(true);
      setIsOpen(true);
      
      // Debounce search
      debounceRef.current = setTimeout(async () => {
        try {
          const searchResults = await performSearch(value);
          setResults(searchResults);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsSearching(false);
      setIsOpen(true); // Show recent searches
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    onResultSelect(result);
    saveRecentSearch(result);
    setIsOpen(false);
    onQueryChange(result.title);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const showRecentSearches = isOpen && !query.trim() && recentSearches.length > 0;
  const showResults = isOpen && (results.length > 0 || isSearching);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          {isLoading ? (
            <Loader className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search plaques or locations in London..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="pl-12 pr-12 h-12 text-base bg-white border-2 border-gray-200 rounded-full shadow-lg focus:border-blue-500 focus:shadow-xl transition-all"
        />
        
        {query && (
          <button
            onClick={() => {
              onQueryChange('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {(showResults || showRecentSearches) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto z-50">
          
          {/* Recent Searches */}
          {showRecentSearches && (
            <>
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Clock className="w-4 h-4" />
                  Recent Searches
                </div>
              </div>
              {recentSearches.map((result, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleResultSelect(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  {result.icon}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-sm text-gray-500 truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Search Results */}
          {showResults && (
            <>
              {isSearching && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Loader className="w-5 h-5 mx-auto mb-2 animate-spin" />
                  <div className="text-sm">Searching...</div>
                </div>
              )}
              
              {!isSearching && results.length > 0 && (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={`result-${index}-${result.type}-${result.title}`}
                      onClick={() => handleResultSelect(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      {result.icon}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {result.type === 'location' && (
                        <div className="text-xs text-green-600 font-medium">
                          Location
                        </div>
                      )}
                      {result.type === 'plaque' && (
                        <div className="text-xs text-blue-600 font-medium">
                          Plaque
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {!isSearching && results.length === 0 && query.trim() && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <div className="text-sm">No results found for "{query}"</div>
                  <div className="text-xs mt-1">Try a different search term</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Active Location Indicator */}
      {activeLocation && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            <MapPin className="w-3 h-3" />
            Location active
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSearchBar;