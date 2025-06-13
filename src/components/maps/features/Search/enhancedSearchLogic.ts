// src/components/maps/features/Search/enhancedSearchLogic.ts
// Enhanced Search Logic with Fuzzy Matching and Flexible Search
import { Plaque } from '@/types/plaque';

interface SearchResult {
  type: 'plaque' | 'location';
  id: string | number;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  plaque?: Plaque;
  relevanceScore: number;
  matchedFields: string[];
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score (0-1, where 1 is perfect match)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (maxLength - distance) / maxLength;
}

/**
 * Check if search term partially matches any word in the text
 */
function hasPartialWordMatch(searchTerm: string, text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  const search = searchTerm.toLowerCase();
  
  return words.some(word => 
    word.includes(search) || 
    search.includes(word) ||
    calculateSimilarity(word, search) > 0.7
  );
}

/**
 * Extract searchable text from plaque with proper field weighting
 */
function extractSearchableFields(plaque: Plaque): Array<{field: string, text: string, weight: number}> {
  const fields = [];
  
  // High priority fields
  if (plaque.title) {
    fields.push({ field: 'title', text: plaque.title, weight: 1.0 });
  }
  
  // Extract person names from titles (common patterns)
  if (plaque.title) {
    const namePatterns = [
      /([A-Z][a-z]+ [A-Z][a-z]+)/g, // First Last
      /Sir ([A-Z][a-z]+ [A-Z][a-z]+)/g, // Sir First Last
      /Dame ([A-Z][a-z]+ [A-Z][a-z]+)/g, // Dame First Last
      /Dr\.? ([A-Z][a-z]+ [A-Z][a-z]+)/g, // Dr First Last
    ];
    
    namePatterns.forEach(pattern => {
      const matches = plaque.title.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanName = match.replace(/^(Sir|Dame|Dr\.?)\s+/, '');
          fields.push({ field: 'name', text: cleanName, weight: 0.95 });
          
          // Also add individual name parts
          const nameParts = cleanName.split(' ');
          nameParts.forEach(part => {
            if (part.length > 2) {
              fields.push({ field: 'namepart', text: part, weight: 0.8 });
            }
          });
        });
      }
    });
  }
  
  // Medium priority fields
  if (plaque.profession) {
    fields.push({ field: 'profession', text: plaque.profession, weight: 0.7 });
  }
  
  if (plaque.description) {
    fields.push({ field: 'description', text: plaque.description, weight: 0.6 });
  }
  
  // Location fields
  if (plaque.location) {
    fields.push({ field: 'location', text: plaque.location, weight: 0.5 });
  }
  
  if (plaque.address) {
    fields.push({ field: 'address', text: plaque.address, weight: 0.4 });
  }
  
  if (plaque.postcode) {
    fields.push({ field: 'postcode', text: plaque.postcode, weight: 0.6 });
  }
  
  // Lower priority fields
  if (plaque.inscription) {
    fields.push({ field: 'inscription', text: plaque.inscription, weight: 0.3 });
  }
  
  // Organization field if available
  if ((plaque as any).organisations) {
    try {
      const orgs = JSON.parse((plaque as any).organisations);
      if (Array.isArray(orgs)) {
        orgs.forEach(org => {
          if (org && typeof org === 'string') {
            fields.push({ field: 'organisation', text: org, weight: 0.4 });
          }
        });
      }
    } catch (e) {
      // If not JSON, treat as single string
      if (typeof (plaque as any).organisations === 'string') {
        fields.push({ field: 'organisation', text: (plaque as any).organisations, weight: 0.4 });
      }
    }
  }
  
  return fields;
}

/**
 * Enhanced search function with fuzzy matching and relevance scoring
 */
export function searchPlaques(plaques: Plaque[], searchTerm: string): SearchResult[] {
  if (!searchTerm.trim() || searchTerm.length < 2) {
    return [];
  }
  
  const query = searchTerm.trim();
  const results: SearchResult[] = [];
  
  plaques.forEach(plaque => {
    const searchableFields = extractSearchableFields(plaque);
    let bestScore = 0;
    let matchedFields: string[] = [];
    let totalWeightedScore = 0;
    
    searchableFields.forEach(({ field, text, weight }) => {
      if (!text) return;
      
      let fieldScore = 0;
      
      // Exact match (highest score)
      if (text.toLowerCase() === query.toLowerCase()) {
        fieldScore = 1.0;
      }
      // Starts with query (very high score)
      else if (text.toLowerCase().startsWith(query.toLowerCase())) {
        fieldScore = 0.9;
      }
      // Contains exact query (high score)
      else if (text.toLowerCase().includes(query.toLowerCase())) {
        fieldScore = 0.8;
      }
      // Partial word matches (good score)
      else if (hasPartialWordMatch(query, text)) {
        fieldScore = 0.6;
      }
      // Fuzzy matching for typos (moderate score)
      else {
        const similarity = calculateSimilarity(query, text);
        if (similarity > 0.6) {
          fieldScore = similarity * 0.5;
        }
        
        // Also check individual words for fuzzy matching
        const words = text.toLowerCase().split(/\s+/);
        const maxWordSimilarity = Math.max(...words.map(word => 
          calculateSimilarity(query.toLowerCase(), word)
        ));
        
        if (maxWordSimilarity > 0.7) {
          fieldScore = Math.max(fieldScore, maxWordSimilarity * 0.4);
        }
      }
      
      if (fieldScore > 0) {
        matchedFields.push(field);
        const weightedScore = fieldScore * weight;
        totalWeightedScore += weightedScore;
        bestScore = Math.max(bestScore, fieldScore);
      }
    });
    
    // Only include results with meaningful matches
    if (bestScore > 0.3 && matchedFields.length > 0) {
      // Convert coordinates safely
      const lat = typeof plaque.latitude === 'string' 
        ? parseFloat(plaque.latitude) 
        : plaque.latitude || 0;
      const lng = typeof plaque.longitude === 'string' 
        ? parseFloat(plaque.longitude) 
        : plaque.longitude || 0;
      
      results.push({
        type: 'plaque',
        id: plaque.id,
        title: plaque.title || 'Unnamed Plaque',
        subtitle: formatPlaqueSubtitle(plaque, matchedFields),
        coordinates: [lat, lng] as [number, number],
        plaque,
        relevanceScore: totalWeightedScore,
        matchedFields
      });
    }
  });
  
  // Sort by relevance score (highest first)
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8); // Limit to top 8 results
}

/**
 * Format subtitle showing what matched
 */
function formatPlaqueSubtitle(plaque: Plaque, matchedFields: string[]): string {
  const parts = [];
  
  // Show location if available
  if (plaque.location) {
    parts.push(plaque.location);
  } else if (plaque.address) {
    parts.push(plaque.address.split(',')[0]); // First part of address
  }
  
  // Show profession if it was matched
  if (matchedFields.includes('profession') && plaque.profession) {
    parts.push(plaque.profession);
  }
  
  // Show what fields were matched (for debugging)
  const matchInfo = matchedFields
    .filter(field => !['location', 'address'].includes(field))
    .slice(0, 2)
    .join(', ');
  
  if (matchInfo && parts.length > 0) {
    parts.push(`• ${matchInfo}`);
  }
  
  return parts.join(' • ') || 'Blue Plaque';
}

/**
 * Search suggestions with highlighted terms
 */
export function highlightSearchTerms(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  
  const query = searchTerm.trim();
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Get search suggestions based on popular terms
 */
export function getSearchSuggestions(plaques: Plaque[]): string[] {
  const suggestions = new Set<string>();
  
  // Popular professions
  const professionCounts: Record<string, number> = {};
  plaques.forEach(plaque => {
    if (plaque.profession && plaque.profession !== 'Unknown') {
      professionCounts[plaque.profession] = (professionCounts[plaque.profession] || 0) + 1;
    }
  });
  
  // Add top professions
  Object.entries(professionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([profession]) => suggestions.add(profession));
  
  // Popular first names from titles
  const namePattern = /\b([A-Z][a-z]{3,})\s+[A-Z][a-z]+\b/g;
  const firstNames: Record<string, number> = {};
  
  plaques.forEach(plaque => {
    if (plaque.title) {
      let match;
      while ((match = namePattern.exec(plaque.title)) !== null) {
        const firstName = match[1];
        if (firstName.length > 3) {
          firstNames[firstName] = (firstNames[firstName] || 0) + 1;
        }
      }
    }
  });
  
  // Add popular first names
  Object.entries(firstNames)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .forEach(([name]) => suggestions.add(name));
  
  // Add some popular search terms
  const popularTerms = [
    'author', 'writer', 'artist', 'scientist', 'politician', 
    'actor', 'musician', 'poet', 'doctor', 'engineer'
  ];
  
  popularTerms.forEach(term => suggestions.add(term));
  
  return Array.from(suggestions);
}