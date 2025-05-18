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

// src/features/collections/hooks/useCollectionActions.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollection';
import { toast } from 'sonner';

export const useCollectionActions = () => {
  const navigate = useNavigate();
  
  // Firebase collections hook actions
  const { 
    createCollection, 
    updateCollection, 
    deleteCollection, 
    batchDeleteCollections,
    toggleFavorite,
    batchToggleFavorite,
    duplicateCollection
  } = useCollections();
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editCollectionData, setEditCollectionData] = useState<any>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [collectionsToDelete, setCollectionsToDelete] = useState<string[]>([]);
  
  // Create collection
  const handleCreateCollection = async (data: any) => {
    try {
      setIsLoading(true);
      await createCollection(
        data.name,
        data.icon,
        data.color,
        data.description || '',
        [], // Initial plaques
        data.tags || []
      );
      setCreateCollectionOpen(false);
      toast.success('Collection created successfully');
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Edit collection
  const handleEditCollection = async (data: any) => {
    if (!editCollectionData) return;
    
    try {
      setIsLoading(true);
      await updateCollection(editCollectionData.id, {
        name: data.name,
        description: data.description || '',
        icon: data.icon,
        color: data.color,
        tags: data.tags || []
      });
      
      setEditCollectionOpen(false);
      setEditCollectionData(null);
      toast.success('Collection updated successfully');
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open edit form
  const openEditDialog = (id: string) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      setEditCollectionData(collection);
      setEditCollectionOpen(true);
    }
  };
  
  // Toggle favorite status
  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };
  
  // Duplicate a collection
  const handleDuplicateCollection = async (id: string) => {
    try {
      setIsLoading(true);
      const duplicated = await duplicateCollection(id);
      toast.success('Collection duplicated successfully');
    } catch (error) {
      console.error("Error duplicating collection:", error);
      toast.error("Failed to duplicate collection");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete collections
  const handleDeleteCollections = async (collectionIds: string[]) => {
    try {
      setIsLoading(true);
      
      if (collectionIds.length === 1) {
        await deleteCollection(collectionIds[0]);
      } else {
        await batchDeleteCollections(collectionIds);
      }
      
      toast.success(
        collectionIds.length === 1 
          ? 'Collection deleted successfully' 
          : `${collectionIds.length} collections deleted successfully`
      );
      
      setCollectionsToDelete([]);
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Error deleting collections:", error);
      toast.error("Failed to delete collections");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle prepare for delete
  const prepareForDelete = (ids: string[]) => {
    setCollectionsToDelete(ids);
    setConfirmDeleteOpen(true);
  };
  
  // Favorite multiple collections
  const handleBatchFavorite = async (ids: string[]) => {
    try {
      setIsLoading(true);
      await batchToggleFavorite(ids, true);
      toast.success(`${ids.length} collections added to favorites`);
    } catch (error) {
      console.error("Error batch favoriting:", error);
      toast.error("Failed to update favorites");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to collection details
  const navigateToCollection = (id: string) => {
    navigate(`/collections/${id}`);
  };
  
  return {
    isLoading,
    createCollectionOpen,
    setCreateCollectionOpen,
    editCollectionOpen,
    setEditCollectionOpen,
    editCollectionData,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    collectionsToDelete,
    handleCreateCollection,
    handleEditCollection,
    openEditDialog,
    handleToggleFavorite,
    handleDuplicateCollection,
    handleDeleteCollections,
    prepareForDelete,
    handleBatchFavorite,
    navigateToCollection
  };
};

// src/features/collections/hooks/useCollectionDetail.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollection';
import { usePlaques } from '@/hooks/usePlaques';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { toast } from 'sonner';
import { Plaque } from '@/types/plaque';

export type ViewMode = 'grid' | 'list' | 'map';

export const useCollectionDetail = (collectionId: string) => {
  const navigate = useNavigate();
  const { getCollection, updateCollection, deleteCollection, toggleFavorite, duplicateCollection } = useCollections();
  const { fetchAvailablePlaques } = usePlaques();
  const { visits: userVisits, isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  
  // State
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionPlaques, setCollectionPlaques] = useState<Plaque[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recently_added');
  const [activeTag, setActiveTag] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [editNameMode, setEditNameMode] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [selectedPlaques, setSelectedPlaques] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  
  // Load collection data
  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) {
        navigate('/collections');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const fetchedCollection = await getCollection(collectionId);
        if (!fetchedCollection) {
          throw new Error('Collection not found');
        }
        
        setCollection(fetchedCollection);
        setEditNameValue(fetchedCollection.name);
        
        // Get plaques for this collection (mock implementation)
        // In a real app, you'd fetch actual plaques based on the IDs
        const plaqueIds = fetchedCollection.plaques || [];
        const plaques: Plaque[] = [];
        
        setCollectionPlaques(plaques);
        
        // Set initial favorites based on visited plaques
        const visitedPlaqueIds = userVisits.map(visit => visit.plaque_id);
        setFavorites(visitedPlaqueIds);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching collection:', err);
        setError(err.message || 'Failed to load collection');
        setLoading(false);
        toast.error('Failed to load collection');
      }
    };
    
    fetchCollection();
  }, [collectionId, getCollection, navigate, userVisits]);
  
  // Get all unique tags from plaques
  const getAllTags = () => {
    const tags = ['all', ...new Set(collectionPlaques
      .filter(plaque => plaque.profession)
      .map(plaque => plaque.profession as string)
    )];
    return tags;
  };
  
  const allTags = getAllTags();
  
  // Filter plaques based on search query and active tag
  const filteredPlaques = collectionPlaques
    .filter(plaque => {
      // Match search query
      const matchesSearch = searchQuery === '' || 
        plaque.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plaque.location && plaque.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.inscription && plaque.inscription.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Match active tag
      const matchesTag = activeTag === 'all' || 
        (plaque.profession && plaque.profession === activeTag);
      
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      // Sort based on selected option
      if (sortOption === 'recently_added') return b.id - a.id; // Using ID as proxy for order added
      if (sortOption === 'oldest_first') return a.id - b.id;
      if (sortOption === 'a_to_z') return a.title.localeCompare(b.title);
      if (sortOption === 'z_to_a') return b.title.localeCompare(a.title);
      return 0;
    });
  
  // Toggle select plaque
  const toggleSelectPlaque = (id: number) => {
    setSelectedPlaques(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Toggle favorite for a plaque
  const handleTogglePlaqueFavorite = (plaqueId: number) => {
    setFavorites(prev => 
      prev.includes(plaqueId) 
        ? prev.filter(id => id !== plaqueId) 
        : [...prev, plaqueId]
    );
  };
  
  // Mark plaque as visited
  const handleMarkVisited = async (plaqueId: number) => {
    try {
      await markAsVisited(plaqueId, {});
      
      // Update local state
      setCollectionPlaques(prev => prev.map(plaque => 
        plaque.id === plaqueId ? { ...plaque, visited: true } : plaque
      ));
      
      toast.success('Plaque marked as visited');
    } catch (err) {
      console.error('Error marking as visited:', err);
      toast.error('Failed to mark as visited');
    }
  };
  
  // Edit collection name
  const handleEditName = () => {
    setEditNameMode(true);
  };
  
  // Save edited name
  const handleSaveName = async () => {
    if (!collection || !editNameValue.trim() || editNameValue === collection.name) {
      setEditNameMode(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      await updateCollection(collection.id, {
        name: editNameValue
      });
      
      setCollection(prev => ({
        ...prev,
        name: editNameValue
      }));
      
      setEditNameMode(false);
      toast.success('Collection name updated');
    } catch (err) {
      console.error('Error updating collection name:', err);
      toast.error('Failed to update collection name');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setEditNameValue(collection?.name || '');
    setEditNameMode(false);
  };
  
  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      await toggleFavorite(collection.id);
      
      // Update local state
      setCollection(prev => ({
        ...prev,
        is_favorite: !prev.is_favorite
      }));
      
      toast.success(collection.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('Failed to update favorite status');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete this collection
  const handleDeleteCollection = async () => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      
      await deleteCollection(collection.id);
      
      toast.success('Collection deleted successfully');
      navigate('/collections');
    } catch (err) {
      console.error('Error deleting collection:', err);
      toast.error('Failed to delete collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Duplicate this collection
  const handleDuplicateCollection = async () => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      
      const duplicated = await duplicateCollection(collection.id);
      
      toast.success('Collection duplicated successfully');
      
      // Navigate to the new collection
      navigate(`/collections/${duplicated.id}`);
    } catch (err) {
      console.error('Error duplicating collection:', err);
      toast.error('Failed to duplicate collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    collection,
    loading,
    error,
    collectionPlaques,
    filteredPlaques,
    allTags,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    activeTag,
    setActiveTag,
    isLoading,
    editNameMode,
    editNameValue,
    selectedPlaques,
    setSelectedPlaques,
    favorites,
    toggleSelectPlaque,
    handleTogglePlaqueFavorite,
    handleMarkVisited,
    handleEditName,
    handleSaveName, 
    handleCancelEdit,
    handleToggleFavorite,
    handleDeleteCollection,
    handleDuplicateCollection
  };
};

// src/features/collections/utils/collectionHelpers.ts
import { Timestamp } from 'firebase/firestore';

export const formatTimeAgo = (dateValue: any): string => {
  // If no date value is provided, return 'recently'
  if (!dateValue) return 'recently';
  
  try {
    let date: Date;
    
    // Case 1: Firebase Timestamp object with toDate method
    if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    }
    // Case 2: Firebase server timestamp object with seconds & nanoseconds
    else if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      date = new Date(dateValue.seconds * 1000);
    }
    // Case 3: JavaScript Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Case 4: String date 
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }
    // Case 5: Numeric timestamp (milliseconds)
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    // Default fallback
    else {
      return 'recently';
    }
    
    // Verify the date is valid
    if (!date || isNaN(date.getTime())) {
      return 'recently';
    }
    
    // Calculate the time difference
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Format the output based on the difference
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    
  } catch (error) {
    // If any error occurs during processing, return 'recently'
    return 'recently';
  }
}

// Get the plaque count for a collection (handles array or number)
export const getPlaqueCount = (collection: any): number => {
  if (Array.isArray(collection.plaques)) {
    return collection.plaques.length;
  }
  return typeof collection.plaques === 'number' ? collection.plaques : 0;
}