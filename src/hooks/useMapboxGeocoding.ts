// src/hooks/useMapboxGeocoding.ts - BULLETPROOF VERSION (No infinite loops guaranteed)
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    mapbox_id?: string;
    wikidata?: string;
    short_code?: string;
    foursquare?: string;
    landmark?: boolean;
    address?: string;
    category?: string;
  };
  text: string;
  place_name: string;
  bbox?: [number, number, number, number];
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  address?: string;
  context?: Array<{
    id: string;
    text: string;
    wikidata?: string;
    short_code?: string;
  }>;
}

interface MapboxResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

interface UseMapboxGeocodingOptions {
  debounceTime?: number;
  country?: string[];
  proximity?: [number, number] | null;
  bbox?: [number, number, number, number] | null;
}

export const useMapboxGeocoding = (options: UseMapboxGeocodingOptions = {}) => {
  // Extract options with defaults - NO destructuring in component body
  const debounceTime = options.debounceTime ?? 500;
  const country = options.country ?? ['gb'];
  const proximity = options.proximity ?? null;
  const bbox = options.bbox ?? null;
  
  // State
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent loops
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastProcessedQueryRef = useRef<string>('');
  const mountedRef = useRef(true);

  // Get token once and store in ref
  const tokenRef = useRef(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);

  // **CRITICAL FIX**: Stable fetch function that NEVER changes
  const fetchSuggestions = useRef(async (searchQuery: string) => {
    // Early exit if component unmounted
    if (!mountedRef.current) return;
    
    // Clear previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery.trim()) {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!tokenRef.current) {
      console.warn("Mapbox Access Token not found");
      setError("Search service not configured");
      setIsLoading(false);
      return;
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        access_token: tokenRef.current,
        autocomplete: 'true',
        language: 'en',
        limit: '5',
      });

      if (country.length > 0) {
        params.append('country', country.join(','));
      }
      if (proximity) {
        params.append('proximity', `${proximity[0]},${proximity[1]}`);
      }
      if (bbox) {
        params.append('bbox', bbox.join(','));
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?${params.toString()}`,
        { signal: abortController.signal }
      );

      // Check if component is still mounted and request not aborted
      if (!mountedRef.current || abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: MapboxResponse = await response.json();

      // Final check before setting state
      if (!mountedRef.current || abortController.signal.aborted) {
        return;
      }

      if (data.features && data.features.length > 0) {
        setSuggestions(data.features);
        setError(null);
      } else {
        setSuggestions([]);
        setError("No results found");
      }
    } catch (err: any) {
      // Only update state if component is mounted and request wasn't aborted
      if (!mountedRef.current || err.name === 'AbortError') {
        return;
      }
      
      console.error("Mapbox search error:", err);
      setSuggestions([]);
      setError("Search failed");
      
      // Only show toast for actual errors
      if (err.name !== 'AbortError') {
        toast.error("Search failed. Please try again.");
      }
    } finally {
      // Only update loading state if component is still mounted
      if (mountedRef.current && !abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }).current;

  // **CRITICAL FIX**: Effect with NO dependencies that could change
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Don't process if query hasn't actually changed
    if (query === lastProcessedQueryRef.current) {
      return;
    }

    // Update the last processed query immediately
    lastProcessedQueryRef.current = query;

    // Handle empty query
    if (!query.trim()) {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Set up debounced search
    debounceTimerRef.current = setTimeout(() => {
      if (mountedRef.current && query.trim()) {
        fetchSuggestions(query);
      }
    }, debounceTime);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [query]); // ONLY query as dependency - debounceTime is stable, fetchSuggestions is ref

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Stable handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    lastProcessedQueryRef.current = '';
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const triggerSearch = useCallback(() => {
    if (query.trim() && mountedRef.current) {
      fetchSuggestions(query);
    }
  }, [query]);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    handleInputChange,
    clearSearch,
    triggerSearch,
  };
};