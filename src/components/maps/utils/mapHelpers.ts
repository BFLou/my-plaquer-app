import { Plaque } from '@/types/plaque';

/**
 * Convert latitude and longitude to map coordinates
 */
export const coordsToLatLng = (plaque: Plaque): [number, number] | null => {
  if (!plaque.latitude || !plaque.longitude) {
    return null;
  }
  
  const lat = parseFloat(plaque.latitude as unknown as string);
  const lng = parseFloat(plaque.longitude as unknown as string);
  
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }
  
  return [lat, lng];
};

/**
 * Check if a plaque has valid coordinates
 */
export const hasValidCoords = (plaque: Plaque): boolean => {
  return coordsToLatLng(plaque) !== null;
};

/**
 * Filter plaques by distance from a center point
 */
export const filterPlaquesByDistance = (
  plaques: Plaque[],
  center: [number, number],
  radiusKm: number
): Plaque[] => {
  return plaques.filter(plaque => {
    const coords = coordsToLatLng(plaque);
    if (!coords) {
      return false;
    }
    
    const distance = calculateDistance(center[0], center[1], coords[0], coords[1]);
    return distance <= radiusKm;
  });
};

/**
 * Get map bounds for a collection of plaques
 */
export const getPlaquesBounds = (plaques: Plaque[]): [[number, number], [number, number]] | null => {
  const validPlaques = plaques.filter(hasValidCoords);
  
  if (validPlaques.length === 0) {
    return null;
  }
  
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  
  validPlaques.forEach(plaque => {
    const coords = coordsToLatLng(plaque)!;
    minLat = Math.min(minLat, coords[0]);
    maxLat = Math.max(maxLat, coords[0]);
    minLng = Math.min(minLng, coords[1]);
    maxLng = Math.max(maxLng, coords[1]);
  });
  
  return [[minLat, minLng], [maxLat, maxLng]];
};

/**
 * Generate a color for a plaque marker based on its properties
 */
export const getPlaqueColor = (plaque: Plaque): string => {
  // Use plaque.color field if available
  if (plaque.color) {
    const color = plaque.color.toLowerCase();
    
    switch (color) {
      case 'blue':
        return '#3b82f6'; // blue-500
      case 'green':
        return '#10b981'; // green-500
      case 'brown':
        return '#b45309'; // amber-700
      case 'black':
        return '#1f2937'; // gray-800
      case 'grey':
      case 'gray':
        return '#4b5563'; // gray-600
    }
  }
  
  // Fallback to profession-based color
  if (plaque.profession) {
    const profession = plaque.profession.toLowerCase();
    
    if (profession.includes('author') || profession.includes('writer') || profession.includes('poet')) {
      return '#8b5cf6'; // violet-500
    }
    
    if (profession.includes('artist') || profession.includes('painter') || profession.includes('sculptor')) {
      return '#ec4899'; // pink-500
    }
    
    if (profession.includes('scient') || profession.includes('physic') || profession.includes('math')) {
      return '#14b8a6'; // teal-500
    }
    
    if (profession.includes('polit') || profession.includes('leader') || profession.includes('minister')) {
      return '#f59e0b'; // amber-500
    }
  }
  
  // Default color
  return '#3b82f6'; // blue-500
};

/**
 * Generate a marker size based on plaque properties
 * For example, make more significant plaques slightly larger
 */
export const getPlaqueMarkerSize = (plaque: Plaque): number => {
  // Base size
  let size = 30;
  
  // Adjust for visited status
  if (plaque.visited) {
    size += 2;
  }
  
  // Could adjust for other properties like importance
  
  return size;
};

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

/**
 * Calculate approximate walking time between two points in minutes
 * Assumes average walking speed of 5 km/h
 */
export const calculateWalkingTime = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  // 5 km/h = 12 minutes per kilometer
  return Math.round(distance * 12);
};

/**
 * Create Leaflet LatLngBounds from array of plaques
 */
export const createBoundsFromPlaques = (plaques: Plaque[], L: any): any | null => {
  const validPlaques = plaques.filter(hasValidCoords);
  
  if (validPlaques.length === 0 || !L) {
    return null;
  }
  
  const latLngs = validPlaques.map(plaque => {
    const coords = coordsToLatLng(plaque)!;
    return L.latLng(coords[0], coords[1]);
  });
  
  return L.latLngBounds(latLngs);
};