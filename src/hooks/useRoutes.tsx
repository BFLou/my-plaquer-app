// src/hooks/useRoutes.ts - COMPLETE: Enhanced with walking distance integration
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

export { type RouteData } from '../services/RouteService';

export const useRoutes = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's routes
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

  // Load routes when user changes
  useEffect(() => {
    loadRoutes();
  }, [user?.uid]);

  // ENHANCED: Create route with real walking distances
  const createRoute = async (
    name: string,
    description: string,
    points: Plaque[],
    totalDistance?: number // Optional - will calculate if not provided
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
      
      // Calculate real walking distance if not provided
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
          
          // Fallback to straight-line distance calculation
          let fallbackDistance = 0;
          for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            if (start.latitude && start.longitude && end.latitude && end.longitude) {
              const startLat = parseFloat(start.latitude as string);
              const startLng = parseFloat(start.longitude as string);
              const endLat = parseFloat(end.latitude as string);
              const endLng = parseFloat(end.longitude as string);
              
              // Haversine distance * walking factor
              const R = 6371; // Earth's radius in km
              const dLat = (endLat - startLat) * Math.PI / 180;
              const dLng = (endLng - startLng) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const distance = R * c;
              
              fallbackDistance += distance * 1.4; // Walking factor
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
        // Refresh routes list
        await loadRoutes();
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

  // ENHANCED: Create route with pre-calculated walking data
  const createRouteWithWalkingData = async (
    name: string,
    description: string,
    points: Plaque[],
    walkingData: {
      totalDistance: number; // in meters
      totalDuration: number; // in seconds
      segments: any[];
    }
  ): Promise<RouteData | null> => {
    if (!user?.uid) {
      toast.error('You must be logged in to create routes');
      throw new Error('User must be logged in to create routes');
    }

    try {
      // Convert distance to km for storage
      const distanceInKm = walkingData.totalDistance / 1000;
      
      const result = await saveRouteToFirebase(
        name,
        points,
        distanceInKm,
        user.uid,
        description
      );

      if (result.success && result.data) {
        // Store additional walking data in a separate field if needed
        // For now, we'll just use the basic route structure
        
        toast.success(`Route saved! ${Math.round(walkingData.totalDistance / 1000 * 10) / 10}km walking distance`);
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

  // Update route function with proper toast handling
  const updateRoute = async (
    routeId: string,
    updates: {
      name?: string;
      description?: string;
      points?: Plaque[];
      totalDistance?: number;
    }
  ): Promise<RouteData | null> => {
    if (!user?.uid) {
      toast.error('You must be logged in to update routes');
      throw new Error('User must be logged in to update routes');
    }

    try {
      // If points are being updated, recalculate walking distance
      if (updates.points && updates.points.length >= 2) {
        try {
          toast.info('Recalculating walking distances...');
          const routeData = await calculateMultiWaypointRoute(updates.points);
          updates.totalDistance = routeData.totalDistance / 1000; // Convert to km
          
          if (routeData.error) {
            toast.warning('Some distances estimated due to API limitations');
          }
        } catch (walkingError) {
          console.warn('Failed to recalculate walking distances:', walkingError);
          // Keep the original totalDistance or calculate fallback
        }
      }

      const result = await updateRouteInFirebase(
        routeId,
        updates,
        user.uid
      );

      if (result.success && result.data) {
        toast.success('Route updated successfully!');
        // Refresh routes list
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

  // Delete route with proper toast handling
  const deleteRoute = async (routeId: string): Promise<boolean> => {
    if (!user?.uid) {
      toast.error('You must be logged in to delete routes');
      throw new Error('User must be logged in to delete routes');
    }

    try {
      const result = await deleteRouteFromFirebase(routeId, user.uid);

      if (result.success) {
        toast.success('Route deleted successfully!');
        // Refresh routes list
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

  // Get single route by ID
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

  // Get route statistics
  const getUserRouteStats = async () => {
    if (!user?.uid) {
      return {
        totalRoutes: 0,
        totalDistance: 0,
        totalPlaques: 0,
        averageDistance: 0,
        averagePlaques: 0
      };
    }

    try {
      const result = await getRouteStats(user.uid);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('Error getting route stats:', result.error);
        return {
          totalRoutes: 0,
          totalDistance: 0,
          totalPlaques: 0,
          averageDistance: 0,
          averagePlaques: 0
        };
      }
    } catch (error) {
      console.error('Error getting route stats:', error);
      return {
        totalRoutes: 0,
        totalDistance: 0,
        totalPlaques: 0,
        averageDistance: 0,
        averagePlaques: 0
      };
    }
  };

  // ENHANCED: Duplicate route with walking distance recalculation
  const duplicateRoute = async (originalRoute: RouteData, newName?: string): Promise<RouteData | null> => {
    if (!user?.uid) {
      toast.error('You must be logged in to duplicate routes');
      throw new Error('User must be logged in to duplicate routes');
    }

    try {
      // Convert route points back to Plaque format
      const plaques: Plaque[] = originalRoute.points.map(point => ({
        id: point.plaque_id,
        title: point.title,
        latitude: point.lat.toString(),
        longitude: point.lng.toString(),
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
      
      return await createRoute(
        duplicatedName,
        originalRoute.description || '',
        plaques
      );
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
    createRouteWithWalkingData, // NEW: Enhanced creation with walking data
    updateRoute,
    deleteRoute,
    duplicateRoute, // NEW: Duplicate functionality
    getRoute,
    loadRoutes,
    getUserRouteStats
  };
};

export default useRoutes;