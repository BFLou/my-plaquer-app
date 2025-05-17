// src/services/RouteService.ts
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plaque } from '@/types/plaque';
import { calculateRouteDistance } from '@/components/maps/utils/routeUtils';
import { toast } from 'sonner';

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
  is_public?: boolean;
  views?: number;
}

/**
 * Save a route to Firebase
 */
export const saveRouteToFirebase = async (
  name: string,
  points: Plaque[],
  totalDistance: number,
  userId: string,
  description: string = '',
  isPublic: boolean = false
): Promise<RouteData | null> => {
  if (!userId) {
    toast.error("You must be logged in to save routes");
    return null;
  }
  
  if (points.length < 2) {
    toast.error("A route must have at least 2 points");
    return null;
  }
  
  try {
    // Format points for storage
    const routePoints = points.map((point, index) => ({
      plaque_id: point.id,
      title: point.title || 'Unnamed Point',
      lat: parseFloat(point.latitude as unknown as string),
      lng: parseFloat(point.longitude as unknown as string),
      order: index
    }));
    
    // Create route data
    const routeData: RouteData = {
      name,
      description,
      points: routePoints,
      total_distance: totalDistance,
      user_id: userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      is_public: isPublic,
      views: 0
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'routes'), routeData);
    
    toast.success('Route saved successfully');
    
    // Return the created route
    return {
      id: docRef.id,
      ...routeData,
    };
  } catch (error) {
    console.error('Error saving route:', error);
    toast.error('Failed to save route');
    return null;
  }
};

/**
 * Update an existing route in Firebase
 */
export const updateRouteInFirebase = async (
  routeId: string,
  updates: {
    name?: string;
    description?: string;
    points?: Plaque[];
    totalDistance?: number;
    isPublic?: boolean;
  },
  userId: string
): Promise<RouteData | null> => {
  if (!userId || !routeId) {
    toast.error("Missing required data to update route");
    return null;
  }
  
  try {
    const docRef = doc(db, 'routes', routeId);
    const docSnap = await getDoc(docRef);
    
    // Check if route exists and belongs to user
    if (!docSnap.exists() || docSnap.data().user_id !== userId) {
      toast.error('Route not found or access denied');
      return null;
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
      if (updates.points.length < 2) {
        toast.error("A route must have at least 2 points");
        return null;
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
    
    toast.success('Route updated successfully');
    
    // Return the updated route
    const currentData = docSnap.data();
    return {
      id: routeId,
      ...currentData,
      ...updateData,
    } as unknown as RouteData;
  } catch (error) {
    console.error('Error updating route:', error);
    toast.error('Failed to update route');
    return null;
  }
};

/**
 * Delete a route from Firebase
 */
export const deleteRouteFromFirebase = async (
  routeId: string,
  userId: string
): Promise<boolean> => {
  if (!userId || !routeId) {
    toast.error("Missing required data to delete route");
    return false;
  }
  
  try {
    const docRef = doc(db, 'routes', routeId);
    const docSnap = await getDoc(docRef);
    
    // Check if route exists and belongs to user
    if (!docSnap.exists() || docSnap.data().user_id !== userId) {
      toast.error('Route not found or access denied');
      return false;
    }
    
    // Delete the route
    await deleteDoc(docRef);
    
    toast.success('Route deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting route:', error);
    toast.error('Failed to delete route');
    return false;
  }
};

/**
 * Get a single route by ID
 */
export const getRouteById = async (
  routeId: string,
  userId: string
): Promise<RouteData | null> => {
  if (!routeId) {
    return null;
  }
  
  try {
    const docRef = doc(db, 'routes', routeId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const routeData = { 
      id: docRef.id, 
      ...docSnap.data() 
    } as RouteData;
    
    // Check if route is public or belongs to user
    if (routeData.user_id === userId || routeData.is_public) {
      // Increment view count if viewing someone else's public route
      if (routeData.is_public && routeData.user_id !== userId) {
        await updateDoc(docRef, {
          views: (routeData.views || 0) + 1
        });
      }
      
      return routeData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting route:', error);
    return null;
  }
};

/**
 * Get all routes for a user
 */
export const getUserRoutes = async (
  userId: string
): Promise<RouteData[]> => {
  if (!userId) {
    return [];
  }
  
  try {
    const q = query(
      collection(db, 'routes'),
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RouteData[];
  } catch (error) {
    console.error('Error getting user routes:', error);
    return [];
  }
};

/**
 * Get public routes
 */
export const getPublicRoutes = async (
  limit: number = 10
): Promise<RouteData[]> => {
  try {
    const q = query(
      collection(db, 'routes'),
      where('is_public', '==', true),
      orderBy('views', 'desc')
      // Add limit if needed: limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RouteData[];
  } catch (error) {
    console.error('Error getting public routes:', error);
    return [];
  }
};

export default {
  saveRouteToFirebase,
  updateRouteInFirebase,
  deleteRouteFromFirebase,
  getRouteById,
  getUserRoutes,
  getPublicRoutes
};