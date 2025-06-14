// src/hooks/useRoutes.tsx - Updated with proper duplicate function and favorite support - FIXED
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  saveRouteToFirebase, 
  getUserRoutes, 
  getRouteById, 
  updateRouteInFirebase, 
  deleteRouteFromFirebase,
  getRouteStats,
  type RouteData 
} from '../services/RouteService';
import { calculateMultiWaypointRoute } from '../services/WalkingDistanceService';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';

// Re-exporting RouteData for convenience in other parts of the app
export { type RouteData } from '../services/RouteService';

/**
 * Custom hook to manage all route-related logic, including fetching, creating,
 * updating, deleting, and duplicating routes. It handles user authentication,
 * state management for routes, loading, and errors.
 */
export const useRoutes = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches all routes for the currently logged-in user from Firebase.
   */
  const loadRoutes = async () => {
    if (!user?.uid) {
      setRoutes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getUserRoutes(user.uid);
      
      if (result.success && result.data) {
        setRoutes(result.data);
      } else {
        console.error('Error loading routes:', result.error);
        setError(result.error?.message || 'Failed to load routes');
        setRoutes([]);
      }
    } catch (err) {
      console.error('Error loading routes:', err);
      setError('Failed to load routes');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to automatically load routes when the user's authentication state changes.
  useEffect(() => {
    loadRoutes();
  }, [user?.uid]);

  /**
   * Creates a new route, calculating the real walking distance between points.
   * @param name - The name of the route.
   * @param description - The description of the route.
   * @param points - An array of Plaque objects representing the stops on the route.
   * @param totalDistance - Optional pre-calculated distance in km.
   * @returns The newly created RouteData object or null on failure.
   */
  const createRoute = async (
    name: string,
    description: string,
    points: Plaque[],
    totalDistance?: number
  ): Promise<RouteData | null> => {
    if (!user?.uid) {
      toast.error('You must be logged in to create routes');
      throw new Error('User must be logged in to create routes');
    }

    if (points.length < 2) {
      toast.error('A route must have at least 2 stops');
      throw new Error('A route must have at least 2 stops');
    }

    try {
      let finalDistance = totalDistance;
      
      // Calculate real walking distance if it wasn't provided.
      if (!totalDistance) {
        toast.info('Calculating walking distances...');
        
        try {
          const routeData = await calculateMultiWaypointRoute(points);
          finalDistance = routeData.totalDistance / 1000; // Convert to km
          
          if (routeData.error) {
            toast.warning('Some distances estimated due to API limitations');
          } else {
            toast.success('Real walking distances calculated');
          }
        } catch (walkingError) {
          console.warn('Failed to calculate walking distances, using fallback:', walkingError);
          
          // Fallback to straight-line (Haversine) distance calculation with a walking factor.
          let fallbackDistance = 0;
          for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            if (start.latitude && start.longitude && end.latitude && end.longitude) {
              const startLat = typeof start.latitude === 'string' ? parseFloat(start.latitude) : start.latitude as number;
              const startLng = typeof start.longitude === 'string' ? parseFloat(start.longitude) : start.longitude as number;
              const endLat = typeof end.latitude === 'string' ? parseFloat(end.latitude) : end.latitude as number;
              const endLng = typeof end.longitude === 'string' ? parseFloat(end.longitude) : end.longitude as number;
              
              const R = 6371; // Radius of the Earth in km
              const dLat = (endLat - startLat) * Math.PI / 180;
              const dLng = (endLng - startLng) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const distance = R * c;
              
              fallbackDistance += distance * 1.4; // Apply walking factor
            }
          }
          
          finalDistance = fallbackDistance;
          toast.info('Distances estimated based on straight-line calculation');
        }
      }

      const result = await saveRouteToFirebase(
        name,
        points,
        finalDistance || 0,
        user.uid,
        description
      );

      if (result.success && result.data) {
        toast.success('Route saved successfully!');
        await loadRoutes(); // Refresh the list of routes
        return result.data;
      } else {
        toast.error(result.error?.message || 'Failed to save route');
        throw new Error(result.error?.message || 'Failed to save route');
      }
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Failed to save route. Please try again.');
      throw error;
    }
  };
  
    /**
   * Creates a new route with pre-calculated walking data from the map.
   * @param name - The name of the route.
   * @param description - The description of the route.
   * @param points - An array of Plaque objects.
   * @param walkingData - Pre-calculated distance, duration, and segments.
   * @returns The newly created RouteData object or null on failure.
   */
  const createRouteWithWalkingData = async (
    name: string,
    description: string,
    points: Plaque[],
    walkingData: {
      totalDistance: number;
      totalDuration: number;
      segments: any[];
    }
  ): Promise<RouteData | null> => {
    if (!user?.uid) {
      toast.error('You must be logged in to create routes');
      throw new Error('User must be logged in to create routes');
    }

    try {
      const distanceInKm = walkingData.totalDistance / 1000;
      
      const result = await saveRouteToFirebase(
        name,
        points,
        distanceInKm,
        user.uid,
        description
      );

      if (result.success && result.data) {
        toast.success(`Route saved! ${distanceInKm.toFixed(1)}km walking distance`);
        await loadRoutes();
        return result.data;
      } else {
        toast.error(result.error?.message || 'Failed to save route');
        throw new Error(result.error?.message || 'Failed to save route');
      }
    } catch (error) {
      console.error('Error creating route with walking data:', error);
      toast.error('Failed to save route. Please try again.');
      throw error;
    }
  };

  /**
   * Updates an existing route in Firebase.
   * @param routeId - The ID of the route to update.
   * @param updates - An object containing the fields to update.
   * @returns The updated RouteData object or null on failure.
   */
  const updateRoute = async (
    routeId: string,
    updates: {
      name?: string;
      description?: string;
      points?: Plaque[];
      totalDistance?: number;
      is_favorite?: boolean;
    }
  ): Promise<RouteData | null> => {
    if (!user?.uid) {
      toast.error('You must be logged in to update routes');
      throw new Error('User must be logged in to update routes');
    }

    try {
        // This will be the payload for Firebase, correctly typed.
        const firebaseUpdates: Partial<RouteData> = {
            name: updates.name,
            description: updates.description,
            is_favorite: updates.is_favorite,
        };

        // If points are being updated, we must transform them and recalculate distance.
        if (updates.points && updates.points.length >= 2) {
            try {
                toast.info('Recalculating walking distances...');
                const routeData = await calculateMultiWaypointRoute(updates.points);
                firebaseUpdates.totalDistance = routeData.totalDistance / 1000;

                // FIX: Transform the points from Plaque[] to RoutePoint[]
                firebaseUpdates.points = updates.points.map((plaque, index) => ({
                    plaque_id: plaque.id,
                    title: plaque.title,
                    lat: typeof plaque.latitude === 'string' ? parseFloat(plaque.latitude) : (plaque.latitude as number),
                    lng: typeof plaque.longitude === 'string' ? parseFloat(plaque.longitude) : (plaque.longitude as number),
                    order: index,
                }));
                
                if (routeData.error) {
                    toast.warning('Some distances estimated due to API limitations');
                }
            } catch (walkingError) {
                console.warn('Failed to recalculate walking distances:', walkingError);
            }
        } else if (updates.totalDistance !== undefined) {
             firebaseUpdates.total_distance = updates.totalDistance;
        }

        // Remove undefined properties so Firestore doesn't try to write them
        Object.keys(firebaseUpdates).forEach(key => (firebaseUpdates as any)[key] === undefined && delete (firebaseUpdates as any)[key]);
        
        const result = await updateRouteInFirebase(
            routeId,
            firebaseUpdates,
            user.uid
        );

      if (result.success && result.data) {
        toast.success('Route updated successfully!');
        await loadRoutes();
        return result.data;
      } else {
        toast.error(result.error?.message || 'Failed to update route');
        throw new Error(result.error?.message || 'Failed to update route');
      }
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route. Please try again.');
      throw error;
    }
  };

  /**
   * Deletes a route from Firebase.
   * @param routeId - The ID of the route to delete.
   * @returns True on success, false on failure.
   */
  const deleteRoute = async (routeId: string): Promise<boolean> => {
    if (!user?.uid) {
      toast.error('You must be logged in to delete routes');
      throw new Error('User must be logged in to delete routes');
    }

    try {
      const result = await deleteRouteFromFirebase(routeId, user.uid);

      if (result.success) {
        toast.success('Route deleted successfully!');
        await loadRoutes();
        return true;
      } else {
        toast.error(result.error?.message || 'Failed to delete route');
        return false;
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route. Please try again.');
      throw error;
    }
  };

  /**
   * Retrieves a single route by its ID.
   * @param routeId - The ID of the route to fetch.
   * @returns The RouteData object or null if not found.
   */
  const getRoute = async (routeId: string): Promise<RouteData | null> => {
    if (!user?.uid) {
      return null;
    }

    try {
      const result = await getRouteById(routeId, user.uid);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error getting route:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error getting route:', error);
      return null;
    }
  };

  /**
   * Retrieves aggregate statistics about the user's routes.
   * @returns An object containing route statistics.
   */
  const getUserRouteStats = async () => {
    const defaultStats = {
      totalRoutes: 0,
      totalDistance: 0,
      totalPlaques: 0,
      averageDistance: 0,
      averagePlaques: 0
    };
    
    if (!user?.uid) {
      return defaultStats;
    }

    try {
      const result = await getRouteStats(user.uid);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error getting route stats:', result.error);
        return defaultStats;
      }
    } catch (error) {
      console.error('Error getting route stats:', error);
      return defaultStats;
    }
  };

  /**
   * Duplicates an existing route.
   * @param originalRoute - The route to duplicate.
   * @param newName - An optional new name for the duplicated route.
   * @returns The duplicated RouteData object or null on failure.
   */
  const duplicateRoute = async (originalRoute: RouteData, newName?: string): Promise<RouteData | null> => {
    if (!user?.uid) {
      toast.error('You must be logged in to duplicate routes');
      throw new Error('User must be logged in to duplicate routes');
    }

    try {
      // Convert route points back to Plaque format to be used in create function
      const plaques: Plaque[] = originalRoute.points.map(point => ({
        id: point.plaque_id,
        title: point.title,
        latitude: point.lat,
        longitude: point.lng,
        // Add other required Plaque properties with defaults
        address: '',
        location: '',
        inscription: '',
        description: '',
        profession: '',
        color: '',
        postcode: '',
        erected: '',
        organisations: '',
        area: '',
        visited: false
      }));

      const duplicatedName = newName || `${originalRoute.name} (Copy)`;
      
      // Create the duplicate with the same distance to avoid recalculation
      const result = await saveRouteToFirebase(
        duplicatedName,
        plaques,
        originalRoute.total_distance,
        user.uid,
        originalRoute.description || ''
      );

      if (result.success && result.data) {
        toast.success('Route duplicated successfully!');
        await loadRoutes();
        return result.data;
      } else {
        toast.error(result.error?.message || 'Failed to duplicate route');
        throw new Error(result.error?.message || 'Failed to duplicate route');
      }
    } catch (error) {
      console.error('Error duplicating route:', error);
      toast.error('Failed to duplicate route. Please try again.');
      throw error;
    }
  };

  return {
    routes,
    loading,
    error,
    createRoute,
    createRouteWithWalkingData,
    updateRoute,
    deleteRoute,
    duplicateRoute,
    getRoute,
    loadRoutes,
    getUserRouteStats
  };
};

export default useRoutes;
