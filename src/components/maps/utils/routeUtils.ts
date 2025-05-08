// src/utils/routeUtils.ts
import { Plaque } from '@/types/plaque';

export interface RoutePoint {
  id: number;
  title: string;
  lat: number;
  lng: number;
}

export interface SavedRoute {
  id: number;
  name: string;
  created: string;
  points: RoutePoint[];
}

/**
 * Calculate the total distance of a route in kilometers
 */
export const calculateRouteDistance = (points: Plaque[]): number => {
  if (!points || points.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
    
    const startLat = typeof start.latitude === 'string' ? 
      parseFloat(start.latitude) : start.latitude as number;
    const startLng = typeof start.longitude === 'string' ? 
      parseFloat(start.longitude) : start.longitude as number;
    const endLat = typeof end.latitude === 'string' ? 
      parseFloat(end.latitude) : end.latitude as number;
    const endLng = typeof end.longitude === 'string' ? 
      parseFloat(end.longitude) : end.longitude as number;
    
    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
    
    // Calculate direct distance using haversine formula
    totalDistance += calculateDistance(startLat, startLng, endLat, endLng);
  }
  
  return totalDistance;
};

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Format distance with proper units
 */
export function formatDistance(distance: number, useImperial: boolean = false): string {
  if (useImperial) {
    // Convert to miles (1 km = 0.621371 miles)
    const miles = distance * 0.621371;
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${distance.toFixed(1)} km`;
  }
}

/**
 * Calculate walking time with improved accuracy for urban environments
 * Accounts for traffic lights, crossings and terrain difficulty
 */
export function calculateWalkingTime(distanceKm: number): string {
  if (distanceKm <= 0) return "0 min";
  
  // Base walking speed: 5 km/h or 12 minutes per kilometer
  let minutes = Math.round(distanceKm * 12); 
  
  // Add time for traffic lights and crossings
  // Assume ~1 traffic light per 250m in urban areas, each taking ~30s to wait and cross
  const estimatedTrafficLights = Math.ceil(distanceKm * 4); // 4 lights per km
  minutes += Math.ceil(estimatedTrafficLights * 0.5); // 0.5 minutes (30s) per light
  
  // Format the output
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
}

/**
 * Estimate total walking time for a route including stops for viewing plaques
 */
export const estimateTotalWalkingTime = (routePoints: Plaque[], minutesPerStop: number = 5): string => {
  // Calculate base walking time between points
  const totalDistanceKm = calculateRouteDistance(routePoints);
  const walkingMinutes = Math.round(totalDistanceKm * 12); // 12 min per km
  
  // Add time for traffic lights and crossings
  const trafficLightMinutes = Math.ceil(totalDistanceKm * 4 * 0.5); // 4 lights per km, 0.5 min each
  
  // Add viewing time for each plaque (exclude starting point since you're already there)
  const viewingMinutes = (routePoints.length - 1) * minutesPerStop;
  
  // Calculate total minutes
  const totalMinutes = walkingMinutes + trafficLightMinutes + viewingMinutes;
  
  // Format output
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
};

/**
 * Optimize route using a nearest-neighbor algorithm
 * Optimized for walking with better intermediate point selection
 */
export const optimizeWalkingRoute = (routePoints: Plaque[], preserveEndpoints: boolean = true): Plaque[] => {
  if (routePoints.length < 3) {
    return [...routePoints]; // Can't optimize with fewer than 3 points
  }
  
  // Create a copy so we don't modify the original
  let result: Plaque[] = [];
  let unvisited: Plaque[] = [];
  
  if (preserveEndpoints) {
    // Keep start and end points fixed
    result.push(routePoints[0]);
    unvisited = [...routePoints.slice(1, -1)];
  } else {
    // All points can be reordered
    unvisited = [...routePoints];
  }
  
  // Start from the first point in the result
  let current = result[0];
  
  // Repeatedly find the closest unvisited point
  while (unvisited.length > 0) {
    let bestIndex = -1;
    let bestDistance = Infinity;
    
    // Find the closest unvisited point
    for (let i = 0; i < unvisited.length; i++) {
      if (!current.latitude || !current.longitude || !unvisited[i].latitude || !unvisited[i].longitude) {
        continue;
      }
      
      const latA = typeof current.latitude === 'string' ? 
        parseFloat(current.latitude) : current.latitude as number;
      const lngA = typeof current.longitude === 'string' ? 
        parseFloat(current.longitude) : current.longitude as number;
      const latB = typeof unvisited[i].latitude === 'string' ? 
        parseFloat(unvisited[i].latitude) : unvisited[i].latitude as number;
      const lngB = typeof unvisited[i].longitude === 'string' ? 
        parseFloat(unvisited[i].longitude) : unvisited[i].longitude as number;
      
      if (isNaN(latA) || isNaN(lngA) || isNaN(latB) || isNaN(lngB)) {
        continue;
      }
      
      const distance = calculateDistance(latA, lngA, latB, lngB);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    
    // Add the closest point to the result
    if (bestIndex !== -1) {
      const nextPoint = unvisited.splice(bestIndex, 1)[0];
      result.push(nextPoint);
      current = nextPoint;
    } else {
      // If we couldn't find a valid next point, just add the rest in order
      result.push(...unvisited);
      break;
    }
  }
  
  // Add the end point if preserving endpoints
  if (preserveEndpoints) {
    result.push(routePoints[routePoints.length - 1]);
  }
  
  return result;
};

/**
 * Load saved routes from localStorage
 */
export const loadSavedRoutes = (): SavedRoute[] => {
  try {
    const routes = localStorage.getItem('plaqueRoutes');
    if (!routes) {
      return [];
    }
    
    return JSON.parse(routes);
  } catch (error) {
    console.error("Error loading saved routes:", error);
    return [];
  }
};

/**
 * Save a route to localStorage
 */
export const saveRoute = (
  routePoints: Plaque[],
  name: string = `Walking Route (${routePoints.length} stops)`
): SavedRoute | null => {
  if (routePoints.length < 2) {
    return null;
  }
  
  // Create route object
  const route: SavedRoute = {
    id: Date.now(),
    name,
    created: new Date().toISOString(),
    points: routePoints.map(p => ({
      id: p.id,
      title: p.title,
      lat: typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude as number,
      lng: typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude as number
    }))
  };
  
  // Get existing routes
  const savedRoutes = loadSavedRoutes();
  
  // Add new route
  savedRoutes.push(route);
  
  // Save to localStorage
  localStorage.setItem('plaqueRoutes', JSON.stringify(savedRoutes));
  
  return route;
};