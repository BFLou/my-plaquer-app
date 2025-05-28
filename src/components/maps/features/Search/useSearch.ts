// src/components/maps/features/Search/useSearch.ts
import { useState, useCallback, useEffect } from 'react';
import { Plaque } from '@/types/plaque';

interface SearchResult {
  type: 'plaque' | 'location';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
}

export const useSearch = (plaques: Plaque[]) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    
    // Search plaques
    const plaqueResults = plaques
      .filter(p => {
        const searchStr = query.toLowerCase();
        return (
          p.title?.toLowerCase().includes(searchStr) ||
          p.description?.toLowerCase().includes(searchStr) ||
          p.location?.toLowerCase().includes(searchStr)
        );
      })
      .slice(0, 5)
      .map(p => ({
        type: 'plaque' as const,
        id: p.id,
        title: p.title || 'Unnamed Plaque',
        subtitle: p.location || p.address || '',
        coordinates: [
          parseFloat(p.latitude as string), 
          parseFloat(p.longitude as string)
        ] as [number, number]
      }));
    
    searchResults.push(...plaqueResults);
    
    // Search locations via Nominatim
    if (query.length > 2) {
      try {
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?` +
  `format=json&q=${encodeURIComponent(query)}&limit=3&addressdetails=1&countrycodes=gb`
);

        const places = await response.json();
        
const locationResults = places.map((place: any) => ({
  type: 'location' as const,
  id: place.place_id,
  title: place.display_name.split(',')[0],
  subtitle: place.display_name,
  coordinates: [parseFloat(place.lat), parseFloat(place.lon)] as [number, number],
}));

        
        searchResults.push(...locationResults);
      } catch (error) {
        console.error('Location search error:', error);
      }
    }
    
    setResults(searchResults);
    setIsSearching(false);
  }, [plaques]);
  
  return { results, search, isSearching };
};