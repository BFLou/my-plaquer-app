// src/services/RouteService.ts - FIXED: Removed duplicate toasts
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plaque } from '@/types/plaque';
import { calculateRouteDistance } from '@/components/maps/utils/routeUtils';

export interface RoutePoint {
  plaque_id: number;
  title: string;
  lat: number;
  lng: number;
  order: number;
}

export interface RouteData {
  id?: string;
  name: string;
  description?: string;
  points: RoutePoint[];
  total_distance: number;
  created_at?: any;
  updated_at?: any;
  user_id: string;
  is_public: boolean; // Keep the field but always set to false
  views?: number;
}

export interface RouteServiceError {
  code: string;
  message: string;
}

/**
 * Save a route to Firebase - FIXED: No toasts, returns success/error info
 */
export const saveRouteToFirebase = async (
  name: string,
  points: Plaque[],
  totalDistance: number,
  userId: string,
  description: string = ''
): Promise<{ success: boolean; data?: RouteData; error?: RouteServiceError }> => {
  if (!userId) {
    return {
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'You must be logged in to save routes'
      }
    };
  }
  
  if (points.length < 2) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A route must have at least 2 points'
      }
    };
  }
  
  try {
    // Validate points have required data
    const invalidPoints = points.filter(point => 
      !point.latitude || !point.longitude || 
      isNaN(parseFloat(point.latitude as unknown as string)) || 
      isNaN(parseFloat(point.longitude as unknown as string))
    );
    
    if (invalidPoints.length > 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Some route points have invalid coordinates'
        }
      };
    }
    
    // Format points for storage
    const routePoints = points.map((point, index) => ({
      plaque_id: point.id,
      title: point.title || 'Unnamed Point',
      lat: parseFloat(point.latitude as unknown as string),
      lng: parseFloat(point.longitude as unknown as string),
      order: index
    }));
    
    // Create route data - Always private
    const routeData: RouteData = {
      name: name.trim(),
      description: description.trim(),
      points: routePoints,
      total_distance: totalDistance,
      user_id: userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      is_public: false, // Always false - all routes are private
      views: 0
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'routes'), routeData);
    
    // Return success with the created route
    return {
      success: true,
      data: {
        id: docRef.id,
        ...routeData,
      }
    };
  } catch (error) {
    console.error('Error saving route:', error);
    return {
      success: false,
      error: {
        code: 'FIRESTORE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save route'
      }
    };
  }
};

/**
 * Update an existing route in Firebase - FIXED: No toasts, returns success/error info
 */
export const updateRouteInFirebase = async (
  routeId: string,
  updates: {
    name?: string;
    description?: string;
    points?: Plaque[];
    totalDistance?: number;
  },
  userId: string
): Promise<{ success: boolean; data?: RouteData; error?: RouteServiceError }> => {
  if (!userId || !routeId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required data to update route'
      }
    };
  }
  
  try {
    const docRef = doc(db, 'routes', routeId);
    const docSnap = await getDoc(docRef);
    
    // Check if route exists
    if (!docSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found'
        }
      };
    }
    
    // Check if user owns the route
    if (docSnap.data().user_id !== userId) {
      return {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to update this route'
        }
      };
    }
    
    const updateData: Record<string, any> = {
      updated_at: serverTimestamp()
    };
    
    // Add fields to update if provided
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Route name cannot be empty'
          }
        };
      }
      updateData.name = updates.name.trim();
    }
    
    if (updates.description !== undefined) {
      updateData.description = updates.description.trim();
    }
    
    // Format points if provided
    if (updates.points) {
      if (updates.points.length < 2) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A route must have at least 2 points'
          }
        };
      }
      
      // Validate points have required data
      const invalidPoints = updates.points.filter(point => 
        !point.latitude || !point.longitude || 
        isNaN(parseFloat(point.latitude as unknown as string)) || 
        isNaN(parseFloat(point.longitude as unknown as string))
      );
      
      if (invalidPoints.length > 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some route points have invalid coordinates'
          }
        };
      }
      
      updateData.points = updates.points.map((point, index) => ({
        plaque_id: point.id,
        title: point.title || 'Unnamed Point',
        lat: parseFloat(point.latitude as unknown as string),
        lng: parseFloat(point.longitude as unknown as string),
        order: index
      }));
      
      // Recalculate distance if points changed
      updateData.total_distance = calculateRouteDistance(updates.points);
    } else if (updates.totalDistance !== undefined) {
      updateData.total_distance = updates.totalDistance;
    }
    
    // Update in Firestore
    await updateDoc(docRef, updateData);
    
    // Return the updated route
    const currentData = docSnap.data();
    return {
      success: true,
      data: {
        id: routeId,
        ...currentData,
        ...updateData,
      } as unknown as RouteData
    };
  } catch (error) {
    console.error('Error updating route:', error);
    return {
      success: false,
      error: {
        code: 'FIRESTORE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update route'
      }
    };
  }
};

/**
 * Delete a route from Firebase - FIXED: No toasts, returns success/error info
 */
export const deleteRouteFromFirebase = async (
  routeId: string,
  userId: string
): Promise<{ success: boolean; error?: RouteServiceError }> => {
  if (!userId || !routeId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required data to delete route'
      }
    };
  }
  
  try {
    const docRef = doc(db, 'routes', routeId);
    const docSnap = await getDoc(docRef);
    
    // Check if route exists
    if (!docSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found'
        }
      };
    }
    
    // Check if user owns the route
    if (docSnap.data().user_id !== userId) {
      return {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to delete this route'
        }
      };
    }
    
    // Delete the route
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting route:', error);
    return {
      success: false,
      error: {
        code: 'FIRESTORE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete route'
      }
    };
  }
};

/**
 * Get a single route by ID - Only return if belongs to user (no public routes)
 */
export const getRouteById = async (
  routeId: string,
  userId: string
): Promise<{ success: boolean; data?: RouteData; error?: RouteServiceError }> => {
  if (!routeId || !userId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing route ID or user ID'
      }
    };
  }
  
  try {
    const docRef = doc(db, 'routes', routeId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found'
        }
      };
    }
    
    const routeData = { 
      id: docRef.id, 
      ...docSnap.data() 
    } as RouteData;
    
    // Only return route if it belongs to the user (no public routes)
    if (routeData.user_id === userId) {
      return {
        success: true,
        data: routeData
      };
    }
    
    return {
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to access this route'
      }
    };
  } catch (error) {
    console.error('Error getting route:', error);
    return {
      success: false,
      error: {
        code: 'FIRESTORE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get route'
      }
    };
  }
};

/**
 * Get all routes for a user
 */
export const getUserRoutes = async (
  userId: string
): Promise<{ success: boolean; data?: RouteData[]; error?: RouteServiceError }> => {
  if (!userId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'User ID is required'
      }
    };
  }
  
  try {
    const q = query(
      collection(db, 'routes'),
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const routes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RouteData[];
    
    return {
      success: true,
      data: routes
    };
  } catch (error) {
    console.error('Error getting user routes:', error);
    return {
      success: false,
      error: {
        code: 'FIRESTORE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get routes'
      }
    };
  }
};

/**
 * Get route statistics for a user
 */
export const getRouteStats = async (
  userId: string
): Promise<{ 
  success: boolean; 
  data?: {
    totalRoutes: number;
    totalDistance: number;
    totalPlaques: number;
    averageDistance: number;
    averagePlaques: number;
  }; 
  error?: RouteServiceError 
}> => {
  const result = await getUserRoutes(userId);
  
  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || { code: 'UNKNOWN_ERROR', message: 'Failed to get route stats' }
    };
  }
  
  const routes = result.data;
  const totalRoutes = routes.length;
  const totalDistance = routes.reduce((sum, route) => sum + (route.total_distance || 0), 0);
  const totalPlaques = routes.reduce((sum, route) => sum + route.points.length, 0);
  
  return {
    success: true,
    data: {
      totalRoutes,
      totalDistance,
      totalPlaques,
      averageDistance: totalRoutes > 0 ? totalDistance / totalRoutes : 0,
      averagePlaques: totalRoutes > 0 ? totalPlaques / totalRoutes : 0
    }
  };
};

/**
 * Batch delete routes (useful for cleanup)
 */
export const batchDeleteRoutes = async (
  routeIds: string[],
  userId: string
): Promise<{ 
  success: boolean; 
  data?: { deleted: number; failed: number }; 
  error?: RouteServiceError 
}> => {
  if (!userId || !routeIds.length) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'User ID and route IDs are required'
      }
    };
  }
  
  let deleted = 0;
  let failed = 0;
  
  for (const routeId of routeIds) {
    try {
      const result = await deleteRouteFromFirebase(routeId, userId);
      if (result.success) {
        deleted++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }
  
  return {
    success: true,
    data: { deleted, failed }
  };
};

export default {
  saveRouteToFirebase,
  updateRouteInFirebase,
  deleteRouteFromFirebase,
  getRouteById,
  getUserRoutes,
  getRouteStats,
  batchDeleteRoutes
};