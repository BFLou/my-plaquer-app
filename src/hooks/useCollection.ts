// src/hooks/useCollection.tsx
import { useState, useEffect } from 'react';
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
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CollectionData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_favorite: boolean;
  is_public: boolean;
  plaques: number[];
  created_at: any; // Firestore timestamp
  updated_at: any; // Firestore timestamp
  user_id: string;
}

export const useCollections = () => {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all collections for the current user
  const fetchCollections = async () => {
    if (!user) {
      setCollections([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'collections'),
        where('user_id', '==', user.uid),
        orderBy('updated_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const collectionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CollectionData[];

      setCollections(collectionsData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching collections:', err);
      setError('Failed to fetch collections');
      setLoading(false);
      toast.error('Error loading collections');
    }
  };

  // Get a single collection by ID
  const getCollection = async (collectionId: string) => {
    if (!user) return null;

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().user_id === user.uid) {
        return { id: docSnap.id, ...docSnap.data() } as CollectionData;
      } else {
        throw new Error('Collection not found or access denied');
      }
    } catch (err) {
      console.error('Error fetching collection:', err);
      toast.error('Error loading collection');
      throw err;
    }
  };

  // Create a new collection
  const createCollection = async (data: Omit<CollectionData, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('You must be logged in to create a collection');

    try {
      const collectionData = {
        ...data,
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'collections'), collectionData);
      
      toast.success('Collection created');
      
      // Return the new collection with ID
      return {
        id: docRef.id,
        ...collectionData,
      } as CollectionData;
    } catch (err) {
      console.error('Error creating collection:', err);
      toast.error('Failed to create collection');
      throw err;
    }
  };

  // Update an existing collection
  const updateCollection = async (collectionId: string, data: Partial<Omit<CollectionData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('You must be logged in to update a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Check if collection exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      // Update with timestamp
      const updateData = {
        ...data,
        updated_at: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      toast.success('Collection updated');
      
      // Return the updated collection
      return {
        id: collectionId,
        ...(docSnap.data() as DocumentData),
        ...data,
        updated_at: new Date() // Use client-side date for immediate UI update
      } as CollectionData;
    } catch (err) {
      console.error('Error updating collection:', err);
      toast.error('Failed to update collection');
      throw err;
    }
  };

  // Delete a collection
  const deleteCollection = async (collectionId: string) => {
    if (!user) throw new Error('You must be logged in to delete a collection');

    try {
      const docRef = doc(db, 'collections', collectionId);
      const docSnap = await getDoc(docRef);

      // Check if collection exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Collection not found or access denied');
      }

      await deleteDoc(docRef);
      toast.success('Collection deleted');
      return true;
    } catch (err) {
      console.error('Error deleting collection:', err);
      toast.error('Failed to delete collection');
      throw err;
    }
  };

  // Add a plaque to a collection
  const addPlaqueToCollection = async (collectionId: string, plaqueId: number) => {
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
        const updatedPlaques = [...currentPlaques, plaqueId];
        
        await updateDoc(docRef, {
          plaques: updatedPlaques,
          updated_at: serverTimestamp()
        });

        toast.success('Plaque added to collection');
        
        return {
          id: collectionId,
          ...currentData,
          plaques: updatedPlaques,
          updated_at: new Date() // Use client-side date for immediate UI update
        } as CollectionData;
      }
      
      // Return unchanged if plaque already in collection
      return {
        id: collectionId,
        ...currentData
      } as CollectionData;
    } catch (err) {
      console.error('Error adding plaque to collection:', err);
      toast.error('Failed to add plaque to collection');
      throw err;
    }
  };

  // Remove a plaque from a collection
  const removePlaqueFromCollection = async (collectionId: string, plaqueId: number) => {
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

      // Remove the plaque
      const updatedPlaques = currentPlaques.filter((id: number) => id !== plaqueId);
      
      await updateDoc(docRef, {
        plaques: updatedPlaques,
        updated_at: serverTimestamp()
      });

      toast.success('Plaque removed from collection');
      
      return {
        id: collectionId,
        ...currentData,
        plaques: updatedPlaques,
        updated_at: new Date() // Use client-side date for immediate UI update
      } as CollectionData;
    } catch (err) {
      console.error('Error removing plaque from collection:', err);
      toast.error('Failed to remove plaque from collection');
      throw err;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (collectionId: string) => {
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
      } as CollectionData;
    } catch (err) {
      console.error('Error toggling favorite status:', err);
      toast.error('Failed to update favorite status');
      throw err;
    }
  };

  // Load collections on component mount or when user changes
  useEffect(() => {
    fetchCollections();
  }, [user]);

  return {
    collections,
    loading,
    error,
    fetchCollections,
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addPlaqueToCollection,
    removePlaqueFromCollection,
    toggleFavorite
  };
};