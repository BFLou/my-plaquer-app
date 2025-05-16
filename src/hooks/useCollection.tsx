// src/hooks/useCollections.tsx
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
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CollectionData {
  id: string;
  name: string;
  description: string;
  icon: string; // For storing emoji or icon name
  color: string;
  is_favorite: boolean;
  is_public: boolean;
  plaques: number[]; // Array of plaque IDs
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: string;
  views?: number;
  tags?: string[];
}

export const useCollections = () => {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all collections for the current user with real-time updates
  useEffect(() => {
    if (!user) {
      setCollections([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    // Create a query for real-time updates
    const q = query(
      collection(db, 'collections'),
      where('user_id', '==', user.uid),
      orderBy('updated_at', 'desc')
    );

    // Set up a listener for real-time updates
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

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [user]);

  // Get a single collection by ID
  const getCollection = useCallback(async (collectionId: string) => {
    if (!user) return null;

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const collectionData = { id: docSnap.id, ...docSnap.data() } as CollectionData;
        
        // Check if the collection is public or belongs to the user
        if (collectionData.user_id === user.uid || collectionData.is_public) {
          // Increment view count if viewing someone else's public collection
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
        is_favorite: false, // Default not favorite
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
        created_at: new Date(), // Use client-side date for immediate UI update
        updated_at: new Date()
      } as unknown as CollectionData;
    } catch (err) {
      console.error('Error creating collection:', err);
      toast.error('Failed to create collection');
      throw err;
    }
  }, [user]);

  // Update an existing collection
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

      // Check if collection exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      const updateData: Record<string, any> = {
        updated_at: serverTimestamp()
      };

      // Add fields to update if provided
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      await updateDoc(docRef, updateData);
      
      toast.success('Collection updated successfully');
      
      // Return the updated collection
      const currentData = docSnap.data();
      return {
        id: collectionId,
        ...currentData,
        ...updateData,
        updated_at: new Date() // Use client-side date for immediate UI update
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

      // Check if collection exists and belongs to user
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

  // Toggle favorite status
  const toggleFavorite = useCallback(async (collectionId: string) => {
    if (!user) throw new Error('You must be logged in to update a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Check if collection exists and belongs to user
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

  // Add a plaque to a collection
  const addPlaqueToCollection = useCallback(async (collectionId: string, plaqueId: number) => {
    if (!user) throw new Error('You must be logged in to update a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Check if collection exists and belongs to user
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

  // Remove a plaque from a collection
  const removePlaqueFromCollection = useCallback(async (collectionId: string, plaqueId: number) => {
    if (!user) throw new Error('You must be logged in to update a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Check if collection exists and belongs to user
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

  // Get public collections
  const getPublicCollections = useCallback(async (limit = 10) => {
    try {
      const q = query(
        collection(db, 'collections'),
        where('is_public', '==', true),
        orderBy('views', 'desc'),
        // limit(limit)
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
    toggleFavorite,
    addPlaqueToCollection,
    removePlaqueFromCollection,
    getPublicCollections
  };
};

export default useCollections;