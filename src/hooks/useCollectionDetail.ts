// src/hooks/useCollectionDetail.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollection';
import { usePlaques } from '@/hooks/usePlaques';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { toast } from 'sonner';
import { Plaque } from '@/types/plaque';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';

export type ViewMode = 'grid' | 'list' | 'map';

export const useCollectionDetail = (collectionId: string) => {
  const navigate = useNavigate();
  const { getCollection, updateCollection, deleteCollection, toggleFavorite, duplicateCollection, addPlaquesToCollection, removePlaquesFromCollection } = useCollections();
  const { visits, isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  
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
  const [addPlaquesModalOpen, setAddPlaquesModalOpen] = useState(false);
  const [availablePlaques, setAvailablePlaques] = useState<Plaque[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRemovePlaqueOpen, setConfirmRemovePlaqueOpen] = useState(false);
  const [plaqueToRemove, setPlaqueToRemove] = useState<number | null>(null);
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);

  // Fetch available plaques
  const fetchAvailablePlaques = async () => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      
      // In a real app, you'd fetch this from your API or Firebase
      // For now, let's simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Import the plaque data
      const { default: plaqueData } = await import('@/data/plaque_data.json');
      const adaptedData = adaptPlaquesData(plaqueData);
      
      // Filter out plaques already in the collection
      const collectionPlaqueIds = collection.plaques || [];
      const available = adaptedData.filter(
        plaque => !collectionPlaqueIds.includes(plaque.id)
      );
      
      setAvailablePlaques(available);
    } catch (error) {
      console.error('Error fetching available plaques:', error);
      toast.error('Failed to load available plaques');
    } finally {
      setIsLoading(false);
    }
  };

  // Load collection data
  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) {
        setError('Collection ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const collectionData = await getCollection(collectionId);
        
        if (!collectionData) {
          throw new Error('Collection not found');
        }
        
        setCollection(collectionData);
        setEditNameValue(collectionData.name);
        
        // Fetch plaques data for this collection
        const plaqueIds = collectionData.plaques || [];
        
        // Check if there are any plaques in this collection
        if (plaqueIds.length > 0) {
          try {
            // Import plaque data
            const { default: plaqueData } = await import('@/data/plaque_data.json');
            const adaptedData = adaptPlaquesData(plaqueData);
            
            // Filter only the plaques that are in this collection
            const collectionPlaques = adaptedData.filter(plaque => 
              plaqueIds.includes(plaque.id)
            );
            
            // Mark visited status for each plaque
            const plaquesWithVisitedStatus = collectionPlaques.map(plaque => ({
              ...plaque,
              visited: isPlaqueVisited(plaque.id)
            }));
            
            // Update state with the matching plaques
            setCollectionPlaques(plaquesWithVisitedStatus);
          } catch (err) {
            console.error('Error fetching plaque data:', err);
            toast.error('Failed to load plaque data');
          }
        } else {
          // No plaques in this collection
          setCollectionPlaques([]);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching collection:', err);
        setError(err.message || 'Failed to load collection');
        setLoading(false);
        toast.error('Failed to load collection');
      }
    };
    
    fetchCollection();
  }, [collectionId, getCollection, isPlaqueVisited]);
  
  // Add an additional effect to update visited status when visits change
  useEffect(() => {
    if (collectionPlaques.length > 0 && visits.length > 0) {
      // Update plaques with current visited status
      const updatedPlaques = collectionPlaques.map(plaque => ({
        ...plaque,
        visited: isPlaqueVisited(plaque.id)
      }));
      
      // Only update if there are changes to avoid infinite loops
      const hasChanges = updatedPlaques.some((p, i) => 
        p.visited !== collectionPlaques[i].visited
      );
      
      if (hasChanges) {
        setCollectionPlaques(updatedPlaques);
      }
    }
  }, [visits, collectionPlaques, isPlaqueVisited]);
  
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
  
  // Handle removing a plaque
  const handleRemovePlaque = (plaqueId: number) => {
    setPlaqueToRemove(plaqueId);
    setConfirmRemovePlaqueOpen(true);
  };
  
  // Confirm removing a plaque
  const confirmRemovePlaque = async () => {
    if (!collection || plaqueToRemove === null) return;
    
    try {
      setIsLoading(true);
      await removePlaquesFromCollection(collection.id, [plaqueToRemove]);
      setCollectionPlaques(prev => prev.filter(p => p.id !== plaqueToRemove));
      toast.success('Plaque removed from collection');
    } catch (err) {
      console.error('Error removing plaque from collection:', err);
      toast.error('Failed to remove plaque from collection');
    } finally {
      setConfirmRemovePlaqueOpen(false);
      setPlaqueToRemove(null);
      setIsLoading(false);
    }
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
      // Call the hook's markAsVisited function
      await markAsVisited(plaqueId, {});
      
      // Update local state for immediate UI feedback
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
  
  // Add plaques to collection
  const handleAddPlaques = async (plaqueIds: number[]) => {
    if (!collection || plaqueIds.length === 0) return;
    
    try {
      setIsLoading(true);
      await addPlaquesToCollection(collection.id, plaqueIds);
      
      // Get plaques to add from available plaques
      const plaquesToAdd = availablePlaques.filter(p => plaqueIds.includes(p.id));
      
      // Update collection plaques in local state
      setCollectionPlaques(prev => [...prev, ...plaquesToAdd]);
      
      // Remove added plaques from available plaques
      setAvailablePlaques(prev => prev.filter(p => !plaqueIds.includes(p.id)));
      
      toast.success(`Added ${plaqueIds.length} plaques to collection`);
      setAddPlaquesModalOpen(false);
    } catch (error) {
      console.error('Error adding plaques:', error);
      toast.error('Failed to add plaques to collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove plaques from collection
  const handleRemovePlaques = async () => {
    if (!collection || selectedPlaques.length === 0) return;
    
    try {
      setIsLoading(true);
      await removePlaquesFromCollection(collection.id, selectedPlaques);
      setCollectionPlaques(prev => prev.filter(p => !selectedPlaques.includes(p.id)));
      setSelectedPlaques([]);
      toast.success(`${selectedPlaques.length} plaques removed from collection`);
    } catch (err) {
      console.error('Error removing plaques from collection:', err);
      toast.error('Failed to remove plaques from collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete collection
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
      setConfirmDeleteOpen(false);
    }
  };
  
  // Duplicate collection
  const handleDuplicateCollection = async () => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      const duplicated = await duplicateCollection(collection.id);
      toast.success('Collection duplicated successfully');
      navigate(`/collections/${duplicated.id}`);
    } catch (err) {
      console.error('Error duplicating collection:', err);
      toast.error('Failed to duplicate collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle updating collection
  const handleUpdateCollection = async (data: any) => {
    if (!collection) return;
    
    try {
      setIsLoading(true);
      await updateCollection(collection.id, {
        name: data.name,
        description: data.description || '',
        icon: data.icon,
        color: data.color,
        tags: data.tags || []
      });
      
      // Update collection in state
      setCollection(prev => ({
        ...prev,
        name: data.name,
        description: data.description || '',
        icon: data.icon,
        color: data.color,
        tags: data.tags || []
      }));
      
      setEditFormOpen(false);
      toast.success('Collection updated successfully');
    } catch (err) {
      console.error('Error updating collection:', err);
      toast.error('Failed to update collection');
    } finally {
      setIsLoading(false);
    }
  };
  
  // View plaque details
  const handleViewPlaque = (plaque: Plaque) => {
    setSelectedPlaque(plaque);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveTag('all');
  };
  
  // Find nearby plaques for the detail view
  const getNearbyPlaques = (plaque: Plaque): Plaque[] => {
    return collectionPlaques.filter(p => 
      p.id !== plaque.id && 
      ((p.profession && plaque.profession && p.profession === plaque.profession) || 
       (p.color && plaque.color && p.color === plaque.color))
    ).slice(0, 3);
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
    handleDuplicateCollection,
    handleRemovePlaque,
    confirmRemovePlaque,
    confirmRemovePlaqueOpen,
    setConfirmRemovePlaqueOpen,
    plaqueToRemove,
    handleAddPlaques,
    handleRemovePlaques,
    handleViewPlaque,
    selectedPlaque,
    setSelectedPlaque,
    getNearbyPlaques,
    addPlaquesModalOpen,
    setAddPlaquesModalOpen,
    availablePlaques,
    fetchAvailablePlaques,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    handleClearSearch,
    visits,
    editFormOpen,
    setEditFormOpen,
    handleUpdateCollection
  };
};

export default useCollectionDetail;s