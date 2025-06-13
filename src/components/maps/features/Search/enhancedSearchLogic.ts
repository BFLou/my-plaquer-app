// src/components/maps/features/Search/enhancedSearchLogic.ts
// Enhanced Search Logic using Fuse.js for improved performance
import { Plaque } from '@/types/plaque';
import Fuse from 'fuse.js';
import type { IFuseOptions, FuseResultMatch } from 'fuse.js';

// Define SearchResult type for searchPlaques results (Removed relevanceScore)
export type SearchResult = {
  type: 'plaque';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  plaque: Plaque;
  matchedFields: string[]; // Fuse.js can provide matched fields
};

let fuse: Fuse<Plaque> | null = null;

/**
 * Initialize the Fuse.js search index.
 * Call this once when your plaque data is loaded (e.g., in a parent component or context).
 */
export function initializePlaqueSearchIndex(plaques: Plaque[]): void {
  const options: IFuseOptions<Plaque> = { // Use the imported type
    keys: [
      { name: 'title', weight: 1.0 },
      { name: 'profession', weight: 0.7 },
      { name: 'description', weight: 0.6 },
      { name: 'location', weight: 0.5 },
      { name: 'address', weight: 0.4 },
      { name: 'postcode', weight: 0.6 },
      { name: 'inscription', weight: 0.3 },
      { name: 'organisations', weight: 0.4 }, // Assuming organisations is an array of strings
    ],
    includeScore: true, // Still include score for internal sorting
    includeMatches: true,
    threshold: 0.3, // Adjust this threshold based on how fuzzy you want the matches
    ignoreLocation: true, // Ignore the location of the match in the string
    // distance: 100, // Consider matches up to a certain distance
  };

  fuse = new Fuse(plaques, options);
  console.log('Fuse.js plaque search index initialized.');
}

/**
 * Search plaques using the initialized Fuse.js index.
 */
export function searchPlaques(plaques: Plaque[], searchTerm: string): SearchResult[] {
  // Minimum query length handled in useSearch.ts now

  if (!fuse) {
      console.error("Fuse.js index not initialized. Call initializePlaqueSearchIndex first.");
      // Fallback to a simple filter if index is not initialized
      return plaques.filter(plaque =>
          plaque.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plaque.profession?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10).map(plaque => ({
        type: 'plaque',
        id: plaque.id,
        title: plaque.title || 'Unnamed Plaque',
        subtitle: plaque.profession || plaque.location || plaque.address || 'Historic Plaque',
        coordinates: [
            typeof plaque.latitude === 'string' ? parseFloat(plaque.latitude) : plaque.latitude || 0,
            typeof plaque.longitude === 'string' ? parseFloat(plaque.longitude) : plaque.longitude || 0
        ] as [number, number],
        plaque: plaque,
        matchedFields: [], // No matched fields in fallback
      }));
  }

  const query = searchTerm.trim();
  // console.log(`🔍 Searching for: "${query}" using Fuse.js`); // Avoid excessive logs

  const fuseResults = fuse.search(query);

  // console.log(`🎯 Found ${fuseResults.length} matching plaques`); // Avoid excessive logs

  // Convert Fuse.js results to your SearchResult format and sort/slice
  return fuseResults
    .sort((a, b) => (a.score || 0) - (b.score || 0)) // Sort by Fuse.js score (lower is better)
    .slice(0, 10) // Limit to top 10 results
    .map(fuseResult => {
        const plaque = fuseResult.item;
        const lat = typeof plaque.latitude === 'string'
          ? parseFloat(plaque.latitude)
          : plaque.latitude || 0;
        const lng = typeof plaque.longitude === 'string'
          ? parseFloat(plaque.longitude)
          : plaque.longitude || 0;

        // Skip plaques with invalid coordinates
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
            // You might want to log a warning here if this happens
            return null; // Filter out nulls later
        }

        return {
          type: 'plaque',
          id: plaque.id,
          title: plaque.title || 'Unnamed Plaque',
          subtitle: formatPlaqueSubtitle(plaque, fuseResult.matches || []),
          coordinates: [lat, lng] as [number, number],
          plaque: plaque,
          matchedFields: fuseResult.matches ? fuseResult.matches.map(match => match.key as string) : [], // Extract matched fields
        };
  }).filter(result => result !== null) as SearchResult[]; // Filter out null results
}

/**
 * Format subtitle showing what matched and location
 * Adapted to work with Fuse.js matches
 */
function formatPlaqueSubtitle(plaque: Plaque, matches: readonly FuseResultMatch[]): string {
  const parts = [];

  // Show location if available
  if (plaque.location) {
    parts.push(plaque.location);
  } else if (plaque.address) {
    parts.push(plaque.address.split(',')[0]); // First part of address
  }

  // Show profession if it was matched or if no location
  const professionMatched = matches.some(match => match.key === 'profession');
  if (professionMatched && plaque.profession) {
    parts.push(plaque.profession);
  } else if (!plaque.location && !plaque.address && plaque.profession) {
    parts.push(plaque.profession);
  }

  // If still no parts, use postcode
  if (parts.length === 0 && plaque.postcode) {
    parts.push(plaque.postcode);
  }

  return parts.join(' • ') || 'Historic Plaque';
}

/**
 * Search suggestions with highlighted terms
 */
export function highlightSearchTerms(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;

  const query = searchTerm.trim();
  // Corrected regex to properly escape special characters for new RegExp()
  // We escape all characters that have special meaning in regex:
  // . \ + * ? ^ $ { } ( ) | [ ]
  const escapedQuery = query.replace(/[.\+*?^$(){}|[\]]/g, '\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}
