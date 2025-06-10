// src/components/maps/utils/routeUtils.ts
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

// FIXED: Helper function for safe coordinate conversion
function parseCoordinate(coord: string | number | undefined): number {
  if (coord === undefined || coord === null) return 0;
  return typeof coord === 'string' ? parseFloat(coord) : coord;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Format distance based on unit preference
 */
export function formatDistance(distanceKm: number, useImperial = false): string {
  if (useImperial) {
    // Convert to miles (1 km = 0.621371 miles)
    const miles = distanceKm * 0.621371;
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${distanceKm.toFixed(1)} km`;
  }
}

/**
 * Calculate the total distance of a route in kilometers
 */
export function calculateRouteDistance(points: Plaque[]): number {
  if (!points || points.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
    
    // FIXED: Use helper function for safe coordinate conversion
    const startLat = parseCoordinate(start.latitude);
    const startLng = parseCoordinate(start.longitude);
    const endLat = parseCoordinate(end.latitude);
    const endLng = parseCoordinate(end.longitude);
    
    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
    
    totalDistance += calculateDistance(startLat, startLng, endLat, endLng);
  }
  
  return totalDistance;
}

/**
 * Calculate approximate walking time (assuming 5km/h or 3mph pace)
 */
export function calculateWalkingTime(distanceKm: number, useImperial = false): string {
  if (distanceKm <= 0) return "0 min";
  
  // Walking speeds differ slightly between km and miles
  const minutes = useImperial 
    ? Math.round(distanceKm * 0.621371 * 20) // 20 minutes per mile
    : Math.round(distanceKm * 12); // 12 minutes per km
  
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
}

/**
 * Optimize route using a nearest-neighbor algorithm
 * Keeps start and end points fixed, optimizes middle points
 */
export function optimizeRoute(routePoints: Plaque[]): Plaque[] {
  if (routePoints.length < 3) {
    return [...routePoints];
  }
  
  // Keep first and last points fixed
  const start = routePoints[0];
  const end = routePoints[routePoints.length - 1];
  const middle = [...routePoints.slice(1, -1)];
  
  const optimized = [start];
  let current = start;
  
  // Find nearest unvisited point
  while (middle.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    
    for (let i = 0; i < middle.length; i++) {
      if (!current.latitude || !current.longitude || !middle[i].latitude || !middle[i].longitude) {
        continue;
      }
      
      // FIXED: Use helper function for safe coordinate conversion
      const startLat = parseCoordinate(current.latitude);
      const startLng = parseCoordinate(current.longitude);
      const endLat = parseCoordinate(middle[i].latitude);
      const endLng = parseCoordinate(middle[i].longitude);
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
        continue;
      }
      
      const distance = calculateDistance(startLat, startLng, endLat, endLng);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    
    // Get nearest point and add to optimized route
    const nearest = middle.splice(bestIndex, 1)[0];
    optimized.push(nearest);
    current = nearest;
  }
  
  // Add end point
  optimized.push(end);
  
  return optimized;
}

/**
 * Creates a GeoJSON route from plaque points
 */
export function createRouteGeoJSON(routePoints: Plaque[]) {
  const validPoints = routePoints.filter(p => {
    if (!p.latitude || !p.longitude) return false;
    const lat = parseCoordinate(p.latitude);
    const lng = parseCoordinate(p.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });
  
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
          pointCount: validPoints.length,
          distance: calculateRouteDistance(validPoints)
        },
        geometry: {
          type: "LineString",
          coordinates: validPoints.map(p => [
            parseCoordinate(p.longitude),
            parseCoordinate(p.latitude)
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
            parseCoordinate(p.longitude),
            parseCoordinate(p.latitude)
          ]
        }
      }))
    ]
  };
}

/**
 * Load saved routes from localStorage
 */
export function loadSavedRoutes(): SavedRoute[] {
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
}

/**
 * Save a route to localStorage
 */
export function saveRoute(
  routePoints: Plaque[],
  name: string = `Plaque Route (${routePoints.length} stops)`
): SavedRoute | null {
  if (routePoints.length < 2) {
    return null;
  }
  
  // Create route object - FIXED: Use helper function for coordinate conversion
  const route: SavedRoute = {
    id: Date.now(),
    name,
    created: new Date().toISOString(),
    points: routePoints.map(p => ({
      id: p.id,
      title: p.title,
      lat: parseCoordinate(p.latitude),
      lng: parseCoordinate(p.longitude)
    }))
  };
  
  // Get existing routes
  const savedRoutes = loadSavedRoutes();
  
  // Add new route
  savedRoutes.push(route);
  
  // Save to localStorage
  localStorage.setItem('plaqueRoutes', JSON.stringify(savedRoutes));
  
  return route;
}