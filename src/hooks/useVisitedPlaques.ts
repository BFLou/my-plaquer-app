// src/hooks/useVisitedPlaques.tsx
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface VisitData {
  id: string;
  plaque_id: number;
  user_id: string;
  visited_at: any; // Firestore timestamp
  notes?: string;
  photo_url?: string;
  location?: {
    latitude: number;
    longitude: number;
  }
}

export const useVisitedPlaques = () => {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all visited plaques for the current user
  const fetchVisits = async () => {
    if (!user) {
      setVisits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'visited_plaques'),
        where('user_id', '==', user.uid),
        orderBy('visited_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const visitsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VisitData[];

      setVisits(visitsData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching visited plaques:', err);
      setError('Failed to fetch visited plaques');
      setLoading(false);
      toast.error('Error loading visited plaques');
    }
  };

  // Get unique plaque IDs that have been visited
  const getVisitedPlaqueIds = (): number[] => {
    const uniqueIds = new Set<number>();
    visits.forEach(visit => uniqueIds.add(visit.plaque_id));
    return Array.from(uniqueIds);
  };

  // Check if a plaque has been visited
  const isPlaqueVisited = (plaqueId: number): boolean => {
    return visits.some(visit => visit.plaque_id === plaqueId);
  };

  // Mark a plaque as visited
  const markAsVisited = async (plaqueId: number, data?: Omit<VisitData, 'id' | 'user_id' | 'plaque_id' | 'visited_at'>) => {
    if (!user) throw new Error('You must be logged in to mark plaques as visited');

    try {
      const visitData = {
        plaque_id: plaqueId,
        user_id: user.uid,
        visited_at: serverTimestamp(),
        ...data
      };

      const docRef = await addDoc(collection(db, 'visited_plaques'), visitData);
      
      toast.success('Marked as visited');
      
      // Return the new visit with ID
      return {
        id: docRef.id,
        ...visitData,
        visited_at: new Date() // Use client-side date for immediate UI update
      } as VisitData;
    } catch (err) {
      console.error('Error marking plaque as visited:', err);
      toast.error('Failed to mark as visited');
      throw err;
    }
  };

  // Update visit details
  const updateVisit = async (visitId: string, data: Partial<Omit<VisitData, 'id' | 'user_id' | 'plaque_id'>>) => {
    if (!user) throw new Error('You must be logged in to update visit details');

    try {
      const docRef = doc(db, 'visited_plaques', visitId);
      const docSnap = await getDoc(docRef);

      // Check if visit exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Visit not found or access denied');
      }

      await updateDoc(docRef, data);
      
      toast.success('Visit updated');
      
      // Return the updated visit
      const updatedVisit = {
        id: visitId,
        ...docSnap.data(),
        ...data
      } as VisitData;

      return updatedVisit;
    } catch (err) {
      console.error('Error updating visit details:', err);
      toast.error('Failed to update visit');
      throw err;
    }
  };

  // Remove a visit
  const removeVisit = async (visitId: string) => {
    if (!user) throw new Error('You must be logged in to remove a visit');

    try {
      const docRef = doc(db, 'visited_plaques', visitId);
      const docSnap = await getDoc(docRef);

      // Check if visit exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Visit not found or access denied');
      }

      await deleteDoc(docRef);
      toast.success('Visit removed');
      return true;
    } catch (err) {
      console.error('Error removing visit:', err);
      toast.error('Failed to remove visit');
      throw err;
    }
  };

  // Load visits on component mount or when user changes
  useEffect(() => {
    fetchVisits();
  }, [user]);

  return {
    visits,
    loading,
    error,
    fetchVisits,
    getVisitedPlaqueIds,
    isPlaqueVisited,
    markAsVisited,
    updateVisit,
    removeVisit
  };
};