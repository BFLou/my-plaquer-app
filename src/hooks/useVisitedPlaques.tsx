// src/hooks/useVisitedPlaques.tsx
// Updated version with support for custom visit dates
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
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface VisitData {
  id: string;
  plaque_id: number;
  user_id: string;
  visited_at: Timestamp;
  notes?: string;
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  // Achievement system
  achievement?: string;
  rating?: number;
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
        toast.error('Error loading visited plaques');
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

  // Mark a plaque as visited - with support for custom visit date
  const markAsVisited = useCallback(async (
    plaqueId: number, 
    data?: {
      notes?: string;
      photos?: string[];
      location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
      };
      visitedAt?: string; // ISO string date for custom visit date
      rating?: number;
      achievement?: string;
    }
  ) => {
    if (!user) throw new Error('You must be logged in to mark plaques as visited');

    try {
      // Check if plaque is already visited to prevent duplicates
      if (isPlaqueVisited(plaqueId)) {
        toast.info('You have already visited this plaque');
        return null;
      }

      // Prepare the visit data
      const visitData: any = {
        plaque_id: plaqueId,
        user_id: user.uid,
        notes: data?.notes || '',
        photos: data?.photos || [],
        rating: data?.rating || 0
      };

      // Handle custom visit date if provided, otherwise use serverTimestamp
      if (data?.visitedAt) {
        // Convert ISO string to Firestore Timestamp
        visitData.visited_at = Timestamp.fromDate(new Date(data.visitedAt));
      } else {
        visitData.visited_at = serverTimestamp();
      }

      // Add location data if provided
      if (data?.location) {
        visitData.location = data.location;
      }

      // Add achievement if provided
      if (data?.achievement) {
        visitData.achievement = data.achievement;
      }

      const docRef = await addDoc(collection(db, 'visited_plaques'), visitData);
      
      toast.success('Marked as visited');
      
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
      toast.error('Failed to mark as visited');
      throw err;
    }
  }, [user, isPlaqueVisited]);

  // Update visit details - with support for updating the visit date
  const updateVisit = useCallback(async (
    visitId: string, 
    data: Partial<Omit<VisitData, 'id' | 'user_id' | 'plaque_id'>> & { visitedAt?: string }
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
      
      // Copy all fields except special handling for visited_at
      Object.keys(data).forEach(key => {
        if (key !== 'visitedAt') {
          updateData[key] = data[key as keyof typeof data];
        }
      });
      
      // Special handling for visited_at if provided as ISO string
      if (data.visitedAt) {
        updateData.visited_at = Timestamp.fromDate(new Date(data.visitedAt));
      }

      await updateDoc(docRef, updateData);
      
      toast.success('Visit updated');
      
      // Return the updated visit
      const updatedVisit = {
        id: visitId,
        ...docSnap.data(),
        ...updateData
      } as unknown as VisitData;

      return updatedVisit;
    } catch (err) {
      console.error('Error updating visit details:', err);
      toast.error('Failed to update visit');
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
      toast.success('Visit removed');
      return true;
    } catch (err) {
      console.error('Error removing visit:', err);
      toast.error('Failed to remove visit');
      throw err;
    }
  }, [user]);

  // Get visit statistics - aggregate numbers for analytics
  const getVisitStats = useCallback(() => {
    const visitedPlaqueIds = getVisitedPlaqueIds();
    
    // Calculate visit streak
    const calculateStreak = () => {
      if (visits.length === 0) return 0;
      
      // This is a simplified version - a real implementation would be more complex
      // and check for consecutive days
      const visitDates = visits.map(v => {
        const date = v.visited_at instanceof Timestamp 
          ? v.visited_at.toDate() 
          : new Date(v.visited_at);
        
        // Reset to start of day for comparison
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      });
      
      // Sort dates descending
      visitDates.sort((a, b) => b - a);
      
      // Get unique dates (using Set)
      const uniqueDates = Array.from(new Set(visitDates));
      
      // Check for consecutive days
      let streak = 1;
      let currentDate = new Date(uniqueDates[0]);
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const nextDate = new Date(uniqueDates[i]);
        const expectedPrevDay = new Date(currentDate);
        expectedPrevDay.setDate(expectedPrevDay.getDate() - 1);
        
        if (nextDate.getTime() === expectedPrevDay.getTime()) {
          streak++;
          currentDate = nextDate;
        } else {
          break; // Streak broken
        }
      }
      
      return streak;
    };
    
    // Group visits by month
    const getVisitsByMonth = () => {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      
      // Initialize month data
      const months = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(sixMonthsAgo);
        date.setMonth(date.getMonth() + i);
        months.push({
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          count: 0
        });
      }
      
      // Count visits per month
      visits.forEach(visit => {
        const visitDate = visit.visited_at instanceof Timestamp 
          ? visit.visited_at.toDate() 
          : new Date(visit.visited_at);
        
        if (visitDate >= sixMonthsAgo) {
          const monthDiff = (
            (visitDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12 +
            (visitDate.getMonth() - sixMonthsAgo.getMonth())
          );
          
          if (monthDiff >= 0 && monthDiff < 6) {
            months[monthDiff].count++;
          }
        }
      });
      
      return months;
    };
    
    return {
      totalVisits: visits.length,
      uniquePlaquesVisited: visitedPlaqueIds.length,
      visitStreak: calculateStreak(),
      visitsByMonth: getVisitsByMonth()
    };
  }, [visits, getVisitedPlaqueIds]);

  return {
    visits,
    loading,
    error,
    getVisitedPlaqueIds,
    isPlaqueVisited,
    getVisitInfo,
    markAsVisited,
    updateVisit,
    removeVisit,
    getVisitStats
  };
};

export default useVisitedPlaques;