// src/hooks/useCollections.tsx - Enhanced version
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CollectionData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_favorite: boolean;
  is_public: boolean;
  plaques: number[]; // Array of plaque IDs
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: string;
  views?: number;
  tags?: string[];
  shared_with?: string[]; // User IDs the collection is shared with
}

export const useCollections = () => {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch collections with real-time updates
  useEffect(() => {
    if (!user) {
      setCollections([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    // Create a query for real-time updates, including shared collections
    const q = query(
      collection(db, 'collections'),
      where('user_id', '==', user.uid),
      orderBy('updated_at', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const collectionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CollectionData[];
        
        setCollections(collectionsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching collections:', err);
        setError('Failed to fetch collections');
        setLoading(false);
        toast.error('Error loading collections');
      }
    );

    // Clean up listener
    return () => unsubscribe();
  }, [user]);

  // Get a single collection
  const getCollection = useCallback(async (collectionId: string) => {
    if (!user) return null;

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const collectionData = { id: docSnap.id, ...docSnap.data() } as CollectionData;
        
        // Check if user has access (owner or shared with)
        const hasAccess = collectionData.user_id === user.uid || 
                          collectionData.is_public ||
                          (collectionData.shared_with && collectionData.shared_with.includes(user.uid));
                          
        if (hasAccess) {
          // Increment view for non-owners viewing public collections
          if (collectionData.is_public && collectionData.user_id !== user.uid) {
            await updateDoc(docRef, {
              views: (collectionData.views || 0) + 1
            });
          }
          
          return collectionData;
        } else {
          throw new Error('Collection not found or access denied');
        }
      } else {
        throw new Error('Collection not found');
      }
    } catch (err) {
      console.error('Error fetching collection:', err);
      toast.error('Error loading collection');
      throw err;
    }
  }, [user]);

  // Create a new collection
  const createCollection = useCallback(async (
    name: string,
    icon: string,
    color: string,
    description: string = '',
    isPublic: boolean = false,
    initialPlaques: number[] = [],
    tags: string[] = []
  ) => {
    if (!user) throw new Error('You must be logged in to create a collection');

    try {
      const collectionData = {
        name,
        description,
        icon,
        color,
        is_favorite: false,
        is_public: isPublic,
        plaques: initialPlaques,
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        views: 0,
        tags
      };

      const docRef = await addDoc(collection(db, 'collections'), collectionData);
      
      toast.success('Collection created successfully');
      
      // Return the new collection with ID
      return {
        id: docRef.id,
        ...collectionData,
        created_at: new Date(),
        updated_at: new Date()
      } as unknown as CollectionData;
    } catch (err) {
      console.error('Error creating collection:', err);
      toast.error('Failed to create collection');
      throw err;
    }
  }, [user]);

  // Update a collection
  const updateCollection = useCallback(async (
    collectionId: string, 
    updates: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      isPublic?: boolean;
      tags?: string[];
    }
  ) => {
    if (!user) throw new Error('You must be logged in to update a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Verify ownership
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      const updateData: Record<string, any> = {
        updated_at: serverTimestamp()
      };

      // Add fields to update
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      await updateDoc(docRef, updateData);
      
      toast.success('Collection updated successfully');
      
      // Return updated collection
      const currentData = docSnap.data();
      return {
        id: collectionId,
        ...currentData,
        ...updateData,
        updated_at: new Date()
      } as unknown as CollectionData;
    } catch (err) {
      console.error('Error updating collection:', err);
      toast.error('Failed to update collection');
      throw err;
    }
  }, [user]);

  // Delete a collection
  const deleteCollection = useCallback(async (collectionId: string) => {
    if (!user) throw new Error('You must be logged in to delete a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Verify ownership
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      await deleteDoc(docRef);
      toast.success('Collection deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting collection:', err);
      toast.error('Failed to delete collection');
      throw err;
    }
  }, [user]);

  // Batch delete multiple collections
  const batchDeleteCollections = useCallback(async (collectionIds: string[]) => {
    if (!user) throw new Error('You must be logged in to delete collections');
    if (collectionIds.length === 0) return true;

    try {
      const batch = writeBatch(db);
      let unauthorized = false;

      // First verify ownership of all collections
      for (const id of collectionIds) {
        const docRef = doc(db, 'collections', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
          unauthorized = true;
          break;
        }

        batch.delete(docRef);
      }

      if (unauthorized) {
        throw new Error('One or more collections not found or access denied');
      }

      await batch.commit();
      toast.success(`${collectionIds.length} collections deleted successfully`);
      return true;
    } catch (err) {
      console.error('Error batch deleting collections:', err);
      toast.error('Failed to delete collections');
      throw err;
    }
  }, [user]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (collectionId: string) => {
    if (!user) throw new Error('You must be logged in to update a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Verify ownership
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      const currentData = docSnap.data();
      const newStatus = !currentData.is_favorite;
      
      await updateDoc(docRef, {
        is_favorite: newStatus,
        updated_at: serverTimestamp()
      });

      toast.success(newStatus ? 'Added to favorites' : 'Removed from favorites');
      
      return {
        id: collectionId,
        ...currentData,
        is_favorite: newStatus,
        updated_at: new Date()
      } as unknown as CollectionData;
    } catch (err) {
      console.error('Error toggling favorite status:', err);
      toast.error('Failed to update favorite status');
      throw err;
    }
  }, [user]);

  // Batch toggle favorite for multiple collections
  const batchToggleFavorite = useCallback(async (collectionIds: string[], status: boolean) => {
    if (!user) throw new Error('You must be logged in to update collections');
    if (collectionIds.length === 0) return true;

    try {
      const batch = writeBatch(db);
      let unauthorized = false;

      // First verify ownership of all collections
      for (const id of collectionIds) {
        const docRef = doc(db, 'collections', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
          unauthorized = true;
          break;
        }

        batch.update(docRef, {
          is_favorite: status,
          updated_at: serverTimestamp()
        });
      }

      if (unauthorized) {
        throw new Error('One or more collections not found or access denied');
      }

      await batch.commit();
      toast.success(`${collectionIds.length} collections ${status ? 'added to' : 'removed from'} favorites`);
      return true;
    } catch (err) {
      console.error('Error batch updating favorites:', err);
      toast.error('Failed to update collections');
      throw err;
    }
  }, [user]);

  // Add a plaque to a collection
  const addPlaqueToCollection = useCallback(async (collectionId: string, plaqueId: number) => {
    if (!user) throw new Error('You must be logged in to update a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Verify ownership
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      // Get current plaques array
      const currentData = docSnap.data();
      const currentPlaques = currentData.plaques || [];

      // Only add if not already in collection
      if (!currentPlaques.includes(plaqueId)) {
        await updateDoc(docRef, {
          plaques: arrayUnion(plaqueId),
          updated_at: serverTimestamp()
        });

        toast.success('Plaque added to collection');
      } else {
        toast.info('Plaque is already in this collection');
      }
      
      return getCollection(collectionId);
    } catch (err) {
      console.error('Error adding plaque to collection:', err);
      toast.error('Failed to add plaque to collection');
      throw err;
    }
  }, [user, getCollection]);

  // Add multiple plaques to a collection
  const addPlaquesToCollection = useCallback(async (collectionId: string, plaqueIds: number[]) => {
    if (!user) throw new Error('You must be logged in to update a collection');
    if (plaqueIds.length === 0) return getCollection(collectionId);

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Verify ownership
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      // Get current plaques array
      const currentData = docSnap.data();
      const currentPlaques = currentData.plaques || [];

      // Filter out already included plaques
      const newPlaques = plaqueIds.filter(id => !currentPlaques.includes(id));
      
      if (newPlaques.length > 0) {
        // Add all new plaques at once
        await updateDoc(docRef, {
          plaques: [...currentPlaques, ...newPlaques],
          updated_at: serverTimestamp()
        });

        toast.success(`${newPlaques.length} plaques added to collection`);
      } else {
        toast.info('All selected plaques are already in this collection');
      }
      
      return getCollection(collectionId);
    } catch (err) {
      console.error('Error adding plaques to collection:', err);
      toast.error('Failed to add plaques to collection');
      throw err;
    }
  }, [user, getCollection]);

  // Remove a plaque from a collection
  const removePlaqueFromCollection = useCallback(async (collectionId: string, plaqueId: number) => {
    if (!user) throw new Error('You must be logged in to update a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Verify ownership
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      await updateDoc(docRef, {
        plaques: arrayRemove(plaqueId),
        updated_at: serverTimestamp()
      });

      toast.success('Plaque removed from collection');
      
      return getCollection(collectionId);
    } catch (err) {
      console.error('Error removing plaque from collection:', err);
      toast.error('Failed to remove plaque from collection');
      throw err;
    }
  }, [user, getCollection]);

  // Remove multiple plaques from a collection
  const removePlaquesFromCollection = useCallback(async (collectionId: string, plaqueIds: number[]) => {
    if (!user) throw new Error('You must be logged in to update a collection');
    if (plaqueIds.length === 0) return getCollection(collectionId);

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Verify ownership
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      // Get current plaques array
      const currentData = docSnap.data();
      const currentPlaques = currentData.plaques || [];

      // Filter out plaques to remove
      const updatedPlaques = currentPlaques.filter(id => !plaqueIds.includes(id));
      
      await updateDoc(docRef, {
        plaques: updatedPlaques,
        updated_at: serverTimestamp()
      });

      toast.success(`${plaqueIds.length} plaques removed from collection`);
      
      return getCollection(collectionId);
    } catch (err) {
      console.error('Error removing plaques from collection:', err);
      toast.error('Failed to remove plaques from collection');
      throw err;
    }
  }, [user, getCollection]);

  // Share a collection with another user
  const shareCollection = useCallback(async (collectionId: string, targetUserId: string) => {
    if (!user) throw new Error('You must be logged in to share a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Verify ownership
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      await updateDoc(docRef, {
        shared_with: arrayUnion(targetUserId),
        updated_at: serverTimestamp()
      });

      toast.success('Collection shared successfully');
      return true;
    } catch (err) {
      console.error('Error sharing collection:', err);
      toast.error('Failed to share collection');
      throw err;
    }
  }, [user]);

  // Duplicate a collection
  const duplicateCollection = useCallback(async (collectionId: string, newName?: string) => {
    if (!user) throw new Error('You must be logged in to duplicate a collection');

    try {
      const sourceRef = doc(db, 'collections', collectionId);
      const sourceSnap = await getDoc(sourceRef);

      // Check if collection exists and user has access
      if (!sourceSnap.exists()) {
        throw new Error('Collection not found');
      }
      
      const sourceData = sourceSnap.data();
      const hasAccess = sourceData.user_id === user.uid || 
                        sourceData.is_public ||
                        (sourceData.shared_with && sourceData.shared_with.includes(user.uid));
                        
      if (!hasAccess) {
        throw new Error('Access denied to this collection');
      }

      // Create a new collection with the same data
      const duplicateData = {
        name: newName || `${sourceData.name} (Copy)`,
        description: sourceData.description || '',
        icon: sourceData.icon,
        color: sourceData.color,
        is_favorite: false, // Reset favorite status
        is_public: false, // Reset public status
        plaques: [...sourceData.plaques], // Copy plaques array
        user_id: user.uid, // Set new owner
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        views: 0,
        tags: sourceData.tags || []
      };

      const docRef = await addDoc(collection(db, 'collections'), duplicateData);
      
      toast.success('Collection duplicated successfully');
      
      // Return the new collection
      return {
        id: docRef.id,
        ...duplicateData,
        created_at: new Date(),
        updated_at: new Date()
      } as unknown as CollectionData;
    } catch (err) {
      console.error('Error duplicating collection:', err);
      toast.error('Failed to duplicate collection');
      throw err;
    }
  }, [user]);

  // Get public collections
  const getPublicCollections = useCallback(async (limit = 10) => {
    try {
      const q = query(
        collection(db, 'collections'),
        where('is_public', '==', true),
        orderBy('views', 'desc')
        // Add limit if needed: limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CollectionData[];
    } catch (err) {
      console.error('Error fetching public collections:', err);
      toast.error('Failed to load public collections');
      throw err;
    }
  }, []);

  return {
    collections,
    loading,
    error,
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    batchDeleteCollections,
    toggleFavorite,
    batchToggleFavorite,
    addPlaqueToCollection,
    addPlaquesToCollection,
    removePlaqueFromCollection,
    removePlaquesFromCollection,
    shareCollection,
    duplicateCollection,
    getPublicCollections
  };
};

export default useCollections;