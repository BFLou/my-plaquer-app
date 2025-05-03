import { useState, useCallback } from 'react';
import { Collection } from '@/components/collections/CollectionCard';
import { toast } from 'sonner';

export const useCollectionOperations = (initialCollections: Collection[] = []) => {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  
  const toggleSelect = useCallback((id: number) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);
  
  const handleMenuOpen = useCallback((id: number) => {
    setMenuOpenId(prev => prev === id ? null : id);
  }, []);
  
  const handleEdit = useCallback((id: number) => {
    // This would typically open an edit modal
    toast({
      title: "Edit Collection",
      description: `Editing collection ${id}`,
      duration: 2000,
    });
  }, []);
  
  const handleDuplicate = useCallback((id: number) => {
    const collection = collections.find(c => c.id === id);
    if (collection) {
      const newCollection = {
        ...collection,
        id: collections.length + 1,
        name: `${collection.name} (Copy)`,
        plaques: 0,
        updated: 'just now',
        isPublic: false,
        isFavorite: false
      };
      setCollections(prev => [newCollection, ...prev]);
      
      toast({
        title: "Collection Duplicated",
        description: `Created a copy of "${collection.name}"`,
        duration: 2000,
      });
    }
  }, [collections]);
  
  const handleShare = useCallback((id: number) => {
    // This would typically open a share modal
    toast({
      title: "Share Collection",
      description: "Share dialog would open here",
      duration: 2000,
    });
  }, []);
  
  const handleToggleFavorite = useCallback((id: number) => {
    setCollections(prev => prev.map(collection => 
      collection.id === id ? 
        { ...collection, isFavorite: !collection.isFavorite } : 
        collection
    ));
    
    const collection = collections.find(c => c.id === id);
    toast({
      title: collection?.isFavorite ? "Removed from favorites" : "Added to favorites",
      description: `"${collection?.name}" ${collection?.isFavorite ? 'removed from' : 'added to'} favorites`,
      duration: 2000,
    });
  }, [collections]);
  
  const handleDelete = useCallback((id: number) => {
    const collection = collections.find(c => c.id === id);
    setCollections(prev => prev.filter(collection => collection.id !== id));
    
    toast({
      title: "Collection Deleted",
      description: `"${collection?.name}" has been deleted`,
      duration: 2000,
    });
  }, [collections]);
  
  const handleBulkDelete = useCallback(() => {
    const countToDelete = selectedCollections.length;
    setCollections(prev => prev.filter(collection => !selectedCollections.includes(collection.id)));
    setSelectedCollections([]);
    
    toast({
      title: "Collections Deleted",
      description: `${countToDelete} collections have been deleted`,
      duration: 2000,
    });
  }, [selectedCollections]);
  
  const createCollection = useCallback((newCollection: any) => {
    const createdCollection = {
      id: collections.length + 1,
      ...newCollection,
      plaques: 0,
      updated: 'just now',
      isPublic: newCollection.isPublic || false,
      isFavorite: false
    };
    
    setCollections(prev => [createdCollection, ...prev]);
    
    toast({
      title: "Collection Created",
      description: `"${newCollection.name}" has been created`,
      duration: 2000,
    });
    
    return createdCollection;
  }, [collections]);
  
  return {
    collections,
    setCollections,
    selectedCollections,
    setSelectedCollections,
    menuOpenId,
    toggleSelect,
    handleMenuOpen,
    handleEdit,
    handleDuplicate,
    handleShare,
    handleToggleFavorite,
    handleDelete,
    handleBulkDelete,
    createCollection
  };
};

export default useCollectionOperations;