// src/hooks/useFavorites.tsx

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch user favorites from Firebase
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    // Create a query to get user's favorite plaques
    const q = query(
      collection(db, 'user_favorites'),
      where('user_id', '==', user.uid)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const favoritesData = snapshot.docs.map(doc => {
          // Each doc has a plaque_id field
          return doc.data().plaque_id;
        });
        
        setFavorites(favoritesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching favorites:', err);
        setLoading(false);
      }
    );

    // Clean up listener
    return () => unsubscribe();
  }, [user]);

  // Check if a plaque is favorited
  const isFavorite = useCallback((plaqueId: number): boolean => {
    return favorites.includes(plaqueId);
  }, [favorites]);

  // Add a plaque to favorites
  const addToFavorites = useCallback(async (plaqueId: number) => {
    if (!user) {
      toast.error("Please sign in to add favorites");
      return false;
    }

    try {
      // Create a unique document ID for this favorite
      const favoriteId = `${user.uid}_${plaqueId}`;
      const docRef = doc(db, 'user_favorites', favoriteId);
      
      // Set the data
      await setDoc(docRef, {
        user_id: user.uid,
        plaque_id: plaqueId,
        created_at: serverTimestamp()
      });
      
      toast.success("Added to favorites");
      return true;
    } catch (err) {
      console.error('Error adding to favorites:', err);
      toast.error("Failed to add to favorites");
      return false;
    }
  }, [user]);

  // Remove a plaque from favorites
  const removeFromFavorites = useCallback(async (plaqueId: number) => {
    if (!user) return false;

    try {
      // Create the same unique document ID
      const favoriteId = `${user.uid}_${plaqueId}`;
      const docRef = doc(db, 'user_favorites', favoriteId);
      
      // Delete the document
      await deleteDoc(docRef);
      
      toast.success("Removed from favorites");
      return true;
    } catch (err) {
      console.error('Error removing from favorites:', err);
      toast.error("Failed to remove from favorites");
      return false;
    }
  }, [user]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (plaqueId: number) => {
    if (isFavorite(plaqueId)) {
      return removeFromFavorites(plaqueId);
    } else {
      return addToFavorites(plaqueId);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  return {
    favorites,
    loading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite
  };
};

export default useFavorites;