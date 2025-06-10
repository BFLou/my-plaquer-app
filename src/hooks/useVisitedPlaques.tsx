// NEW: Replace useVisitedPlaques.tsx with this simplified version

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

interface VisitData {
  id: string;
  plaque_id: number;
  user_id: string;
  visited_at: Date; // Always use Date objects internally
  notes?: string;
}

export const useVisitedPlaques = () => {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load visits once on mount - NO real-time listener
  const loadVisits = useCallback(async () => {
    if (!user) {
      setVisits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const q = query(
        collection(db, 'visited_plaques'),
        where('user_id', '==', user.uid),
        orderBy('visited_at', 'desc')
      );

      const snapshot = await getDocs(q);
      const visitsData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore timestamp to Date immediately
        let visitDate: Date;
        if (data.visited_at?.toDate) {
          visitDate = data.visited_at.toDate();
        } else if (data.visited_at instanceof Date) {
          visitDate = data.visited_at;
        } else {
          visitDate = new Date(data.visited_at);
        }

        return {
          id: doc.id,
          plaque_id: data.plaque_id,
          user_id: data.user_id,
          visited_at: visitDate, // Always Date object
          notes: data.notes || ''
        };
      });
      
      setVisits(visitsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading visits:', err);
      setError('Failed to load visits');
      setLoading(false);
    }
  }, [user]);

  // Load on mount and when user changes
  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // Check if plaque is visited
  const isPlaqueVisited = useCallback((plaqueId: number): boolean => {
    return visits.some(visit => visit.plaque_id === plaqueId);
  }, [visits]);

  // Get visit info
  const getVisitInfo = useCallback((plaqueId: number): VisitData | null => {
    return visits.find(visit => visit.plaque_id === plaqueId) || null;
  }, [visits]);

  // MAIN FUNCTION: Mark as visited with immediate state update
  const markAsVisited = useCallback(async (
    plaqueId: number, 
    data: {
      notes?: string;
      visitedAt?: string; // ISO string
    } = {}
  ) => {
    if (!user) throw new Error('You must be logged in to mark plaques as visited');

    // Check if already visited
    if (isPlaqueVisited(plaqueId)) {
      console.log('Plaque already visited');
      return null;
    }

    try {
      // Parse the visit date - DEFAULT TO TODAY if not provided
      const visitDate = data.visitedAt ? new Date(data.visitedAt) : new Date();
      
      console.log('🎯 markAsVisited - Selected date:', {
        input: data.visitedAt,
        parsed: visitDate,
        formatted: visitDate.toLocaleDateString('en-GB')
      });

      // Create visit data for Firestore
      const firestoreData = {
        plaque_id: plaqueId,
        user_id: user.uid,
        visited_at: Timestamp.fromDate(visitDate), // Convert to Firestore timestamp
        notes: data.notes || ''
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'visited_plaques'), firestoreData);
      
      // Create local visit object with Date
      const newVisit: VisitData = {
        id: docRef.id,
        plaque_id: plaqueId,
        user_id: user.uid,
        visited_at: visitDate, // Keep as Date object
        notes: data.notes || ''
      };

      // IMMEDIATELY update local state - no waiting for listeners
      setVisits(prev => [newVisit, ...prev]);
      
      console.log('✅ Visit saved and state updated:', {
        plaqueId,
        visitDate: visitDate.toLocaleDateString('en-GB'),
        docId: docRef.id
      });

      return newVisit;
    } catch (err) {
      console.error('❌ Error marking as visited:', err);
      throw err;
    }
  }, [user, isPlaqueVisited]);

  // Update visit
  const updateVisit = useCallback(async (
    visitId: string, 
    data: {
      notes?: string;
      visitedAt?: string;
    }
  ) => {
    if (!user) throw new Error('You must be logged in to update visits');

    try {
      const updateData: any = {};
      
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }
      
      if (data.visitedAt) {
        const newDate = new Date(data.visitedAt);
        updateData.visited_at = Timestamp.fromDate(newDate);
        
        // Update local state immediately
        setVisits(prev => prev.map(visit => 
          visit.id === visitId 
            ? { ...visit, visited_at: newDate, notes: data.notes || visit.notes }
            : visit
        ));
      }

      // Update in Firestore
      const docRef = doc(db, 'visited_plaques', visitId);
      await updateDoc(docRef, updateData);
      
      return true;
    } catch (err) {
      console.error('Error updating visit:', err);
      throw err;
    }
  }, [user]);

  // Remove visit
  const removeVisit = useCallback(async (visitId: string) => {
    if (!user) throw new Error('You must be logged in to remove visits');

    try {
      // Remove from Firestore
      await deleteDoc(doc(db, 'visited_plaques', visitId));
      
      // Update local state immediately
      setVisits(prev => prev.filter(visit => visit.id !== visitId));
      
      return true;
    } catch (err) {
      console.error('Error removing visit:', err);
      throw err;
    }
  }, [user]);

  // Refresh visits manually if needed
  const refreshVisits = useCallback(() => {
    loadVisits();
  }, [loadVisits]);

  return {
    visits,
    loading,
    error,
    isPlaqueVisited,
    getVisitInfo,
    markAsVisited,
    updateVisit,
    removeVisit,
    refreshVisits
  };
};

export default useVisitedPlaques;