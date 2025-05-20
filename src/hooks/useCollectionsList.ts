// src/hooks/useCollectionsList.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollection';
import { getPlaqueCount } from '@/utils/collectionHelpers';

export type ViewMode = 'grid' | 'list' | 'map';

export const useCollectionsList = () => {
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_updated');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filteredCollections, setFilteredCollections] = useState([]);
  
  // Firebase collections hook
  const { collections, loading, error } = useCollections();
  
  // Handle filtering for the 'recent' tab
  const getRecentCollections = (collections) => {
    // Get collections from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return collections.filter(collection => {
      // Convert updated_at to Date object (handle different formats)
      let updatedAt;
      
      if (collection.updated_at) {
        if (typeof collection.updated_at === 'string') {
          // Handle string dates like "2 days ago" by using the formatTimeAgo logic in reverse
          // This is a simplified approach - in a real app you'd want more robust parsing
          const daysAgo = parseDaysFromTimeAgo(collection.updated_at);
          if (daysAgo !== null) {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            updatedAt = date;
          }
        } else if (collection.updated_at instanceof Date) {
          updatedAt = collection.updated_at;
        } else if (collection.updated_at.toDate) {
          // Firestore timestamp
          updatedAt = collection.updated_at.toDate();
        }
      }
      
      // If we couldn't parse the date, include it as recent
      if (!updatedAt) return true;
      
      // Check if it's within the last week
      return updatedAt >= oneWeekAgo;
    });
  };

  // Helper function to parse "X days ago" into a number
  const parseDaysFromTimeAgo = (timeAgoString) => {
    if (timeAgoString === 'today') return 0;
    if (timeAgoString === 'yesterday') return 1;
    
    const match = timeAgoString.match(/^(\d+) days? ago$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    const weekMatch = timeAgoString.match(/^(\d+) weeks? ago$/);
    if (weekMatch) {
      return parseInt(weekMatch[1], 10) * 7;
    }
    
    return null;
  };

  // Sort collections by updated time
  const sortCollectionsByUpdated = (collections, descending = true) => {
    return [...collections].sort((a, b) => {
      let dateA, dateB;
      
      try {
        if (typeof a.updated_at === 'string') {
          const daysAgoA = parseDaysFromTimeAgo(a.updated_at);
          if (daysAgoA !== null) {
            const date = new Date();
            date.setDate(date.getDate() - daysAgoA);
            dateA = date.getTime();
          } else {
            dateA = new Date(a.updated_at).getTime();
          }
        } else if (a.updated_at instanceof Date) {
          dateA = a.updated_at.getTime();
        } else if (a.updated_at && a.updated_at.toDate) {
          dateA = a.updated_at.toDate().getTime();
        } else {
          dateA = 0;
        }
        
        if (typeof b.updated_at === 'string') {
          const daysAgoB = parseDaysFromTimeAgo(b.updated_at);
          if (daysAgoB !== null) {
            const date = new Date();
            date.setDate(date.getDate() - daysAgoB);
            dateB = date.getTime();
          } else {
            dateB = new Date(b.updated_at).getTime();
          }
        } else if (b.updated_at instanceof Date) {
          dateB = b.updated_at.getTime();
        } else if (b.updated_at && b.updated_at.toDate) {
          dateB = b.updated_at.toDate().getTime();
        } else {
          dateB = 0;
        }
      } catch (e) {
        console.error('Error sorting by date:', e);
        return 0;
      }
      
      return descending ? dateB - dateA : dateA - dateB;
    });
  };

  // Filtering and sorting logic
  const filterAndSortCollections = useCallback(() => {
    // Start with all collections
    let filtered = [...collections];
    
    // Apply favorites filter if active
    if (showOnlyFavorites) {
      filtered = filtered.filter(c => c.is_favorite);
    }
    
    // Apply active tab filter
    if (activeTab === 'favorites') {
      filtered = filtered.filter(c => c.is_favorite);
    } else if (activeTab === 'recent') {
      filtered = getRecentCollections(filtered);
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        (c.description && c.description.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    if (sortOption === 'recently_updated') {
      // Sort by updated_at (most recent first)
      filtered = sortCollectionsByUpdated(filtered, true);
    } else if (sortOption === 'oldest_updated') {
      // Sort by updated_at (oldest first)
      filtered = sortCollectionsByUpdated(filtered, false);
    } else if (sortOption === 'a_to_z') {
      // Sort alphabetically A-Z
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'z_to_a') {
      // Sort alphabetically Z-A
      filtered = filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === 'most_plaques') {
      // Sort by plaque count (most first)
      filtered = filtered.sort((a, b) => getPlaqueCount(b) - getPlaqueCount(a));
    } else if (sortOption === 'least_plaques') {
      // Sort by plaque count (least first)
      filtered = filtered.sort((a, b) => getPlaqueCount(a) - getPlaqueCount(b));
    }
    
    setFilteredCollections(filtered);
  }, [collections, searchQuery, sortOption, showOnlyFavorites, activeTab]);
  
  // Apply filtering and sorting whenever dependencies change
  useEffect(() => {
    filterAndSortCollections();
  }, [filterAndSortCollections]);
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'favorites') {
      setShowOnlyFavorites(true);
    } else {
      setShowOnlyFavorites(false);
    }
    
    // If we select 'recent' tab, we need to set sort to 'recently_updated'
    if (tab === 'recent') {
      setSortOption('recently_updated');
    }
  };
  
  // Active filters for display
  const activeFilters = [];
  if (showOnlyFavorites) activeFilters.push('Favorites');
  if (searchQuery) activeFilters.push('Search');
  
  // Reset all selections and filters
  const resetFilters = () => {
    setSearchQuery('');
    setShowOnlyFavorites(false);
    setSelectedCollections([]);
    setActiveTab('all');
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
    filteredCollections,
    activeFilters,
    resetFilters,
    toggleSelect,
    activeTab,
    setActiveTab,
    handleTabChange
  };
};

export default useCollectionsList;