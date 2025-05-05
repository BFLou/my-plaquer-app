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
    
    const startLat = parseFloat(start.latitude as string);
    const startLng = parseFloat(start.longitude as string);
    const endLat = parseFloat(end.latitude as string);
    const endLng = parseFloat(end.longitude as string);
    
    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
    
    // Calculate direct distance (haversine formula)
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
 * Optimize route using a nearest-neighbor algorithm
 * Produces a more optimal walking path
 */
export const optimizeRoute = (routePoints: Plaque[]): Plaque[] => {
  if (routePoints.length < 3) {
    return [...routePoints];
  }
  
  // Create a copy so we don't modify the original
  const unvisited = [...routePoints.slice(1, -1)];
  
  // Always keep start and end points fixed
  const result: Plaque[] = [routePoints[0]];
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
      
      const latA = parseFloat(current.latitude as string);
      const lngA = parseFloat(current.longitude as string);
      const latB = parseFloat(unvisited[i].latitude as string);
      const lngB = parseFloat(unvisited[i].longitude as string);
      
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
  
  // Add the end point
  result.push(routePoints[routePoints.length - 1]);
  
  return result;
};

/**
 * Creates a GeoJSON route from plaque points
 */
export const createRouteGeoJSON = (routePoints: Plaque[]) => {
  const validPoints = routePoints.filter(p => 
    p.latitude && p.longitude && 
    !isNaN(parseFloat(p.latitude as string)) && 
    !isNaN(parseFloat(p.longitude as string))
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
          name: "Plaque Route",
          description: `Route with ${validPoints.length} plaques`,
          pointCount: validPoints.length
        },
        geometry: {
          type: "LineString",
          coordinates: validPoints.map(p => [
            parseFloat(p.longitude as string),
            parseFloat(p.latitude as string)
          ])
        }
      },
      // Add individual points as separate features
      ...validPoints.map((p, index) => ({
        type: "Feature",
        properties: {
          name: p.title,
          id: p.id,
          index: index + 1
        },
        geometry: {
          type: "Point",
          coordinates: [
            parseFloat(p.longitude as string),
            parseFloat(p.latitude as string)
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
  name: string = `Plaque Route (${routePoints.length} stops)`
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
      lat: parseFloat(p.latitude as string),
      lng: parseFloat(p.longitude as string)
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