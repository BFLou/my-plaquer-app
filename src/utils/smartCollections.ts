// src/utils/smartCollections.ts
import { Plaque } from '@/types/plaque';

// Define EnhancedCollection interface locally if not available
interface EnhancedCollection {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  plaques: number;
  updated: string;
  isFavorite: boolean;
  isPublic: boolean;
  isShared: boolean;
  owner: {
    id: number;
    name: string;
  };
  collaborators: any[];
  tags: Array<{ id: number; name: string; color: string }>;
  views: number;
  dateCreated: string;
  dateUpdated: string;
  isPinned: boolean;
  smartCollection: boolean;
  filterCriteria: FilterCriteria;
}

type FilterCriteria = {
  color?: string[];
  postcode?: string[];
  area?: string[];
  profession?: string[];
  isVisited?: boolean;
  dateVisitedAfter?: Date;
  dateVisitedBefore?: Date;
  tags?: string[];
  keyword?: string;
};

export const createSmartCollection = (
  name: string,
  description: string,
  plaques: Plaque[],
  criteria: FilterCriteria,
  userId: number,
  icon?: string,
  color?: string
): EnhancedCollection => {
  // Filter plaques based on criteria
  const filteredPlaques = plaques.filter(plaque => {
    // Color filter
    if (criteria.color && criteria.color.length > 0) {
      if (!plaque.color || !criteria.color.includes(plaque.color.toLowerCase())) {
        return false;
      }
    }
    
    // Postcode filter
    if (criteria.postcode && criteria.postcode.length > 0) {
      if (!plaque.postcode || !criteria.postcode.includes(plaque.postcode)) {
        return false;
      }
    }
    
    // Area filter
    if (criteria.area && criteria.area.length > 0) {
      if (!plaque.area || !criteria.area.includes(plaque.area)) {
        return false;
      }
    }
    
    // Profession filter
    if (criteria.profession && criteria.profession.length > 0) {
      if (!plaque.profession || !criteria.profession.includes(plaque.profession)) {
        return false;
      }
    }
    
    // Visited filter
    if (criteria.isVisited !== undefined) {
      if (plaque.visited !== criteria.isVisited) {
        return false;
      }
    }
    
    // Date visited filters
    if (plaque.visited) {
      // These would come from the visit data in a real app
      const visitDate = new Date(); // Placeholder
      
      if (criteria.dateVisitedAfter && visitDate < criteria.dateVisitedAfter) {
        return false;
      }
      
      if (criteria.dateVisitedBefore && visitDate > criteria.dateVisitedBefore) {
        return false;
      }
    }
    
    // Keyword search
    if (criteria.keyword) {
      const keyword = criteria.keyword.toLowerCase();
      const matchesKeyword = 
        (plaque.title && plaque.title.toLowerCase().includes(keyword)) ||
        (plaque.description && plaque.description.toLowerCase().includes(keyword)) ||
        (plaque.inscription && plaque.inscription.toLowerCase().includes(keyword)) ||
        (plaque.location && plaque.location.toLowerCase().includes(keyword)) ||
        (plaque.address && plaque.address.toLowerCase().includes(keyword));
        
      if (!matchesKeyword) {
        return false;
      }
    }
    
    return true;
  });
  
  // Create the collection
  const smartCollection: EnhancedCollection = {
    id: Date.now(), // Generate a temporary ID
    name,
    description,
    icon: icon || '🔍', // Default icon for smart collections
    color: color || 'bg-purple-500', // Default color
    plaques: filteredPlaques.length,
    updated: 'just now',
    isFavorite: false,
    isPublic: false,
    isShared: false,
    owner: {
      id: userId,
      name: 'Current User'
    },
    collaborators: [],
    tags: [{ id: 9999, name: 'Smart Collection', color: '#a855f7' }],
    views: 0,
    dateCreated: new Date().toISOString(),
    dateUpdated: new Date().toISOString(),
    isPinned: false,
    smartCollection: true, // Mark as a smart collection
    filterCriteria: criteria // Store criteria for updates
  };
  
  return smartCollection;
};

// Function to suggest smart collections based on user data
export const suggestSmartCollections = (
  plaques: Plaque[],
  userId: number
): EnhancedCollection[] => {
  const suggestions: EnhancedCollection[] = [];
  
  // Get unique colors - with null check
  const colors = [...new Set(plaques
    .filter(p => p.color)
    .map(p => p.color!.toLowerCase()) // Use non-null assertion since we filtered
  )];
  
  // Get unique professions
  const professions = [...new Set(plaques
    .filter(p => p.profession)
    .map(p => p.profession!)
  )];
  
  // Get unique areas
  const areas = [...new Set(plaques
    .filter(p => p.area)
    .map(p => p.area!)
  )];
  
  // Create a collection for each color with enough plaques
  colors.forEach(color => {
    const colorPlaques = plaques.filter(p => p.color?.toLowerCase() === color);
    if (colorPlaques.length >= 3) { // Only suggest if there are enough plaques
      const colorName = color.charAt(0).toUpperCase() + color.slice(1);
      suggestions.push(createSmartCollection(
        `${colorName} Plaques`,
        `Collection of ${colorPlaques.length} ${colorName.toLowerCase()} plaques`,
        plaques,
        { color: [color] },
        userId,
        color === 'blue' ? '🔵' : color === 'green' ? '🟢' : '🟤'
      ));
    }
  });
  
  // Create a collection for each profession with enough plaques
  professions.forEach(profession => {
    const professionPlaques = plaques.filter(p => p.profession === profession);
    if (professionPlaques.length >= 2) { // Only suggest if there are enough plaques
      suggestions.push(createSmartCollection(
        `${profession}s of London`,
        `Collection of plaques dedicated to ${profession.toLowerCase()}s`,
        plaques,
        { profession: [profession] },
        userId,
        profession.toLowerCase().includes('author') || profession.toLowerCase().includes('writer') ? '✒️' : 
        profession.toLowerCase().includes('scientist') ? '🔬' : 
        profession.toLowerCase().includes('artist') ? '🎨' : 
        profession.toLowerCase().includes('musician') ? '🎵' : '👤'
      ));
    }
  });
  
  // Create a collection for each area with enough plaques
  areas.forEach(area => {
    const areaPlaques = plaques.filter(p => p.area === area);
    if (areaPlaques.length >= 3) { // Only suggest if there are enough plaques
      suggestions.push(createSmartCollection(
        `Plaques in ${area}`,
        `Collection of ${areaPlaques.length} plaques in the ${area} area`,
        plaques,
        { area: [area] },
        userId,
        '🏙️'
      ));
    }
  });
  
  // Create a collection for plaques that haven't been visited
  const unvisitedPlaques = plaques.filter(p => !p.visited);
  if (unvisitedPlaques.length > 0) {
    suggestions.push(createSmartCollection(
      'Plaques to Visit',
      `Collection of ${unvisitedPlaques.length} plaques you haven't visited yet`,
      plaques,
      { isVisited: false },
      userId,
      '🎯'
    ));
  }
  
  return suggestions;
};