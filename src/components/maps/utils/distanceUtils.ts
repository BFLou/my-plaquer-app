// src/components/maps/utils/distanceUtils.ts - Robust distance calculation utilities

/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Validate input coordinates
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    console.warn('Invalid coordinates provided to calculateDistance:', { lat1, lon1, lat2, lon2 });
    return Infinity; // Return large distance for invalid coordinates
  }

  // Convert degrees to radians
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Validate if coordinates are valid for London area
 * @param lat Latitude in decimal degrees
 * @param lon Longitude in decimal degrees
 * @returns True if coordinates are valid
 */
export function isValidCoordinate(lat: number, lon: number): boolean {
  // Check for NaN or undefined
  if (isNaN(lat) || isNaN(lon) || lat === undefined || lon === undefined) {
    return false;
  }
  
  // Check for reasonable bounds (London area with some buffer)
  // London is roughly between 51.2-51.7°N and -0.5-0.3°E
  const isValidLat = lat >= 51.0 && lat <= 52.0;
  const isValidLon = lon >= -1.0 && lon <= 1.0;
  
  return isValidLat && isValidLon;
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Parse coordinate string to number with validation
 * @param coord Coordinate as string or number
 * @returns Parsed coordinate or null if invalid
 */
export function parseCoordinate(coord: string | number | null | undefined): number | null {
  if (coord === null || coord === undefined) {
    return null;
  }
  
  const parsed = typeof coord === 'string' ? parseFloat(coord) : coord;
  
  if (isNaN(parsed)) {
    return null;
  }
  
  return parsed;
}

/**
 * Filter plaques by distance from a center point
 * @param plaques Array of plaques to filter
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Filtered plaques within the radius
 */
export function filterPlaquesByDistance(
  plaques: any[], 
  centerLat: number, 
  centerLon: number, 
  radiusKm: number
): any[] {
  if (!isValidCoordinate(centerLat, centerLon)) {
    console.warn('Invalid center coordinates for filtering:', { centerLat, centerLon });
    return [];
  }

  return plaques.filter(plaque => {
    // Parse coordinates safely
    const lat = parseCoordinate(plaque.latitude);
    const lon = parseCoordinate(plaque.longitude);
    
    if (lat === null || lon === null) {
      console.debug(`Skipping plaque ${plaque.id} - invalid coordinates:`, { lat: plaque.latitude, lon: plaque.longitude });
      return false;
    }
    
    try {
      const distance = calculateDistance(centerLat, centerLon, lat, lon);
      const isWithinRadius = distance <= radiusKm;
      
      // Debug logging for first few plaques to help troubleshoot
      if (plaques.indexOf(plaque) < 5) {
        console.debug(`Plaque ${plaque.id}:`, {
          coordinates: { lat, lon },
          distance: distance.toFixed(3) + 'km',
          radius: radiusKm + 'km',
          withinRadius: isWithinRadius
        });
      }
      
      return isWithinRadius;
    } catch (error) {
      console.error(`Error calculating distance for plaque ${plaque.id}:`, error);
      return false;
    }
  });
}