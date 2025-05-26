// src/hooks/useRoutes.ts - FIXED: Complete corrected version
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
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';

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

  // Create route function with proper toast handling
  const createRoute = async (
    name: string,
    description: string,
    points: Plaque[],
    totalDistance: number
  ): Promise<RouteData | null> => {
    if (!user?.uid) {
      toast.error('You must be logged in to create routes');
      throw new Error('User must be logged in to create routes');
    }

    try {
      const result = await saveRouteToFirebase(
        name,
        points,
        totalDistance,
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

  return {
    routes,
    loading,
    error,
    createRoute,
    updateRoute,
    deleteRoute,
    getRoute,
    loadRoutes,
    getUserRouteStats
  };
};

export default useRoutes;