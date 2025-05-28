// src/components/maps/features/Search/useSearch.ts - Enhanced with postcode/area search
import { useState, useCallback } from 'react';
import { Plaque } from '@/types/plaque';

interface SearchResult {
  type: 'plaque' | 'location' | 'postcode' | 'area';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  address?: {
    postcode?: string;
    suburb?: string;
    city_district?: string;
    borough?: string;
  };
  importance?: number;
  boundingbox?: [string, string, string, string];
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
    
    // Search plaques first (existing functionality)
    const plaqueResults = plaques
      .filter(p => {
        const searchStr = query.toLowerCase();
        return (
          p.title?.toLowerCase().includes(searchStr) ||
          p.description?.toLowerCase().includes(searchStr) ||
          p.location?.toLowerCase().includes(searchStr)
        );
      })
      .slice(0, 3) // Limit to 3 plaque results to make room for location results
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
    
    // Enhanced location search - prioritize postcodes and London areas
    if (query.length > 2) {
      try {
        // Check if query looks like a postcode
        const isPostcode = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(query.trim());
        const searchQuery = isPostcode ? query.trim() : `${query}, London`;
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(searchQuery)}&limit=8&addressdetails=1&` +
          `countrycodes=gb&viewbox=-0.489,51.28,0.236,51.686&bounded=1&` +
          `extratags=1&namedetails=1`
        );

        if (!response.ok) throw new Error('Search failed');
        
        const places = await response.json();
        
        const locationResults = places
          .filter((place: any) => {
            // Filter for London results and relevant types
            const isInLondon = place.display_name.toLowerCase().includes('london') ||
                              place.address?.city?.toLowerCase() === 'london' ||
                              place.address?.county?.toLowerCase().includes('london');
            
            const relevantTypes = [
              'postcode', 'suburb', 'neighbourhood', 'city_district', 
              'borough', 'quarter', 'residential', 'commercial', 'retail',
              'industrial', 'place', 'locality'
            ];
            
            return isInLondon && (relevantTypes.includes(place.type) || 
                                 relevantTypes.includes(place.class));
          })
          .map((place: any) => {
            let type: 'postcode' | 'area' | 'location' = 'location';
            let title = place.display_name.split(',')[0];
            
            // Determine type and format title
            if (place.type === 'postcode' || place.class === 'place' && place.type === 'postcode') {
              type = 'postcode';
              title = place.address?.postcode || title;
            } else if (['suburb', 'neighbourhood', 'city_district', 'borough', 'quarter'].includes(place.type)) {
              type = 'area';
              title = place.address?.[place.type] || title;
            }
            
            return {
              type,
              id: place.place_id,
              title,
              subtitle: formatLocationSubtitle(place),
              coordinates: [parseFloat(place.lat), parseFloat(place.lon)] as [number, number],
              address: place.address,
              importance: place.importance || 0,
              boundingbox: place.boundingbox
            };
          })
          .sort((a: SearchResult, b: SearchResult) => {
            // Prioritize postcodes, then areas, then by importance
            if (a.type === 'postcode' && b.type !== 'postcode') return -1;
            if (b.type === 'postcode' && a.type !== 'postcode') return 1;
            if (a.type === 'area' && b.type === 'location') return -1;
            if (b.type === 'area' && a.type === 'location') return 1;
            return (b.importance || 0) - (a.importance || 0);
          });
        
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

// Helper function to format location subtitle
function formatLocationSubtitle(place: any): string {
  const parts = [];
  
  if (place.address?.postcode && place.type !== 'postcode') {
    parts.push(place.address.postcode);
  }
  
  if (place.address?.suburb && place.type !== 'suburb') {
    parts.push(place.address.suburb);
  }
  
  if (place.address?.city_district && !parts.includes(place.address.city_district)) {
    parts.push(place.address.city_district);
  }
  
  if (place.address?.borough && !parts.includes(place.address.borough)) {
    parts.push(place.address.borough);
  }
  
  parts.push('London');
  
  return parts.join(', ');
}