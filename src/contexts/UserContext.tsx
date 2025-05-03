// src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Plaque } from '@/types/plaque';
import { DataService, UserData, Collection, VisitedPlaque } from '../services/DataService';

// Define our context types
export type UserContextType = {
  user: UserData['user'] | null;
  visitedPlaques: VisitedPlaque[];
  collections: Collection[];
  favorites: number[];
  isLoading: boolean;
  error: string | null;
  isVisited: (plaqueId: number) => boolean;
  toggleFavorite: (plaqueId: number) => void;
  markVisited: (plaqueId: number) => void;
  getPlaque: (plaqueId: number) => Promise<Plaque | undefined>;
  getCollectionPlaques: (collectionId: number) => Promise<Plaque[]>;
  getAvailablePlaques: (collectionId: number) => Promise<Plaque[]>;
  addPlaquesToCollection: (collectionId: number, plaqueIds: number[]) => Promise<void>;
  removePlaquesFromCollection: (collectionId: number, plaqueIds: number[]) => Promise<void>;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [plaquesCache, setPlaquesCache] = useState<Record<number, Plaque>>({});
  
  // Load initial user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const data = await DataService.getUserData();
        setUserData(data);
        
        // Initialize favorites from collection data
        const favoriteCollections = data.collections.filter(c => c.is_favorite);
        const favoritePlaqueIds = new Set<number>();
        
        favoriteCollections.forEach(collection => {
          collection.plaques.forEach(plaqueId => {
            favoritePlaqueIds.add(plaqueId);
          });
        });
        
        setFavorites(Array.from(favoritePlaqueIds));
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  // Cache plaque data for better performance
  const cachePlaque = (plaque: Plaque) => {
    setPlaquesCache(prev => ({
      ...prev,
      [plaque.id]: plaque
    }));
  };
  
  // Check if a plaque has been visited
  const isVisited = (plaqueId: number): boolean => {
    if (!userData) return false;
    return userData.visited_plaques.some(visit => visit.plaque_id === plaqueId);
  };
  
  // Toggle favorite status for a plaque
  const toggleFavorite = (plaqueId: number) => {
    setFavorites(prev => 
      prev.includes(plaqueId) 
        ? prev.filter(id => id !== plaqueId) 
        : [...prev, plaqueId]
    );
  };
  
  // Mark a plaque as visited
  const markVisited = (plaqueId: number) => {
    if (!userData) return;
    
    // Check if already visited
    if (isVisited(plaqueId)) return;
    
    // Create a new visit entry
    const newVisit = {
      plaque_id: plaqueId,
      visited_at: new Date().toISOString(),
      notes: "",
      photos: [],
      rating: 0
    };
    
    // Update user data
    setUserData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        visited_plaques: [...prev.visited_plaques, newVisit]
      };
    });
  };
  
  // Get a plaque by ID with visited and favorite status
  const getPlaque = async (plaqueId: number): Promise<Plaque | undefined> => {
    // Check cache first
    if (plaquesCache[plaqueId]) {
      const cachedPlaque = plaquesCache[plaqueId];
      
      return {
        ...cachedPlaque,
        visited: isVisited(plaqueId),
        isFavorite: favorites.includes(plaqueId)
      };
    }
    
    // Fetch from service if not in cache
    try {
      const plaque = await DataService.getPlaque(plaqueId);
      
      if (plaque) {
        // Add to cache
        cachePlaque(plaque);
        
        return {
          ...plaque,
          visited: isVisited(plaqueId),
          isFavorite: favorites.includes(plaqueId)
        };
      }
      
      return undefined;
    } catch (err) {
      console.error(`Error fetching plaque ${plaqueId}:`, err);
      return undefined;
    }
  };
  
  // Get all plaques for a collection
  const getCollectionPlaques = async (collectionId: number): Promise<Plaque[]> => {
    if (!userData) return [];
    
    const collection = userData.collections.find(c => c.id === collectionId);
    if (!collection) return [];
    
    try {
      const plaques = await DataService.getPlaquesByIds(collection.plaques);
      
      // Add to cache
      plaques.forEach(cachePlaque);
      
      return plaques.map(plaque => ({
        ...plaque,
        visited: isVisited(plaque.id),
        isFavorite: favorites.includes(plaque.id)
      }));
    } catch (err) {
      console.error(`Error fetching plaques for collection ${collectionId}:`, err);
      return [];
    }
  };
  
  // Get plaques not in a collection (for "Add Plaques" feature)
  const getAvailablePlaques = async (collectionId: number): Promise<Plaque[]> => {
    if (!userData) return [];
    
    const collection = userData.collections.find(c => c.id === collectionId);
    if (!collection) return [];
    
    try {
      // Get all plaques
      const allPlaques = await DataService.getAllPlaques();
      
      // Filter out plaques already in the collection
      const availablePlaques = allPlaques.filter(plaque => 
        !collection.plaques.includes(plaque.id)
      );
      
      // Add to cache
      availablePlaques.forEach(cachePlaque);
      
      return availablePlaques.map(plaque => ({
        ...plaque,
        visited: isVisited(plaque.id),
        isFavorite: favorites.includes(plaque.id)
      }));
    } catch (err) {
      console.error(`Error fetching available plaques for collection ${collectionId}:`, err);
      return [];
    }
  };
  
  // Add plaques to a collection
  const addPlaquesToCollection = async (collectionId: number, plaqueIds: number[]): Promise<void> => {
    if (!userData) return;
    
    // Find the collection
    const collectionIndex = userData.collections.findIndex(c => c.id === collectionId);
    if (collectionIndex === -1) return;
    
    // Update the collection with new plaque IDs
    setUserData(prev => {
      if (!prev) return prev;
      
      const updatedCollections = [...prev.collections];
      const collection = { ...updatedCollections[collectionIndex] };
      
      // Add new plaques, avoiding duplicates
      const updatedPlaques = Array.from(new Set([...collection.plaques, ...plaqueIds]));
      collection.plaques = updatedPlaques;
      collection.updated_at = new Date().toISOString();
      
      updatedCollections[collectionIndex] = collection;
      
      return {
        ...prev,
        collections: updatedCollections
      };
    });
  };
  
  // Remove plaques from a collection
  const removePlaquesFromCollection = async (collectionId: number, plaqueIds: number[]): Promise<void> => {
    if (!userData) return;
    
    // Find the collection
    const collectionIndex = userData.collections.findIndex(c => c.id === collectionId);
    if (collectionIndex === -1) return;
    
    // Update the collection by removing plaque IDs
    setUserData(prev => {
      if (!prev) return prev;
      
      const updatedCollections = [...prev.collections];
      const collection = { ...updatedCollections[collectionIndex] };
      
      // Remove the specified plaques
      collection.plaques = collection.plaques.filter(id => !plaqueIds.includes(id));
      collection.updated_at = new Date().toISOString();
      
      updatedCollections[collectionIndex] = collection;
      
      return {
        ...prev,
        collections: updatedCollections
      };
    });
  };
  
  const value = {
    user: userData?.user || null,
    visitedPlaques: userData?.visited_plaques || [],
    collections: userData?.collections || [],
    favorites,
    isLoading,
    error,
    isVisited,
    toggleFavorite,
    markVisited,
    getPlaque,
    getCollectionPlaques,
    getAvailablePlaques,
    addPlaquesToCollection,
    removePlaquesFromCollection
  };
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook for using the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};