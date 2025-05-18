// src/features/collections/hooks/useCollectionsList.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollection';

export type ViewMode = 'grid' | 'list' | 'map';

export const useCollectionsList = () => {
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_updated');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  
  // Firebase collections hook
  const { collections, loading, error } = useCollections();
  
  // Filter collections based on search query and favorites
  const filteredCollections = collections.filter(collection => {
    // Filter by favorites if toggled
    if (showOnlyFavorites && !collection.is_favorite) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        collection.name.toLowerCase().includes(query) || 
        (collection.description && collection.description.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Sort collections
  const sortedCollections = [...filteredCollections].sort((a, b) => {
    switch(sortOption) {
      case 'recently_updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'oldest_updated':
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      case 'a_to_z':
        return a.name.localeCompare(b.name);
      case 'z_to_a':
        return b.name.localeCompare(a.name);
      case 'most_plaques':
        const bCount = Array.isArray(b.plaques) ? b.plaques.length : b.plaques;
        const aCount = Array.isArray(a.plaques) ? a.plaques.length : a.plaques;
        return bCount - aCount;
      case 'least_plaques':
        const aCount2 = Array.isArray(a.plaques) ? a.plaques.length : a.plaques;
        const bCount2 = Array.isArray(b.plaques) ? b.plaques.length : b.plaques;
        return aCount2 - bCount2;
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });
  
  // Active filters for display
  const activeFilters = [];
  if (showOnlyFavorites) activeFilters.push('Favorites');
  if (searchQuery) activeFilters.push('Search');
  
  // Reset all selections and filters
  const resetFilters = () => {
    setSearchQuery('');
    setShowOnlyFavorites(false);
    setSelectedCollections([]);
  };
  
  // Toggle selection of collection
  const toggleSelect = (id: string) => {
    setSelectedCollections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  return {
    collections,
    loading,
    error,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    showOnlyFavorites,
    setShowOnlyFavorites,
    selectedCollections,
    setSelectedCollections,
    filteredCollections: sortedCollections,
    activeFilters,
    resetFilters,
    toggleSelect
  };
};

export default useCollectionsList;