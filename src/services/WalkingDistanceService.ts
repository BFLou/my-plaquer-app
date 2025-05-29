// src/services/WalkingDistanceService.ts - COMPLETE: Calculate real walking distances
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
 * Calculate walking distance and route between two points using OpenRouteService
 * Note: You'll need to get a free API key from openrouteservice.org
 */
export const calculateWalkingRoute = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> => {
  try {
    // For production, use environment variables for API keys
    const API_KEY = process.env.REACT_APP_OPENROUTE_API_KEY || 'YOUR_API_KEY_HERE';
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
      console.warn('OpenRouteService API key not configured, using fallback calculation');
      return calculateEstimatedWalkingRoute(fromLat, fromLng, toLat, toLng);
    }
    
    const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify({
        coordinates: [[fromLng, fromLat], [toLng, toLat]],
        format: 'json',
        instructions: true,
        language: 'en',
        units: 'm'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      return {
        distance: route.summary.distance,
        duration: route.summary.duration,
        geometry: route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]),
        steps: route.segments[0].steps.map((step: any) => ({
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration,
          coordinates: step.way_points.map((wp: number[]) => [wp[1], wp[0]] as [number, number])
        }))
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error calculating walking route:', error);
    // Fallback to estimated route
    return calculateEstimatedWalkingRoute(fromLat, fromLng, toLat, toLng);
  }
};

/**
 * Fallback using estimated walking distance
 * When OpenRouteService is not available or quota is exceeded
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
    
    // Apply walking factor (typically 1.3-1.5x straight line for urban areas)
    const walkingFactor = 1.4;
    const estimatedDistance = straightLineDistance * walkingFactor;
    
    // Estimate duration (average walking speed: 5 km/h = 1.39 m/s)
    const walkingSpeed = 1.39; // m/s
    const estimatedDuration = estimatedDistance / walkingSpeed;
    
    return {
      distance: Math.round(estimatedDistance),
      duration: Math.round(estimatedDuration),
      geometry: [[fromLat, fromLng], [toLat, toLng]],
      steps: [
        {
          instruction: `Walk ${formatDistance(estimatedDistance)} to destination`,
          distance: estimatedDistance,
          duration: estimatedDuration,
          coordinates: [[fromLat, fromLng], [toLat, toLng]]
        }
      ]
    };
  } catch (error) {
    console.error('Error calculating estimated walking route:', error);
    return null;
  }
};

/**
 * Calculate route for multiple waypoints
 */
export const calculateMultiWaypointRoute = async (
  waypoints: Plaque[]
): Promise<{
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
  error?: string;
}> => {
  if (waypoints.length < 2) {
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
  
  // Calculate route between each consecutive pair of waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    
    if (!from.latitude || !from.longitude || !to.latitude || !to.longitude) {
      console.warn(`Skipping route segment ${i} due to missing coordinates`);
      continue;
    }
    
    const fromLat = parseFloat(from.latitude as string);
    const fromLng = parseFloat(from.longitude as string);
    const toLat = parseFloat(to.latitude as string);
    const toLng = parseFloat(to.longitude as string);
    
    // Try actual route calculation first, fallback to estimated
    let route = await calculateWalkingRoute(fromLat, fromLng, toLat, toLng);
    
    if (!route) {
      route = await calculateEstimatedWalkingRoute(fromLat, fromLng, toLat, toLng);
      hasErrors = true;
    }
    
    if (route) {
      segments.push({ from, to, route });
      totalDistance += route.distance;
      totalDuration += route.duration;
    }
  }
  
  return {
    totalDistance: Math.round(totalDistance),
    totalDuration: Math.round(totalDuration),
    segments,
    error: hasErrors ? 'Some routes estimated due to API limitations' : undefined
  };
};

/**
 * Haversine distance calculation (fallback)
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
  return `${hours}h ${mins > 0 ? ` ${mins}m` : ''}`;
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
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, route);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const routeCache = new RouteCache();