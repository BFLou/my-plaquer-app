// src/hooks/useVisitedPlaques.tsx
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

interface VisitData {
  id: string;
  plaque_id: number;
  user_id: string;
  visited_at: Timestamp;
  notes?: string;
}

export const useVisitedPlaques = () => {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all visited plaques for the current user with real-time updates
  useEffect(() => {
    if (!user) {
      setVisits([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    // Create a query for real-time updates
    const q = query(
      collection(db, 'visited_plaques'),
      where('user_id', '==', user.uid),
      orderBy('visited_at', 'desc')
    );

    // Set up a listener for real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const visitsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VisitData[];
        
        setVisits(visitsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching visited plaques:', err);
        setError('Failed to fetch visited plaques');
        setLoading(false);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [user]);

  // Get unique plaque IDs that have been visited
  const getVisitedPlaqueIds = useCallback((): number[] => {
    const uniqueIds = new Set<number>();
    visits.forEach(visit => uniqueIds.add(visit.plaque_id));
    return Array.from(uniqueIds);
  }, [visits]);

  // Check if a plaque has been visited
  const isPlaqueVisited = useCallback((plaqueId: number): boolean => {
    return visits.some(visit => visit.plaque_id === plaqueId);
  }, [visits]);

  // Get visit information for a specific plaque
  const getVisitInfo = useCallback((plaqueId: number): VisitData | null => {
    const visit = visits.find(visit => visit.plaque_id === plaqueId);
    return visit || null;
  }, [visits]);

  // Mark a plaque as visited with a date
  const markAsVisited = useCallback(async (
    plaqueId: number, 
    data?: {
      notes?: string;
      visitedAt?: string; // ISO string date
    }
  ) => {
    if (!user) throw new Error('You must be logged in to mark plaques as visited');

    try {
      // Check if plaque is already visited
      if (isPlaqueVisited(plaqueId)) {
        console.log('This plaque has already been visited');
        return null;
      }

      // Prepare the visit data
      const visitData: any = {
        plaque_id: plaqueId,
        user_id: user.uid,
        notes: data?.notes || ''
      };

      // Use custom date if provided, otherwise use current date
      if (data?.visitedAt) {
        visitData.visited_at = Timestamp.fromDate(new Date(data.visitedAt));
      } else {
        visitData.visited_at = serverTimestamp();
      }

      const docRef = await addDoc(collection(db, 'visited_plaques'), visitData);
      
      console.log('Marked as visited successfully');
      
      // Return the new visit with ID
      return {
        id: docRef.id,
        ...visitData,
        visited_at: visitData.visited_at instanceof Timestamp 
          ? visitData.visited_at 
          : new Date() // Fallback for serverTimestamp
      } as unknown as VisitData;
    } catch (err) {
      console.error('Error marking plaque as visited:', err);
      throw err;
    }
  }, [user, isPlaqueVisited]);

  // Update visit details
  const updateVisit = useCallback(async (
    visitId: string, 
    data: {
      notes?: string;
      visitedAt?: string; // ISO string date
    }
  ) => {
    if (!user) throw new Error('You must be logged in to update visit details');

    try {
      const docRef = doc(db, 'visited_plaques', visitId);
      const docSnap = await getDoc(docRef);

      // Check if visit exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Visit not found or access denied');
      }

      // Prepare update data
      const updateData: any = {};
      
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }
      
      if (data.visitedAt) {
        updateData.visited_at = Timestamp.fromDate(new Date(data.visitedAt));
      }

      await updateDoc(docRef, updateData);
      
      console.log('Visit updated successfully');
      
      // Return the updated visit
      const updatedVisit = {
        id: visitId,
        ...docSnap.data(),
        ...updateData
      } as unknown as VisitData;

      return updatedVisit;
    } catch (err) {
      console.error('Error updating visit details:', err);
      throw err;
    }
  }, [user]);

  // Remove a visit
  const removeVisit = useCallback(async (visitId: string) => {
    if (!user) throw new Error('You must be logged in to remove a visit');

    try {
      const docRef = doc(db, 'visited_plaques', visitId);
      const docSnap = await getDoc(docRef);

      // Check if visit exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Visit not found or access denied');
      }

      await deleteDoc(docRef);
      console.log('Visit removed successfully');
      return true;
    } catch (err) {
      console.error('Error removing visit:', err);
      throw err;
    }
  }, [user]);

  return {
    visits,
    loading,
    error,
    getVisitedPlaqueIds,
    isPlaqueVisited,
    getVisitInfo,
    markAsVisited,
    updateVisit,
    removeVisit
  };
};

export default useVisitedPlaques;