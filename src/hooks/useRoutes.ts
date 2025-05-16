// src/hooks/useRoutes.tsx
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

interface RoutePoint {
  plaque_id: number;
  order: number;
}

interface RouteData {
  id: string;
  name: string;
  description?: string;
  points: RoutePoint[];
  total_distance: number;
  created_at: any; // Firestore timestamp
  updated_at: any; // Firestore timestamp
  user_id: string;
}

export const useRoutes = () => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all routes for the current user
  const fetchRoutes = async () => {
    if (!user) {
      setRoutes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'routes'),
        where('user_id', '==', user.uid),
        orderBy('updated_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const routesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RouteData[];

      setRoutes(routesData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching routes:', err);
      setError('Failed to fetch routes');
      setLoading(false);
      toast.error('Error loading routes');
    }
  };

  // Get a single route by ID
  const getRoute = async (routeId: string) => {
    if (!user) return null;

    try {
      const docRef = doc(db, 'routes', routeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().user_id === user.uid) {
        return { id: docSnap.id, ...docSnap.data() } as RouteData;
      } else {
        throw new Error('Route not found or access denied');
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      toast.error('Error loading route');
      throw err;
    }
  };

  // Create a new route
  const createRoute = async (data: Omit<RouteData, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('You must be logged in to create a route');

    try {
      const routeData = {
        ...data,
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'routes'), routeData);
      
      toast.success('Route saved');
      
      // Return the new route with ID
      return {
        id: docRef.id,
        ...routeData,
        created_at: new Date(), // Use client-side date for immediate UI update
        updated_at: new Date()
      } as RouteData;
    } catch (err) {
      console.error('Error creating route:', err);
      toast.error('Failed to save route');
      throw err;
    }
  };

  // Update an existing route
  const updateRoute = async (routeId: string, data: Partial<Omit<RouteData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('You must be logged in to update a route');

    try {
      const docRef = doc(db, 'routes', routeId);
      const docSnap = await getDoc(docRef);

      // Check if route exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Route not found or access denied');
      }

      // Update with timestamp
      const updateData = {
        ...data,
        updated_at: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      toast.success('Route updated');
      
      // Return the updated route
      return {
        id: routeId,
        ...docSnap.data(),
        ...data,
        updated_at: new Date() // Use client-side date for immediate UI update
      } as RouteData;
    } catch (err) {
      console.error('Error updating route:', err);
      toast.error('Failed to update route');
      throw err;
    }
  };

  // Delete a route
  const deleteRoute = async (routeId: string) => {
    if (!user) throw new Error('You must be logged in to delete a route');

    try {
      const docRef = doc(db, 'routes', routeId);
      const docSnap = await getDoc(docRef);

      // Check if route exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Route not found or access denied');
      }

      await deleteDoc(docRef);
      toast.success('Route deleted');
      return true;
    } catch (err) {
      console.error('Error deleting route:', err);
      toast.error('Failed to delete route');
      throw err;
    }
  };

  // Load routes on component mount or when user changes
  useEffect(() => {
    fetchRoutes();
  }, [user]);

  return {
    routes,
    loading,
    error,
    fetchRoutes,
    getRoute,
    createRoute,
    updateRoute,
    deleteRoute
  };
};