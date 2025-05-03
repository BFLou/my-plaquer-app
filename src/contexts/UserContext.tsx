// src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import userData from '../data/user_data.json';

// Define our context types
export type UserContextType = {
  user: typeof userData.user;
  visitedPlaques: typeof userData.visited_plaques;
  collections: typeof userData.collections;
  favorites: number[];
  isVisited: (plaqueId: number) => boolean;
  toggleFavorite: (plaqueId: number) => void;
  markVisited: (plaqueId: number) => void;
};

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(userData.user);
  const [visitedPlaques, setVisitedPlaques] = useState(userData.visited_plaques);
  const [collections, setCollections] = useState(userData.collections);
  
  // Extract plaque IDs that are marked as favorites in collections
  const [favorites, setFavorites] = useState<number[]>([]);
  
  // Initialize favorites from collection data
  useEffect(() => {
    // For this demo, we'll consider plaques in favorite collections as favorites
    const favoriteCollections = collections.filter(c => c.is_favorite);
    const favoritePlaqueIds = new Set<number>();
    
    favoriteCollections.forEach(collection => {
      collection.plaques.forEach(plaqueId => {
        favoritePlaqueIds.add(plaqueId);
      });
    });
    
    setFavorites(Array.from(favoritePlaqueIds));
  }, [collections]);
  
  // Check if a plaque has been visited
  const isVisited = (plaqueId: number): boolean => {
    return visitedPlaques.some(visit => visit.plaque_id === plaqueId);
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
    
    setVisitedPlaques(prev => [...prev, newVisit]);
  };
  
  const value = {
    user,
    visitedPlaques,
    collections,
    favorites,
    isVisited,
    toggleFavorite,
    markVisited,
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