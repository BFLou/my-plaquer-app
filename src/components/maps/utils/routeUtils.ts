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
 * Creates a GeoJSON route from plaque points
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
          name: "Plaque Route",
          description: `Route with ${validPoints.length} plaques`,
          pointCount: validPoints.length
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
          index: index + 1
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
 * Draws a route line on the map
 */
export const drawRouteLine = (map: any, routePoints: Plaque[], options: any = {}) => {
  // Clear existing route
  if (map._routeLine) {
    map.removeLayer(map._routeLine);
  }
  
  if (routePoints.length < 2) {
    return null;
  }
  
  // Get coordinates for each point
  const coordinates = routePoints
    .filter(p => p.latitude && p.longitude)
    .map(p => [
      parseFloat(p.latitude as unknown as string),
      parseFloat(p.longitude as unknown as string)
    ]);
  
  if (coordinates.length < 2) {
    return null;
  }
  
  const L = window.L;
  if (!L) {
    return null;
  }
  
  // Create polyline
  const defaultOptions = {
    color: '#3b82f6',
    weight: 4,
    opacity: 0.7,
    dashArray: '8, 8',
    lineCap: 'round',
    lineJoin: 'round'
  };
  
  const polyline = L.polyline(coordinates, { ...defaultOptions, ...options });
  polyline.addTo(map);
  
  // Store reference on map
  map._routeLine = polyline;
  
  // Fit bounds to show entire route
  const bounds = polyline.getBounds();
  map.fitBounds(bounds, { padding: [50, 50] });
  
  return polyline;
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

/**
 * Calculate the total distance of a route in kilometers
 */
export const calculateRouteDistance = (routePoints: Plaque[]): number => {
  if (routePoints.length < 2) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < routePoints.length - 1; i++) {
    const p1 = routePoints[i];
    const p2 = routePoints[i + 1];
    
    if (!p1.latitude || !p1.longitude || !p2.latitude || !p2.longitude) {
      continue;
    }
    
    const lat1 = parseFloat(p1.latitude as unknown as string);
    const lng1 = parseFloat(p1.longitude as unknown as string);
    const lat2 = parseFloat(p2.latitude as unknown as string);
    const lng2 = parseFloat(p2.longitude as unknown as string);
    
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      continue;
    }
    
    // Calculate distance using Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    totalDistance += distance;
  }
  
  return totalDistance;
};

/**
 * Optimize route using a simple greedy algorithm
 * This is a basic implementation and not a true TSP solution
 */
export const optimizeRoute = (routePoints: Plaque[]): Plaque[] => {
  if (routePoints.length < 3) {
    return [...routePoints];
  }
  
  // Make a copy of the original points
  const points = [...routePoints];
  
  // Start with the first point
  const optimized: Plaque[] = [points.shift()!];
  
  // For each remaining point, find the closest one to the last point in the optimized route
  while (points.length > 0) {
    const lastPoint = optimized[optimized.length - 1];
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      
      if (!lastPoint.latitude || !lastPoint.longitude || !p.latitude || !p.longitude) {
        continue;
      }
      
      const lat1 = parseFloat(lastPoint.latitude as unknown as string);
      const lng1 = parseFloat(lastPoint.longitude as unknown as string);
      const lat2 = parseFloat(p.latitude as unknown as string);
      const lng2 = parseFloat(p.longitude as unknown as string);
      
      if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
        continue;
      }
      
      // Calculate distance
      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    
    // Add the closest point to the optimized route
    optimized.push(points.splice(closestIndex, 1)[0]);
  }
  
  return optimized;
};

/**
 * Calculate distance between two points
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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