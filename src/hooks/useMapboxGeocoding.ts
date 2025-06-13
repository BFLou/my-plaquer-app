// Fixed Mapbox Geocoding Hook with London Address Focus
import { useState, useEffect, useRef, useCallback } from 'react';

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

// London bounding box - more precise boundaries
const LONDON_BBOX: [number, number, number, number] = [-0.510, 51.280, 0.334, 51.686];

// London proximity center (Central London)
const LONDON_CENTER: [number, number] = [-0.1276, 51.5074];

export const useMapboxGeocoding = (options: UseMapboxGeocodingOptions = {}) => {
  // Extract options with London-specific defaults
  const debounceTime = options.debounceTime ?? 300;
  const country = options.country ?? ['gb'];
  const proximity = options.proximity ?? LONDON_CENTER;
  const bbox = options.bbox ?? LONDON_BBOX;
  
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

  // Enhanced London filtering function
  const isLondonAddress = useCallback((feature: MapboxFeature): boolean => {
    const placeName = feature.place_name.toLowerCase();
    const [lng, lat] = feature.center;
    
    // Check if coordinates are within London bounds
    const inBounds = lat >= LONDON_BBOX[1] && lat <= LONDON_BBOX[3] && 
                     lng >= LONDON_BBOX[0] && lng <= LONDON_BBOX[2];
    
    if (!inBounds) return false;
    
    // Check if place name contains London references
    const londonKeywords = [
      'london', 'greater london', 'city of london',
      // London boroughs
      'westminster', 'camden', 'islington', 'hackney', 'tower hamlets',
      'greenwich', 'lewisham', 'southwark', 'lambeth', 'wandsworth',
      'hammersmith', 'fulham', 'kensington', 'chelsea', 'brent',
      'ealing', 'hounslow', 'richmond', 'kingston', 'merton',
      'sutton', 'croydon', 'bromley', 'bexley', 'havering',
      'barking', 'dagenham', 'redbridge', 'newham', 'waltham forest',
      'haringey', 'enfield', 'barnet', 'harrow', 'hillingdon'
    ];
    
    const hasLondonKeyword = londonKeywords.some(keyword => 
      placeName.includes(keyword)
    );
    
    // Check context for London references
    const hasLondonContext = feature.context?.some(ctx => 
      londonKeywords.some(keyword => 
        ctx.text.toLowerCase().includes(keyword)
      )
    ) || false;
    
    // For addresses, be more permissive if they're in bounds
    if (feature.place_type.includes('address') && inBounds) {
      return true;
    }
    
    return hasLondonKeyword || hasLondonContext;
  }, []);

  // Enhanced fetch function with better address support
  const fetchSuggestions = useRef(async (searchQuery: string) => {
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
      // Enhanced search parameters for better address matching
      const params = new URLSearchParams({
        access_token: tokenRef.current,
        autocomplete: 'true',
        language: 'en',
        limit: '10', // Increased limit to get more options before filtering
        types: 'address,poi,place,postcode,locality,neighborhood', // Include more address types
      });

      // Add London-specific parameters
      if (country.length > 0) {
        params.append('country', country.join(','));
      }
      
      // Use London center for proximity biasing
      if (proximity) {
        params.append('proximity', `${proximity[0]},${proximity[1]}`);
      }
      
      // Use London bounding box
      if (bbox) {
        params.append('bbox', bbox.join(','));
      }

      console.log(`🔍 Mapbox search: "${searchQuery}"`);
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?${params.toString()}`,
        { signal: abortController.signal }
      );

      if (!mountedRef.current || abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data: MapboxResponse = await response.json();
      console.log(`📍 Mapbox returned ${data.features?.length || 0} results`);

      if (!mountedRef.current || abortController.signal.aborted) {
        return;
      }

      if (data.features && data.features.length > 0) {
        // Enhanced filtering with logging
        const londonResults = data.features.filter(feature => {
          const isLondon = isLondonAddress(feature);
          console.log(`${isLondon ? '✅' : '❌'} ${feature.place_name} (${feature.place_type.join(', ')})`);
          return isLondon;
        });

        console.log(`🏙️ Filtered to ${londonResults.length} London results`);
        
        // Sort results: addresses first, then by relevance
        const sortedResults = londonResults.sort((a, b) => {
          // Prioritize addresses
          const aIsAddress = a.place_type.includes('address');
          const bIsAddress = b.place_type.includes('address');
          
          if (aIsAddress && !bIsAddress) return -1;
          if (!aIsAddress && bIsAddress) return 1;
          
          // Then by relevance
          return b.relevance - a.relevance;
        });

        setSuggestions(sortedResults.slice(0, 6)); // Limit final results
        setError(null);
      } else {
        console.log('🚫 No results from Mapbox');
        setSuggestions([]);
        setError(null); // Don't show error for no results
      }
    } catch (err: any) {
      if (!mountedRef.current || err.name === 'AbortError') {
        return;
      }
      
      console.error("Mapbox search error:", err);
      setSuggestions([]);
      setError("Address search temporarily unavailable");
    } finally {
      if (mountedRef.current && !abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }).current;

  // Enhanced effect with better query handling
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

    // Only search if query is long enough
    if (query.trim().length < 2) {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Set up debounced search
    debounceTimerRef.current = setTimeout(() => {
      if (mountedRef.current && query.trim().length >= 2) {
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
  }, [query, debounceTime]);

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
  }, []);

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