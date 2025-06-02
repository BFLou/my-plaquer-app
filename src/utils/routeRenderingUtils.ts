// src/utils/routeRenderingUtils.ts - Fallback utilities for route rendering
import { Plaque } from '@/types/plaque';

/**
 * Create a simple straight-line route between plaques as fallback
 */
export const createFallbackRoute = (plaques: Plaque[]): [number, number][] => {
  if (plaques.length === 0) return [];
  
  return plaques.map(plaque => [
    parseFloat(plaque.latitude as string),
    parseFloat(plaque.longitude as string)
  ]);
};

/**
 * Create a more realistic route by adding intermediate points
 */
export const createEnhancedFallbackRoute = (plaques: Plaque[]): [number, number][] => {
  if (plaques.length === 0) return [];
  if (plaques.length === 1) return [[
    parseFloat(plaques[0].latitude as string),
    parseFloat(plaques[0].longitude as string)
  ]];

  const points: [number, number][] = [];
  
  for (let i = 0; i < plaques.length; i++) {
    const currentPlaque = plaques[i];
    const currentPoint: [number, number] = [
      parseFloat(currentPlaque.latitude as string),
      parseFloat(currentPlaque.longitude as string)
    ];
    
    points.push(currentPoint);
    
    // Add intermediate points between consecutive plaques (except for the last one)
    if (i < plaques.length - 1) {
      const nextPlaque = plaques[i + 1];
      const nextPoint: [number, number] = [
        parseFloat(nextPlaque.latitude as string),
        parseFloat(nextPlaque.longitude as string)
      ];
      
      // Calculate intermediate points to simulate road following
      const intermediatePoints = createIntermediatePoints(currentPoint, nextPoint);
      points.push(...intermediatePoints);
    }
  }
  
  return points;
};

/**
 * Create intermediate points between two locations to simulate road paths
 */
function createIntermediatePoints(
  start: [number, number], 
  end: [number, number]
): [number, number][] {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;
  
  // Calculate distance between points
  const distance = calculateHaversineDistance(startLat, startLng, endLat, endLng);
  
  // Only add intermediate points for longer distances (> 0.5km)
  if (distance < 0.5) return [];
  
  const numIntermediatePoints = Math.min(Math.floor(distance / 0.3), 5); // Max 5 intermediate points
  const points: [number, number][] = [];
  
  for (let i = 1; i <= numIntermediatePoints; i++) {
    const ratio = i / (numIntermediatePoints + 1);
    
    // Add some curve to make it look more like a road
    const curveFactor = Math.sin(ratio * Math.PI) * 0.0005; // Small curve
    
    const intermediateLat = startLat + (endLat - startLat) * ratio + curveFactor;
    const intermediateLng = startLng + (endLng - startLng) * ratio + curveFactor * 0.5;
    
    points.push([intermediateLat, intermediateLng]);
  }
  
  return points;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Get the bounds for a route to fit the map view
 */
export const getRouteBounds = (plaques: Plaque[]): [[number, number], [number, number]] | null => {
  if (plaques.length === 0) return null;
  
  const lats = plaques.map(p => parseFloat(p.latitude as string));
  const lngs = plaques.map(p => parseFloat(p.longitude as string));
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Add some padding
  const padding = 0.001;
  
  return [
    [minLat - padding, minLng - padding],
    [maxLat + padding, maxLng + padding]
  ];
};

/**
 * Format distance for display
 */
export const formatRouteDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Format walking time for display
 */
export const formatWalkingTime = (distanceKm: number): string => {
  const minutes = Math.round(distanceKm * 12); // 12 minutes per km
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
};

/**
 * Get appropriate map zoom level based on route distance
 */
export const getRouteZoomLevel = (plaques: Plaque[]): number => {
  if (plaques.length < 2) return 15;
  
  const bounds = getRouteBounds(plaques);
  if (!bounds) return 15;
  
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);
  
  // Determine zoom level based on the span
  if (maxDiff > 0.1) return 11;      // Wide area
  if (maxDiff > 0.05) return 12;     // Large area
  if (maxDiff > 0.02) return 13;     // Medium area
  if (maxDiff > 0.01) return 14;     // Small area
  return 15;                         // Very small area
};

export default {
  createFallbackRoute,
  createEnhancedFallbackRoute,
  getRouteBounds,
  formatRouteDistance,
  formatWalkingTime,
  getRouteZoomLevel
};