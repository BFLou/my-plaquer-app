// src/services/DataService.ts
import { Plaque } from '@/types/plaque';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';

// Import JSON files directly
import userData from '../data/user_data.json';

// Export types for the data structure
export interface VisitedPlaque {
  plaque_id: number;
  visited_at: string;
  notes: string;
  photos: string[];
  rating: number;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  is_favorite: boolean;
  plaques: number[];
}

export interface UserData {
  user: {
    id: number;
    username: string;
    email: string;
    created_at: string;
    preferences: {
      default_view: string;
      default_sort: string;
    }
  };
  visited_plaques: VisitedPlaque[];
  collections: Collection[];
}

// This function would normally fetch from a plaque DB or API
// For demo, we'll create a helper function to map plaque IDs to mock data
const createPlaqueLookupMap = () => {
  // We'll fetch this from plaque_data.json in a real app
  const allPlaquesMap: Record<number, Plaque> = {};
  
  // Extract all plaque IDs from collections
  const plaqueIds = new Set<number>();
  userData.collections.forEach(collection => {
    collection.plaques.forEach(plaqueId => {
      plaqueIds.add(plaqueId);
    });
  });
  
  // Create a mapping function from ID to mock plaque data
  // In a real app, this would load from plaque_data.json
  Array.from(plaqueIds).forEach(id => {
    // Create a basic plaque record for each ID
    // In a real app, this would use real data from plaque_data.json
    allPlaquesMap[id] = {
      id,
      title: `Plaque ${id}`,
      location: "London",
      postcode: "WC1",
      color: "blue",
      profession: determineDefaultProfession(id),
      description: `Description for plaque ${id}`,
      image: "/api/placeholder/400/300",
      added: "Unknown date"
    };
  });
  
  return allPlaquesMap;
};

// Helper function to determine a default profession based on ID patterns
function determineDefaultProfession(id: number): string {
  // This is just for demo - in real app, this would use actual data
  if (id >= 10000 && id < 10050) return "Author";
  if (id >= 10050 && id < 10100) return "Artist";
  if (id >= 10100 && id < 10150) return "Musician";
  if (id > 1000 && id < 1200) return "Philosopher";
  if (id < 500) return "Scientist";
  return "Notable Figure";
}

export const DataService = {
  /**
   * Get all user data
   */
  getUserData: async (): Promise<UserData> => {
    // Normally this would be a fetch call to an API
    // For demo, we just return the imported JSON data
    return userData;
  },
  
  /**
   * Get a plaque by ID
   */
  getPlaque: async (id: number): Promise<Plaque | undefined> => {
    // In a real app, this would fetch from plaque_data.json or an API
    // For demo, we'll use our mapping function
    const plaquesMap = createPlaqueLookupMap();
    return plaquesMap[id];
  },
  
  /**
   * Get plaques by IDs
   */
  getPlaquesByIds: async (ids: number[]): Promise<Plaque[]> => {
    // In a real app, this would filter plaque_data.json or fetch from an API
    // For demo, we'll use our mapping function
    const plaquesMap = createPlaqueLookupMap();
    return ids
      .map(id => plaquesMap[id])
      .filter(Boolean);
  },
  
  /**
   * Get all plaques
   */
  getAllPlaques: async (): Promise<Plaque[]> => {
    // In a real app, this would load from plaque_data.json or fetch from an API
    // For demo, we'll use our mapping function
    const plaquesMap = createPlaqueLookupMap();
    return Object.values(plaquesMap);
  }
};