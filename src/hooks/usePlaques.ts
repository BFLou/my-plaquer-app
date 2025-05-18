// src/hooks/usePlaques.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plaque } from '@/types/plaque';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';

/**
 * A custom hook to fetch and manage plaque data
 */
export const usePlaques = () => {
  const [plaques, setPlaques] = useState<Plaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all plaques from Firestore
  const fetchPlaques = async () => {
    setLoading(true);
    setError(null);

    try {
      // For now we'll use the imported sample data
      // In a real app, this would fetch from Firestore:

      /* 
      const q = query(
        collection(db, 'plaques'),
        orderBy('id', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const plaquesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plaque[];

      setPlaques(plaquesData);
      */

      // For demo purposes, import and use the sample data
      // You should replace this with the actual Firestore fetch in production
      const { default: plaqueData } = await import('../data/plaque_data.json');
      const adaptedData = adaptPlaquesData(plaqueData);
      
      setPlaques(adaptedData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching plaques:', err);
      setError(err.message || 'Failed to fetch plaques');
      setLoading(false);
    }
  };

  // Fetch plaques that are not in a specific collection
  const fetchAvailablePlaques = async (collectionPlaqueIds: number[]) => {
    setLoading(true);
    setError(null);

    try {
      // In a real app with Firestore:
      /*
      const q = query(
        collection(db, 'plaques'),
        where('id', 'not-in', collectionPlaqueIds),
        orderBy('id', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const plaquesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plaque[];

      return plaquesData;
      */

      // For demo purposes, filter the already fetched plaques
      // You should replace this with actual Firestore query in production
      if (plaques.length === 0) {
        await fetchPlaques();
      }
      
      const availablePlaques = plaques.filter(
        plaque => !collectionPlaqueIds.includes(plaque.id)
      );
      
      return availablePlaques;
    } catch (err: any) {
      console.error('Error fetching available plaques:', err);
      setError(err.message || 'Failed to fetch available plaques');
      setLoading(false);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load plaques on initial mount
  useEffect(() => {
    fetchPlaques();
  }, []);

  return { 
    plaques, 
    loading, 
    error, 
    fetchPlaques,
    fetchAvailablePlaques
  };
};

export default usePlaques;