// src/hooks/useRoutes.tsx - Simplified to match Firebase rules
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
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';

interface RoutePoint {
  plaque_id: number;
  title: string;
  lat: number;
  lng: number;
  order: number;
}

export interface RouteData {
  id: string;
  name: string;
  description?: string;
  points: RoutePoint[];
  total_distance: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: string;
  is_public?: boolean;
  views?: number;
}

export const useRoutes = () => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all routes for the current user with real-time updates
  useEffect(() => {
    if (!user) {
      setRoutes([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);

    // Create a query for real-time updates
    const q = query(
      collection(db, 'routes'),
      where('user_id', '==', user.uid),
      orderBy('updated_at', 'desc')
    );

    // Set up a listener for real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const routesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RouteData[];
        
        setRoutes(routesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching routes:', err);
        setError('Failed to fetch routes');
        setLoading(false);
        toast.error('Error loading routes');
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [user]);

  // Get a single route by ID
  const getRoute = useCallback(async (routeId: string) => {
    if (!user) return null;

    try {
      const docRef = doc(db, 'routes', routeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const routeData = { id: docSnap.id, ...docSnap.data() } as RouteData;
        
        // Check if the route is public or belongs to the user
        if (routeData.user_id === user.uid || routeData.is_public) {
          // Increment view count if viewing someone else's public route
          if (routeData.is_public && routeData.user_id !== user.uid) {
            await updateDoc(docRef, {
              views: (routeData.views || 0) + 1
            });
          }
          
          return routeData;
        } else {
          throw new Error('Route not found or access denied');
        }
      } else {
        throw new Error('Route not found');
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      toast.error('Error loading route');
      throw err;
    }
  }, [user]);

  // Create a new route - simplified to match Firebase rules
  const createRoute = useCallback(async (
    name: string,
    description: string,
    points: Plaque[],
    totalDistance: number,
    isPublic: boolean = false
  ) => {
    if (!user) throw new Error('You must be logged in to create a route');
    if (points.length < 2) throw new Error('A route must have at least 2 points');

    try {
      // Format points for storage
      const routePoints = points.map((point, index) => ({
        plaque_id: point.id,
        title: point.title || 'Unnamed Point',
        lat: parseFloat(point.latitude as unknown as string),
        lng: parseFloat(point.longitude as unknown as string),
        order: index
      }));

      const routeData = {
        name,
        description: description || '',
        points: routePoints,
        total_distance: totalDistance,
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        is_public: !!isPublic,
        views: 0
      };

      const docRef = await addDoc(collection(db, 'routes'), routeData);
      
      toast.success('Route saved successfully');
      
      // Return the new route with ID
      return {
        id: docRef.id,
        ...routeData,
        created_at: new Date(), // Use client-side date for immediate UI update
        updated_at: new Date()
      } as unknown as RouteData;
    } catch (err) {
      console.error('Error creating route:', err);
      toast.error('Failed to save route');
      throw err;
    }
  }, [user]);

  // Update an existing route
  const updateRoute = useCallback(async (
    routeId: string, 
    updates: {
      name?: string;
      description?: string;
      points?: Plaque[];
      totalDistance?: number;
      isPublic?: boolean;
    }
  ) => {
    if (!user) throw new Error('You must be logged in to update a route');

    try {
      const docRef = doc(db, 'routes', routeId);
      const docSnap = await getDoc(docRef);

      // Check if route exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Route not found or access denied');
      }

      const updateData: Record<string, any> = {
        updated_at: serverTimestamp()
      };

      // Add fields to update if provided
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      
      // Format points if provided
      if (updates.points) {
        updateData.points = updates.points.map((point, index) => ({
          plaque_id: point.id,
          title: point.title || 'Unnamed Point',
          lat: parseFloat(point.latitude as unknown as string),
          lng: parseFloat(point.longitude as unknown as string),
          order: index
        }));
      }
      
      // Update distance if provided
      if (updates.totalDistance !== undefined) {
        updateData.total_distance = updates.totalDistance;
      }

      await updateDoc(docRef, updateData);
      
      toast.success('Route updated successfully');
      
      // Return the updated route (merging existing data with updates)
      const currentData = docSnap.data();
      return {
        id: routeId,
        ...currentData,
        ...updateData,
        updated_at: new Date() // Use client-side date for immediate UI update
      } as unknown as RouteData;
    } catch (err) {
      console.error('Error updating route:', err);
      toast.error('Failed to update route');
      throw err;
    }
  }, [user]);

  // Delete a route
  const deleteRoute = useCallback(async (routeId: string) => {
    if (!user) throw new Error('You must be logged in to delete a route');

    try {
      const docRef = doc(db, 'routes', routeId);
      const docSnap = await getDoc(docRef);

      // Check if route exists and belongs to user
      if (!docSnap.exists() || docSnap.data().user_id !== user.uid) {
        throw new Error('Route not found or access denied');
      }

      await deleteDoc(docRef);
      toast.success('Route deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting route:', err);
      toast.error('Failed to delete route');
      throw err;
    }
  }, [user]);

  // Get public routes
  const getPublicRoutes = useCallback(async (limit = 10) => {
    try {
      const q = query(
        collection(db, 'routes'),
        where('is_public', '==', true),
        orderBy('views', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RouteData[];
    } catch (err) {
      console.error('Error fetching public routes:', err);
      toast.error('Failed to load public routes');
      throw err;
    }
  }, []);

  // Export route as GPX
  const exportRouteAsGPX = useCallback(async (routeId: string) => {
    try {
      const route = await getRoute(routeId);
      if (!route) return null;

      const waypoints = route.points.map((point, index) => `
    <wpt lat="${point.lat}" lon="${point.lng}">
      <n>${point.title}</n>
      <desc>Stop ${index + 1}: ${point.title}</desc>
    </wpt>`).join('');

      const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Plaquer App" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <n>${route.name}</n>
    <desc>${route.description}</desc>
    <time>${route.created_at instanceof Date ? route.created_at.toISOString() : new Date().toISOString()}</time>
  </metadata>
  ${waypoints}
</gpx>`;

      // Create and download file
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${route.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Route exported successfully');
      return gpxContent;
    } catch (err) {
      console.error('Error exporting route:', err);
      toast.error('Failed to export route');
      throw err;
    }
  }, [getRoute]);

  return {
    routes,
    loading,
    error,
    getRoute,
    createRoute,
    updateRoute,
    deleteRoute,
    getPublicRoutes,
    exportRouteAsGPX
  };
};

export default useRoutes;