// src/features/collections/hooks/useCollectionActions.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollection';
import { toast } from 'sonner';
import { Collection } from '../components/collections/CollectionCard';

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
    duplicateCollection,
  } = useCollections();

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editCollectionData, setEditCollectionData] =
    useState<Collection | null>(null);
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
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
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
        tags: data.tags || [],
      });

      setEditCollectionOpen(false);
      setEditCollectionData(null);
      toast.success('Collection updated successfully');
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection');
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit form
  const openEditDialog = () => {
    const collection = editCollectionData;
    if (collection) {
      setEditCollectionData(collection);
      setEditCollectionOpen(true);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
      toast.success('Favorite status updated');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  // Duplicate a collection
  const handleDuplicateCollection = async (id: string) => {
    try {
      setIsLoading(true);
      await duplicateCollection(id);
      toast.success('Collection duplicated successfully');
    } catch (error) {
      console.error('Error duplicating collection:', error);
      toast.error('Failed to duplicate collection');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete collections
  const handleDeleteCollections = async () => {
    try {
      setIsLoading(true);

      if (collectionsToDelete.length === 1) {
        await deleteCollection(collectionsToDelete[0]);
        toast.success('Collection deleted successfully');
      } else {
        await batchDeleteCollections(collectionsToDelete);
        toast.success(
          `${collectionsToDelete.length} collections deleted successfully`
        );
      }

      setCollectionsToDelete([]);
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting collections:', error);
      toast.error('Failed to delete collections');
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
      console.error('Error batch favoriting:', error);
      toast.error('Failed to update favorites');
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
    setEditCollectionData,
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
    navigateToCollection,
  };
};

export default useCollectionActions;
