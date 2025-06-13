// src/components/maps/features/Search/useSearch.ts - Enhanced with combined search, relevance, and performance
import { useState, useCallback } from 'react';
import { Plaque } from '@/types/plaque';
// Import utility functions from enhancedSearchLogic.ts
import { calculateSimilarity } from './enhancedSearchLogic'; 

interface SearchResult {
  type: 'plaque' | 'location' | 'postcode' | 'area';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  address?: any; // Contains full address details from Nominatim
  importance?: number; // From Nominatim
  relevanceScore: number; // Unified score for sorting
  matchedFields?: string[]; // For plaque results, indicates which fields matched
}

/**
 * Helper function to calculate a relevance score for a given plaque based on a search query.
 * This combines string matching (exact, startsWith, includes) and fuzzy matching (Levenshtein).
 * @param plaque The plaque object to score.
 * @param query The search query string.
 * @returns A numerical relevance score. Higher is better.
 */
function calculatePlaqueRelevance(plaque: Plaque, query: string): number {
  let score = 0;
  const searchLower = query.toLowerCase();

  // Define fields and their weights for scoring
  const fieldsToSearch = [
    { text: plaque.title, weight: 1.0, fieldName: 'title' },
    { text: plaque.address, weight: 0.8, fieldName: 'address' },
    { text: plaque.postcode, weight: 1.5, fieldName: 'postcode' }, // High weight for exact postcode
    { text: plaque.location, weight: 0.7, fieldName: 'location' },
    { text: plaque.profession, weight: 0.6, fieldName: 'profession' },
    { text: plaque.description, weight: 0.4, fieldName: 'description' },
    { text: plaque.inscription, weight: 0.3, fieldName: 'inscription' },
  ];

  // Add organisation fields, which are now pre-parsed arrays
  if (plaque.organisations && Array.isArray(plaque.organisations)) {
    plaque.organisations.forEach(org => {
      fieldsToSearch.push({ text: org, weight: 0.5, fieldName: 'organisation' });
    });
  }

  fieldsToSearch.forEach(({ text, weight }) => {
    if (!text) return;
    const textLower = text.toLowerCase();

    let fieldScore = 0;
    
    // Exact match
    if (textLower === searchLower) {
      fieldScore = 1.0;
    } 
    // Starts with
    else if (textLower.startsWith(searchLower)) {
      fieldScore = 0.9;
    } 
    // Contains
    else if (textLower.includes(searchLower)) {
      fieldScore = 0.8;
    } 
    // Fuzzy match
    else {
      const similarity = calculateSimilarity(searchLower, textLower);
      if (similarity > 0.6) { // Threshold for considering fuzzy match
        fieldScore = similarity * 0.7; // Scale down fuzzy score
      }
    }
    
    score += fieldScore * weight;
  });

  return score;
}

/**
 * Helper function to format location subtitle for display.
 * @param place The Nominatim place object.
 * @returns A formatted subtitle string.
 */
function formatLocationSubtitle(place: any): string {
  const parts: string[] = [];

  // Prioritize city or town if available and relevant
  if (place.address?.city && place.address.city.toLowerCase() !== 'london') {
    parts.push(place.address.city);
  } else if (place.address?.town && place.address.town.toLowerCase() !== 'london') {
    parts.push(place.address.town);
  }

  // Add postcode if available and not already the main title
  if (place.address?.postcode && place.type !== 'postcode' && !place.display_name.includes(place.address.postcode)) {
    parts.push(place.address.postcode);
  }

  // Add other relevant address parts
  const otherParts = ['suburb', 'city_district', 'borough', 'road', 'house_number'];
  otherParts.forEach(part => {
    if (place.address?.[part] && !parts.includes(place.address[part]) && !place.display_name.includes(place.address[part])) {
      parts.push(place.address[part]);
    }
  });
  
  // Ensure "London" is always mentioned if it's a London result
  if (!parts.some(p => p.toLowerCase().includes('london')) && (place.display_name.toLowerCase().includes('london') || place.address?.county?.toLowerCase().includes('london'))) {
    parts.push('London');
  } else if (parts.length === 0 && place.display_name.toLowerCase().includes('london')) {
      // Fallback if no other specific parts, just use London from display_name
      parts.push('London');
  }

  // Filter out duplicates and empty strings, then join
  return Array.from(new Set(parts.filter(Boolean))).join(', ');
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
    let allCombinedResults: SearchResult[] = [];
    
    // 1. Search plaques
    const plaqueSearchPromises = plaques.map(async p => {
        const plaqueRelevance = calculatePlaqueRelevance(p, query); 
        // Only include plaques with a meaningful relevance score
        if (plaqueRelevance > 0.01) { // Adjusted threshold
            const lat = typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude;
            const lng = typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude;

            if (isNaN(lat!) || isNaN(lng!)) return null; // Filter out invalid coordinates

            return {
                type: 'plaque' as const,
                id: p.id,
                title: p.title || 'Unnamed Plaque',
                subtitle: p.address || p.location || '',
                coordinates: [lat!, lng!] as [number, number],
                relevanceScore: plaqueRelevance,
                matchedFields: [] // Not detailed here, but could be added
            };
        }
        return null;
    });
    
    const resolvedPlaqueResults = (await Promise.all(plaqueSearchPromises)).filter(Boolean) as SearchResult[];
    allCombinedResults.push(...resolvedPlaqueResults);

    // 2. Perform enhanced location search using Nominatim
    // Add a debounce or a minimum query length to prevent excessive API calls
    if (query.length >= 3) { // Only search Nominatim for queries >= 3 characters
      try {
        const isPostcode = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(query.trim());
        // For general searches, bias towards London, for postcodes, search exact.
        const searchQuery = isPostcode ? query.trim() : `${query}, London`; 
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(searchQuery)}&limit=8&addressdetails=1&` +
          `countrycodes=gb&viewbox=-0.489,51.28,0.236,51.686&bounded=1&` +
          `extratags=1&namedetails=1`
        );
        
        if (!response.ok) throw new Error('Location search failed');
        const places = await response.json();
        
        const locationResults: SearchResult[] = places
          .filter((place: any) => {
            const isInLondonArea = place.display_name.toLowerCase().includes('london') || 
                                   place.address?.city?.toLowerCase() === 'london' || 
                                   place.address?.county?.toLowerCase().includes('london') || 
                                   place.address?.state?.toLowerCase() === 'england'; // Broader check

            // Ensure relevant types are considered and not just random points
            const relevantTypes = [
              'house', 'road', 'street', 'postcode', 'suburb', 'city_district', 
              'borough', 'locality', 'place', 'address', 'building'
            ];
            return isInLondonArea && (relevantTypes.includes(place.type) || relevantTypes.includes(place.class));
          })
          .map((place: any) => {
            let type: 'postcode' | 'area' | 'location' = 'location';
            let title = place.name || place.address?.road || place.address?.postcode || place.display_name.split(',')[0];
            let locationScore = place.importance || 0.1; // Base score from Nominatim

            // Boost scores based on type and match quality
            if (place.type === 'postcode' || (place.class === 'place' && place.type === 'postcode')) {
              type = 'postcode';
              title = place.address?.postcode || title;
              if (query.toLowerCase() === title.toLowerCase()) locationScore += 0.8; // Exact postcode match
            } else if (['suburb', 'city_district', 'borough', 'locality'].includes(place.type)) {
              type = 'area';
              title = place.address?.[place.type] || title;
              if (query.toLowerCase() === title.toLowerCase()) locationScore += 0.5; // Exact area match
            } else if (place.address?.house_number && place.address?.road) {
                locationScore += 0.3; // Specific address boost
            }
            // Increase score if query is directly found in the display name (important parts)
            if (place.display_name.toLowerCase().includes(query.toLowerCase())) {
                locationScore += 0.2;
            }

            return {
              type,
              id: `location-${place.place_id}`, // Unique ID for locations
              title: title,
              subtitle: formatLocationSubtitle(place),
              coordinates: [parseFloat(place.lat), parseFloat(place.lon)] as [number, number],
              address: place.address,
              importance: place.importance,
              relevanceScore: locationScore // Use the boosted score
            };
          });
        
        allCombinedResults.push(...locationResults);
      } catch (error) {
        console.error('Location search error:', error);
        // Optionally toast an error, but silently failing for external API is often better UX
      }
    }
    
    // Sort all results by the new combined relevance score (highest first)
    allCombinedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit overall results displayed in suggestions list to top 10 relevant items
    setResults(allCombinedResults.slice(0, 10)); 
    setIsSearching(false);
  }, [plaques]); 
  // Dependency array includes plaques to re-run search callback if plaque data changes.

  return { results, search, isSearching };
};
