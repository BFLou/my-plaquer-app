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
    
    const startLat = parseFloat(start.latitude as unknown as string);
    const startLng = parseFloat(start.longitude as unknown as string);
    const endLat = parseFloat(end.latitude as unknown as string);
    const endLng = parseFloat(end.longitude as unknown as string);
    
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
 * Get a more precise walking time estimate for a specific route segment
 * Takes into account both distance and terrain
 */
export function getWalkingTimeForSegment(
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number, 
  terrainFactor: number = 1.0 // 1.0 = flat, >1.0 = hilly
): string {
  const distance = calculateDistance(startLat, startLng, endLat, endLng);
  
  // Apply terrain factor to the base walking time
  const adjustedDistance = distance * terrainFactor;
  
  return calculateWalkingTime(adjustedDistance);
}

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
      
      const latA = parseFloat(current.latitude as unknown as string);
      const lngA = parseFloat(current.longitude as unknown as string);
      const latB = parseFloat(unvisited[i].latitude as unknown as string);
      const lngB = parseFloat(unvisited[i].longitude as unknown as string);
      
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
 * Converts route points to a GeoJSON format for export/sharing
 */
export const createRouteGeoJSON = (routePoints: Plaque[]) => {
  const validPoints = routePoints.filter(p => 
    p.latitude && p.longitude && 
    !isNaN(parseFloat(p.latitude as unknown as string)) && 
    !isNaN(parseFloat(p.longitude as unknown as string))
  );
  
  if (validPoints.length < 2) {
    return null;
  }
  
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Walking Route",
          description: `Route with ${validPoints.length} plaques`,
          pointCount: validPoints.length,
          distance: calculateRouteDistance(validPoints).toFixed(2),
          walkingTime: calculateWalkingTime(calculateRouteDistance(validPoints))
        },
        geometry: {
          type: "LineString",
          coordinates: validPoints.map(p => [
            parseFloat(p.longitude as unknown as string),
            parseFloat(p.latitude as unknown as string)
          ])
        }
      },
      // Add individual points as separate features
      ...validPoints.map((p, index) => ({
        type: "Feature",
        properties: {
          name: p.title,
          id: p.id,
          index: index + 1,
          isStart: index === 0,
          isEnd: index === validPoints.length - 1
        },
        geometry: {
          type: "Point",
          coordinates: [
            parseFloat(p.longitude as unknown as string),
            parseFloat(p.latitude as unknown as string)
          ]
        }
      }))
    ]
  };
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
      lat: parseFloat(p.latitude as unknown as string),
      lng: parseFloat(p.longitude as unknown as string)
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