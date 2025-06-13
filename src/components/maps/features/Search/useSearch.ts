// src/components/maps/features/Search/useSearch.ts - Simplified for plaque search using enhancedSearchLogic with debouncing and min length
import { useState, useCallback, useEffect } from 'react';
import { Plaque } from '@/types/plaque';
import { searchPlaques, SearchResult as PlaqueSearchResult } from './enhancedSearchLogic';
import { debounce } from 'lodash'; // Corrected import for debounce

// Simplified SearchResult type for useSearch (Matches enhancedSearchLogic)
interface SearchResult extends PlaqueSearchResult {}

// Define minimum query length
const MIN_QUERY_LENGTH = 2; // Or 3, depending on desired behavior

export const useSearch = (plaques: Plaque[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced version of the search logic
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim() || query.trim().length < MIN_QUERY_LENGTH) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      // Call the Fuse.js-based searchPlaques function
      const plaqueResults = searchPlaques(plaques, query);
      setResults(plaqueResults);
      setIsSearching(false);
    }, 300), // Debounce for 300ms - adjust as needed
    [plaques] // Recreate debounced function if plaques data changes
  );

  // Effect to call the debounced search when searchTerm changes
  useEffect(() => {
    // Only trigger debounced search if query meets minimum length
    if (searchTerm.trim().length >= MIN_QUERY_LENGTH) {
      debouncedSearch(searchTerm);
    } else {
      // Clear results and stop searching immediately if query is too short
      setResults([]);
      setIsSearching(false);
      debouncedSearch.cancel(); // Cancel any pending debounced search
    }


    // Cleanup the debounced function on unmount or when dependencies change
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);


  // Function to update the search term (called by the input onChange)
  const handleSearchTermChange = useCallback((query: string) => {
    setSearchTerm(query);
    // Set isSearching true immediately if query meets min length, otherwise false
    setIsSearching(query.trim().length >= MIN_QUERY_LENGTH);
  }, []);


  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setIsSearching(false);
    debouncedSearch.cancel(); // Cancel any pending debounced search
  }, [debouncedSearch]);


  return {
    searchTerm, // Expose searchTerm so SearchBar can bind its input value
    results,
    isSearching,
    handleSearchTermChange, // Expose handler for input onChange
    clearSearch, // Expose clear function
  };
};
