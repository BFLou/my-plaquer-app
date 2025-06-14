// src/services/RouteService.ts - ENHANCED: Debug version to identify permission issues
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plaque } from '@/types/plaque';

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
  is_public: boolean;
  is_favorite?: boolean;
  views?: number; // Add views field to match your interface
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: RouteServiceError;
}

// Enhanced debugging function
function debugFirebaseAuth() {
  console.log('🔍 Firebase Auth Debug:');
  // Import auth from your firebase config
  import('@/lib/firebase').then(({ auth }) => {
    console.log('- Auth object exists:', !!auth);
    console.log('- Current user:', auth.currentUser?.uid || 'None');
    console.log('- User email:', auth.currentUser?.email || 'None');
    console.log('- Auth state:', auth.currentUser ? 'Signed in' : 'Not signed in');
  }).catch(err => {
    console.error('Error importing auth:', err);
  });
}

export interface RouteServiceError {
  code: string;
  message: string;
}

// Enhanced save function with detailed debugging
export async function saveRouteToFirebase(
  name: string,
  points: Plaque[],
  totalDistance: number,
  userId: string,
  description: string = ''
): Promise<{ success: boolean; data?: RouteData; error?: RouteServiceError }> {
  console.log('🚀 Starting saveRouteToFirebase...');
  console.log('📊 Input parameters:');
  console.log('- Name:', name);
  console.log('- Points count:', points.length);
  console.log('- Total distance:', totalDistance);
  console.log('- User ID:', userId);
  console.log('- Description:', description || 'None');
  
  // Debug auth state
  debugFirebaseAuth();
  
  try {
    // Validate input parameters
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Route name is required'
        }
      };
    }
    
    if (!points || points.length < 2) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Route must have at least 2 points'
        }
      };
    }
    
    if (!userId || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'User ID is required'
        }
      };
    }
    
    if (typeof totalDistance !== 'number' || totalDistance < 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Total distance must be a positive number'
        }
      };
    }
    
    console.log('✅ Input validation passed');
    
    // Convert plaques to route points with better validation
    const routePoints: RoutePoint[] = points.map((plaque, index) => {
      // Ensure coordinates are numbers - handle both string and number types
      let lat: number, lng: number;
      
      if (typeof plaque.latitude === 'string') {
        lat = parseFloat(plaque.latitude);
      } else if (typeof plaque.latitude === 'number') {
        lat = plaque.latitude;
      } else {
        throw new Error(`Invalid latitude for plaque ${plaque.id}: ${plaque.latitude}`);
      }
      
      if (typeof plaque.longitude === 'string') {
        lng = parseFloat(plaque.longitude);
      } else if (typeof plaque.longitude === 'number') {
        lng = plaque.longitude;
      } else {
        throw new Error(`Invalid longitude for plaque ${plaque.id}: ${plaque.longitude}`);
      }
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid coordinates for plaque ${plaque.id}: ${lat}, ${lng}`);
      }
      
      return {
        plaque_id: plaque.id,
        title: plaque.title || `Plaque ${plaque.id}`,
        lat: lat,
        lng: lng,
        order: index
      };
    });
    
    console.log('✅ Route points converted:', routePoints.length);
    console.log('📍 First point:', routePoints[0]);
    console.log('📍 Last point:', routePoints[routePoints.length - 1]);
    
    // Create the route document data - matching your current structure
    const routeData = {
      name: name.trim(),
      description: description?.trim() || '',
      points: routePoints,
      total_distance: totalDistance,
      user_id: userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      is_public: false, // Always false as per your current logic
      is_favorite: false, // Default to false
      views: 0
    };
    
    console.log('📄 Route document to save:');
    console.log('- Name:', routeData.name);
    console.log('- Description:', routeData.description);
    console.log('- Points count:', routeData.points.length);
    console.log('- Total distance:', routeData.total_distance);
    console.log('- User ID:', routeData.user_id);
    console.log('- Is public:', routeData.is_public);
    console.log('- Created at:', routeData.created_at);
    console.log('- Updated at:', routeData.updated_at);
    
    // Validate against security rules requirements
    const requiredFields = ['name', 'user_id', 'points', 'total_distance', 'created_at', 'updated_at'];
    const optionalFields = ['description', 'is_public', 'views', 'is_favorite'];
    const allAllowedFields = [...requiredFields, ...optionalFields];
    
    const documentKeys = Object.keys(routeData);
    console.log('🔐 Security rules validation:');
    console.log('- Document keys:', documentKeys);
    console.log('- Required fields:', requiredFields);
    console.log('- Optional fields:', optionalFields);
    
    // Check required fields
    const missingFields = requiredFields.filter(field => !documentKeys.includes(field));
    if (missingFields.length > 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`
        }
      };
    }
    console.log('✅ All required fields present');
    
    // Check for extra fields
    const extraFields = documentKeys.filter(field => !allAllowedFields.includes(field));
    if (extraFields.length > 0) {
      console.warn('⚠️ Extra fields found (might cause security rule issues):', extraFields);
      // Don't throw error, just warn - Firebase will reject if rules don't allow
    }
    
    // Check data types and constraints - match your validation logic
    if (typeof routeData.name !== 'string' || routeData.name.length === 0 || routeData.name.length > 100) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name must be a non-empty string with max 100 characters'
        }
      };
    }
    
    if (!Array.isArray(routeData.points) || routeData.points.length < 2 || routeData.points.length > 50) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Points must be an array with 2-50 items'
        }
      };
    }
    
    if (typeof routeData.total_distance !== 'number' || routeData.total_distance < 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Total distance must be a positive number'
        }
      };
    }
    
    if (typeof routeData.user_id !== 'string' || routeData.user_id.length === 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID must be a non-empty string'
        }
      };
    }
    
    console.log('✅ Data type validation passed');
    
    // Get reference to routes collection
    const routesCollection = collection(db, 'routes');
    console.log('📚 Collection reference created');
    
    // Attempt to save
    console.log('💾 Attempting to save document to Firebase...');
    const docRef = await addDoc(routesCollection, routeData);
    console.log('✅ Document saved successfully with ID:', docRef.id);
    
    // Create response data - match your interface structure
    const savedRoute: RouteData = {
      id: docRef.id,
      name: routeData.name,
      description: routeData.description,
      points: routeData.points,
      total_distance: routeData.total_distance,
      user_id: routeData.user_id,
      created_at: new Date() as any, // Will be replaced by server timestamp
      updated_at: new Date() as any, // Will be replaced by server timestamp
      is_public: routeData.is_public,
      is_favorite: routeData.is_favorite,
      views: routeData.views
    };
    
    console.log('🎉 Route saved successfully:', savedRoute.id);
    return { success: true, data: savedRoute };
    
  } catch (error) {
    console.error('❌ Error saving route to Firebase:');
    if (typeof error === 'object' && error !== null && 'constructor' in error && error.constructor && 'name' in error.constructor) {
      console.error('- Error type:', (error.constructor as { name: string }).name);
    } else {
      console.error('- Error type: Unknown');
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      console.error('- Error message:', (error as any).message);
    } else {
      console.error('- Error message: Unknown');
    }
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error('- Error code:', (error as any).code || 'No code');
    } else {
      console.error('- Error code: No code');
    }
    console.error('- Full error:', error);
    
    // Log additional debugging info for permission errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as any;
      if (errorObj.message?.includes('permission') || errorObj.code?.includes('permission')) {
        console.error('🔒 PERMISSION ERROR DEBUGGING:');
        debugFirebaseAuth();
        console.error('- Attempted user_id:', userId);
        console.error('- Document structure keys:', Object.keys({
          name: name.trim(),
          description: description?.trim() || '',
          points: points.map(p => p.id),
          total_distance: totalDistance,
          user_id: userId,
          created_at: 'serverTimestamp()',
          updated_at: 'serverTimestamp()',
          is_public: false,
          is_favorite: false,
          views: 0
        }));
      }
    }
    
    return { 
      success: false, 
      error: {
        code: 'FIRESTORE_ERROR',
        message: error && typeof error === 'object' && 'message' in error 
          ? (error as any).message 
          : 'Unknown error occurred'
      }
    };
  }
}

// Rest of the functions remain the same but with your error structure...
export async function getUserRoutes(userId: string): Promise<{ success: boolean; data?: RouteData[]; error?: RouteServiceError }> {
  try {
    console.log('📖 Getting routes for user:', userId);
    
    const routesCollection = collection(db, 'routes');
    const q = query(
      routesCollection,
      where('user_id', '==', userId),
      orderBy('updated_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const routes: RouteData[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
      } as RouteData;
    });
    
    console.log('✅ Found', routes.length, 'routes for user');
    return { success: true, data: routes };
    
  } catch (error) {
    console.error('❌ Error getting user routes:', error);
    return { 
      success: false, 
      error: {
        code: 'FIRESTORE_ERROR',
        message: error && typeof error === 'object' && 'message' in error 
          ? (error as any).message 
          : 'Failed to get routes'
      }
    };
  }
}

export async function getRouteById(routeId: string, userId: string): Promise<ServiceResult<RouteData>> {
  try {
    const routeDoc = await getDoc(doc(db, 'routes', routeId));
    
    if (!routeDoc.exists()) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } };
    }
    
    const routeData = routeDoc.data() as RouteData;
    
    // Check if user has permission to read this route
    if (routeData.user_id !== userId && !routeData.is_public) {
      return { success: false, error: { code: 'PERMISSION_DENIED', message: 'Permission denied' } };
    }
    
    return { 
      success: true, 
      data: { id: routeDoc.id, ...routeData } 
    };
    
  } catch (error) {
    console.error('Error getting route by ID:', error);
    return { 
      success: false, 
      error: {
        code: error && typeof error === 'object' && 'message' in error ? 'FIRESTORE_ERROR' : 'UNKNOWN_ERROR',
        message: error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Failed to get route'
      }
    };
  }
}

export async function updateRouteInFirebase(
  routeId: string,
  updates: Partial<RouteData>,
  userId: string
): Promise<ServiceResult<RouteData>> {
  try {
    const routeRef = doc(db, 'routes', routeId);
    const routeDoc = await getDoc(routeRef);
    
    if (!routeDoc.exists()) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } };
    }
    
    const existingData = routeDoc.data() as RouteData;
    
    // Check permission
    if (existingData.user_id !== userId) {
      return { 
        success: false, 
        error: { code: 'PERMISSION_DENIED', message: 'Permission denied' } 
      };
    }
    
    const updateData = {
      ...updates,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(routeRef, updateData);
    
    const updatedRoute: RouteData = {
      ...existingData,
      ...updates,
      id: routeId,
      updated_at: new Date() as any
    };
    
    return { success: true, data: updatedRoute };
    
  } catch (error) {
    console.error('Error updating route:', error);
    return { 
      success: false, 
      error: {
        code: 'FIRESTORE_ERROR',
        message: error && typeof error === 'object' && 'message' in error
          ? (error as any).message
          : 'Failed to update route'
      }
    };
  }
}

export async function deleteRouteFromFirebase(
  routeId: string,
  userId: string
): Promise<ServiceResult<boolean>> {
  try {
    const routeRef = doc(db, 'routes', routeId);
    const routeDoc = await getDoc(routeRef);
    
    if (!routeDoc.exists()) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } };
    }
    
    const routeData = routeDoc.data() as RouteData;
    
    // Check permission
    if (routeData.user_id !== userId) {
      return { success: false, error: { code: 'PERMISSION_DENIED', message: 'Permission denied' } };
    }
    
    await deleteDoc(routeRef);
    return { success: true, data: true };
    
  } catch (error) {
    console.error('Error deleting route:', error);
    return { 
      success: false, 
      error: {
        code: 'FIRESTORE_ERROR',
        message: error && typeof error === 'object' && 'message' in error
          ? (error as any).message
          : 'Failed to delete route'
      }
    };
  }
}

export async function getRouteStats(userId: string): Promise<ServiceResult<{
  totalRoutes: number;
  totalDistance: number;
  totalPlaques: number;
  averageDistance: number;
  averagePlaques: number;
}>> {
  try {
    const routesCollection = collection(db, 'routes');
    const q = query(routesCollection, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);
    
    let totalDistance = 0;
    let totalPlaques = 0;
    const totalRoutes = querySnapshot.docs.length;
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalDistance += data.total_distance || 0;
      totalPlaques += data.points?.length || 0;
    });
    
    const averageDistance = totalRoutes > 0 ? totalDistance / totalRoutes : 0;
    const averagePlaques = totalRoutes > 0 ? totalPlaques / totalRoutes : 0;
    
    return {
      success: true,
      data: {
        totalRoutes,
        totalDistance,
        totalPlaques,
        averageDistance,
        averagePlaques
      }
    };
    
  } catch (error) {
    console.error('Error getting route stats:', error);
    return { 
      success: false, 
      error: {
        code: 'FIRESTORE_ERROR',
        message: error && typeof error === 'object' && 'message' in error
          ? (error as any).message
          : 'Failed to get route stats'
      }
    };
  }
}