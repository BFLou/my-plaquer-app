// src/services/WalkingDistanceService.ts - FIXED: Clean syntax with proper function declarations
import { Plaque } from '@/types/plaque';

export interface WalkingStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

export interface WalkingRoute {
  distance: number; // in meters
  duration: number; // in seconds
  steps: WalkingStep[];
  geometry: [number, number][];
}

export interface RouteSegment {
  from: Plaque;
  to: Plaque;
  route: WalkingRoute;
}

/**
 * Safely convert coordinate to number
 */
function parseCoordinate(coord: string | number | undefined): number | null {
  if (coord === undefined || coord === null) return null;
  
  if (typeof coord === 'number') return coord;
  
  const parsed = parseFloat(String(coord));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Calculate walking distance and route between two points using multiple fallback methods
 * PRIORITIZED: OpenRouteService (since you have the API key)
 */
export const calculateWalkingRoute = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> => {
  console.log(`🚶 Calculating walking route from [${fromLat}, ${fromLng}] to [${toLat}, ${toLng}]`);
  
  // Try OpenRouteService FIRST (since you have the API key)
  let route = await tryOpenRouteService(fromLat, fromLng, toLat, toLng);
  if (route) {
    console.log('🚶 ✅ Using OpenRouteService route');
    return route;
  }
  
  // Try OSRM as backup (free public API)
  route = await tryOSRMRoute(fromLat, fromLng, toLat, toLng);
  if (route) {
    console.log('🚶 ✅ Using OSRM route (backup)');
    return route;
  }
  
  // Try GraphHopper as final API fallback
  route = await tryGraphHopperRoute(fromLat, fromLng, toLat, toLng);
  if (route) {
    console.log('🚶 ✅ Using GraphHopper route (backup)');
    return route;
  }
  
  // Use estimated route if all APIs fail
  console.log('🚶 ⚠️ Using estimated walking route (fallback)');
  return calculateEstimatedWalkingRoute(fromLat, fromLng, toLat, toLng);
};

/**
 * Try GraphHopper routing API (free tier: 2500 requests/day)
 */
async function tryGraphHopperRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> {
  try {
    const API_KEY = import.meta.env.VITE_GRAPHHOPPER_API_KEY;
    
    // Skip if no API key
    if (!API_KEY) {
      return null;
    }
    
    const url = `https://graphhopper.com/api/1/route?` +
      `point=${fromLat},${fromLng}&point=${toLat},${toLng}&` +
      `vehicle=foot&locale=en&instructions=true&calc_points=true&` +
      `key=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GraphHopper API error: ${response.status}`);
    
    const data = await response.json();
    
    if (data.paths && data.paths.length > 0) {
      const path = data.paths[0];
      
      // FIXED: Safe polyline decoding with proper type checking
      let geometry: [number, number][] = [];
      if (path.points && typeof path.points === 'string') {
        try {
          geometry = decodePolyline(path.points);
        } catch (error) {
          console.error('Error decoding polyline:', error);
          geometry = [];
        }
      }
      
      return {
        distance: Math.round(path.distance),
        duration: Math.round(path.time / 1000), // Convert ms to seconds
        geometry,
        steps: path.instructions?.map((instruction: any) => ({
          instruction: instruction.text || 'Continue',
          distance: instruction.distance || 0,
          duration: (instruction.time || 0) / 1000, // Convert ms to seconds
          coordinates: geometry.slice(instruction.interval?.[0] || 0, instruction.interval?.[1] || geometry.length)
        })) || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('GraphHopper routing error:', error);
    return null;
  }
}


/**
 * Try OpenRouteService API - FIXED: Use correct API key and improved error handling
 */
async function tryOpenRouteService(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> {
  try {
    // Use Vite's environment variable syntax
    const API_KEY = import.meta.env.VITE_ORS_API_KEY;
    
    if (!API_KEY) {
      console.warn('OpenRouteService API key not found in environment variables');
      console.log('Available env vars:', Object.keys(import.meta.env));
      return null;
    }
    
    console.log('🚶 Attempting OpenRouteService route calculation...');
    
    const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json',
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify({
        coordinates: [[fromLng, fromLat], [toLng, toLat]],
        format: 'geojson',
        instructions: true,
        language: 'en',
        geometry_simplify: false,
        continue_straight: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouteService API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenRouteService API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🚶 OpenRouteService raw response:', data);
    
    if (data.features && data.features.length > 0) {
      const route = data.features[0];
      const properties = route.properties;
      
      if (!route.geometry || !route.geometry.coordinates) {
        console.error('No geometry in OpenRouteService response');
        return null;
      }
      
      // Convert GeoJSON coordinates [lng, lat] to [lat, lng]
      const geometry = route.geometry.coordinates.map((coord: number[]) => 
        [coord[1], coord[0]] as [number, number]
      );
      
      console.log('🚶 OpenRouteService success:', {
        distance: properties.summary?.distance,
        duration: properties.summary?.duration,
        geometryPoints: geometry.length
      });
      
      return {
        distance: Math.round(properties.summary?.distance || 0),
        duration: Math.round(properties.summary?.duration || 0),
        geometry,
        steps: properties.segments?.[0]?.steps?.map((step: any) => ({
          instruction: step.instruction || 'Continue',
          distance: step.distance || 0,
          duration: step.duration || 0,
          coordinates: step.way_points?.map((wp: number[]) => [wp[1], wp[0]] as [number, number]) || []
        })) || []
      };
    }
    
    console.warn('No routes found in OpenRouteService response');
    return null;
  } catch (error) {
    console.error('OpenRouteService routing error:', error);
    return null;
  }
}

/**
 * Try OSRM (Open Source Routing Machine) - free public API
 */
async function tryOSRMRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/walking/` +
      `${fromLng},${fromLat};${toLng},${toLat}?` +
      `overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM API error: ${response.status}`);
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      // Convert GeoJSON coordinates [lng, lat] to [lat, lng]
      const geometry = route.geometry.coordinates.map((coord: number[]) => 
        [coord[1], coord[0]] as [number, number]
      );
      
      return {
        distance: Math.round(route.distance),
        duration: Math.round(route.duration),
        geometry,
        steps: route.legs?.[0]?.steps?.map((step: any) => ({
          instruction: step.maneuver?.instruction || 'Continue',
          distance: step.distance || 0,
          duration: step.duration || 0,
          coordinates: step.geometry?.coordinates?.map((coord: number[]) => 
            [coord[1], coord[0]] as [number, number]
          ) || []
        })) || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
}

/**
 * Fallback: Calculate estimated walking route with realistic path
 */
export const calculateEstimatedWalkingRoute = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> => {
  try {
    // Calculate straight-line distance
    const straightLineDistance = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);
    
    // Apply walking factor for London streets (1.4x is realistic for urban areas)
    const walkingFactor = 1.4;
    const estimatedDistance = straightLineDistance * walkingFactor;
    
    // Estimate duration (average walking speed: 5 km/h = 1.39 m/s)
    const walkingSpeed = 1.39; // m/s
    const estimatedDuration = estimatedDistance / walkingSpeed;
    
    // Create a more realistic path with some intermediate points
    const geometry = createRealisticPath(fromLat, fromLng, toLat, toLng);
    
    return {
      distance: Math.round(estimatedDistance),
      duration: Math.round(estimatedDuration),
      geometry,
      steps: [
        {
          instruction: `Walk ${formatDistance(estimatedDistance)} to destination`,
          distance: estimatedDistance,
          duration: estimatedDuration,
          coordinates: geometry
        }
      ]
    };
  } catch (error) {
    console.error('Error calculating estimated walking route:', error);
    return null;
  }
};

/**
 * Create a more realistic walking path instead of straight line
 */
function createRealisticPath(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): [number, number][] {
  const points: [number, number][] = [[fromLat, fromLng]];
  
  // Add intermediate points to simulate street routing
  const latDiff = toLat - fromLat;
  const lngDiff = toLng - fromLng;
  
  // For longer distances, add more intermediate points
  const distance = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);
  const numPoints = Math.min(Math.max(Math.floor(distance / 200), 1), 8); // 1-8 intermediate points
  
  for (let i = 1; i < numPoints; i++) {
    const ratio = i / numPoints;
    
    // Add some randomness to simulate street layout
    const randomOffsetLat = (Math.random() - 0.5) * 0.0005; // ~50m variation
    const randomOffsetLng = (Math.random() - 0.5) * 0.0005;
    
    const intermediateLat = fromLat + (latDiff * ratio) + randomOffsetLat;
    const intermediateLng = fromLng + (lngDiff * ratio) + randomOffsetLng;
    
    points.push([intermediateLat, intermediateLng]);
  }
  
  points.push([toLat, toLng]);
  return points;
}

/**
 * Calculate route for multiple waypoints - ENHANCED: Better debugging and error handling
 */
export const calculateMultiWaypointRoute = async (
  waypoints: Plaque[]
): Promise<{
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
  error?: string;
}> => {
  console.log('🚶 WalkingDistanceService: Calculating route for', waypoints.length, 'waypoints');
  
  if (waypoints.length < 2) {
    console.log('🚶 Not enough waypoints for route calculation');
    return {
      totalDistance: 0,
      totalDuration: 0,
      segments: [],
      error: 'At least 2 waypoints required'
    };
  }
  
  const segments: RouteSegment[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  let hasErrors = false;
  let apiCallsSuccessful = 0;
  let apiCallsFailed = 0;
  
  // Calculate route between each consecutive pair of waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    
    console.log(`🚶 Processing segment ${i + 1}/${waypoints.length - 1}: ${from.title} → ${to.title}`);
    
    if (!from.latitude || !from.longitude || !to.latitude || !to.longitude) {
      console.warn(`❌ Skipping route segment ${i} due to missing coordinates`);
      apiCallsFailed++;
      continue;
    }
    
    // FIXED: Safe coordinate conversion
    const fromLat = parseCoordinate(from.latitude);
    const fromLng = parseCoordinate(from.longitude);
    const toLat = parseCoordinate(to.latitude);
    const toLng = parseCoordinate(to.longitude);
    
    if (fromLat === null || fromLng === null || toLat === null || toLng === null) {
      console.warn(`❌ Skipping route segment ${i} due to invalid coordinates:`, {
        from: { lat: fromLat, lng: fromLng },
        to: { lat: toLat, lng: toLng }
      });
      apiCallsFailed++;
      continue;
    }
    
    try {
      // Calculate route for this segment with timeout
      const routePromise = calculateWalkingRoute(fromLat, fromLng, toLat, toLng);
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Route calculation timeout')), 10000) // 10 second timeout
      );
      
      const route = await Promise.race([routePromise, timeoutPromise]);
      
      if (route && route.distance > 0) {
        segments.push({ from, to, route });
        totalDistance += route.distance;
        totalDuration += route.duration;
        apiCallsSuccessful++;
        
        console.log(`✅ Segment ${i + 1} calculated:`, {
          distance: `${(route.distance / 1000).toFixed(2)}km`,
          duration: `${Math.round(route.duration / 60)}min`,
          geometryPoints: route.geometry.length
        });
      } else {
        console.error(`❌ Failed to calculate route for segment ${i + 1}: No valid route returned`);
        apiCallsFailed++;
        hasErrors = true;
      }
    } catch (error) {
      console.error(`❌ Error calculating route for segment ${i + 1}:`, error);
      apiCallsFailed++;
      hasErrors = true;
    }
    
    // Add a small delay between API calls to avoid rate limiting
    if (i < waypoints.length - 2) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    }
  }
  
  const result = {
    totalDistance: Math.round(totalDistance),
    totalDuration: Math.round(totalDuration),
    segments,
    error: hasErrors ? 
      `Some routes could not be calculated (${apiCallsSuccessful} successful, ${apiCallsFailed} failed)` : 
      undefined
  };
  
  console.log('🚶 Route calculation complete:', {
    waypoints: waypoints.length,
    segments: segments.length,
    totalDistance: `${(result.totalDistance / 1000).toFixed(2)}km`,
    totalDuration: `${Math.round(result.totalDuration / 60)}min`,
    successfulCalls: apiCallsSuccessful,
    failedCalls: apiCallsFailed,
    hasErrors
  });
  
  return result;
};

/**
 * Haversine distance calculation
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Decode polyline (for GraphHopper and other services) - FIXED SIGNATURE
 */
function decodePolyline(encoded: string): [number, number][] {
  // Add input validation
  if (typeof encoded !== 'string' || encoded.length === 0) {
    return [];
  }

  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  
  try {
    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;
      
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;
      
      points.push([lat / 1e5, lng / 1e5]);
    }
  } catch (error) {
    console.error('Error decoding polyline:', error);
    return [];
  }
  
  return points;
}
/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
};

/**
 * Cache for route calculations to avoid repeated API calls
 */
class RouteCache {
  private cache = new Map<string, WalkingRoute>();
  private maxCacheSize = 100;
  
  private getCacheKey(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
    return `${fromLat.toFixed(6)},${fromLng.toFixed(6)}-${toLat.toFixed(6)},${toLng.toFixed(6)}`;
  }
  
  get(fromLat: number, fromLng: number, toLat: number, toLng: number): WalkingRoute | null {
    const key = this.getCacheKey(fromLat, fromLng, toLat, toLng);
    return this.cache.get(key) || null;
  }
  
  set(fromLat: number, fromLng: number, toLat: number, toLng: number, route: WalkingRoute): void {
    const key = this.getCacheKey(fromLat, fromLng, toLat, toLng);
    
    // Simple LRU: remove oldest entries when cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (typeof firstKey === 'string') {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, route);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const routeCache = new RouteCache();