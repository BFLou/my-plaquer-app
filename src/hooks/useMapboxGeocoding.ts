// src/hooks/useMapboxGeocoding.ts
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
  country?: string[]; // e.g., ['gb']
  proximity?: [number, number] | null; // [longitude, latitude]
  bbox?: [number, number, number, number] | null; // [westLng, southLat, eastLng, northLat]
}

export const useMapboxGeocoding = (options?: UseMapboxGeocodingOptions) => {
  const { debounceTime = 500, country = ['gb'], proximity = null, bbox = null } = options || {};
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setError(null);
      return;
    }

    if (!MAPBOX_ACCESS_TOKEN) {
      console.error("Mapbox Access Token is not set. Please add VITE_MAPBOX_ACCESS_TOKEN to your .env file.");
      setError("Search service not configured.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        autocomplete: 'true',
        language: 'en',
        limit: '5', // Limit to top 5 suggestions
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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data: MapboxResponse = await response.json();

      if (data.features.length === 0) {
        setSuggestions([]);
        setError("No matching places found.");
      } else {
        setSuggestions(data.features);
      }
    } catch (err) {
      console.error("Failed to fetch Mapbox suggestions:", err);
      setError("Failed to fetch suggestions. Please try again.");
      setSuggestions([]);
      toast.error("Search failed. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  }, [MAPBOX_ACCESS_TOKEN, country, proximity, bbox]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, debounceTime);
    } else {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceTime, fetchSuggestions]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    handleInputChange,
    clearSearch,
    fetchSuggestions: useCallback(() => fetchSuggestions(query), [fetchSuggestions, query]), // For explicit search button
  };
};