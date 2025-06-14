// src/services/WalkingDistanceService.ts - WORKING MAPBOX IMPLEMENTATION
import { Plaque } from '@/types/plaque';

export interface WalkingStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: [number, number][];
  maneuver?: {
    type: string;
    modifier?: string;
    bearing_after?: number;
    bearing_before?: number;
  };
  voiceInstruction?: string;
}

export interface WalkingRoute {
  distance: number; // in meters
  duration: number; // in seconds
  steps: WalkingStep[];
  geometry: [number, number][];
  confidence: 'high' | 'medium' | 'low';
  source: 'mapbox' | 'estimated';
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
 * Validate coordinates are within valid ranges
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Calculate walking route using Mapbox Directions API
 */
export const calculateWalkingRoute = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> => {
  console.log(
    `🚶 Calculating Mapbox walking route from [${fromLat}, ${fromLng}] to [${toLat}, ${toLng}]`
  );

  // Check cache first
  const cached = routeCache.get(fromLat, fromLng, toLat, toLng);
  if (cached) {
    return cached;
  }

  // Try Mapbox first
  const route = await tryMapboxRoute(fromLat, fromLng, toLat, toLng);
  if (route) {
    console.log('🚶 ✅ Using Mapbox route');
    // Cache successful routes
    routeCache.set(fromLat, fromLng, toLat, toLng, route);
    return route;
  }

  // Fallback to estimated route if Mapbox fails
  console.log('🚶 ⚠️ Using estimated walking route (Mapbox unavailable)');
  const estimatedRoute = calculateEstimatedWalkingRoute(
    fromLat,
    fromLng,
    toLat,
    toLng
  );
  return estimatedRoute;
};

/**
 * Mapbox Directions API - CORRECTED IMPLEMENTATION
 */
async function tryMapboxRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> {
  try {
    const API_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!API_TOKEN) {
      console.warn(
        '🚶 ❌ Mapbox access token not found - add VITE_MAPBOX_ACCESS_TOKEN to .env'
      );
      return null;
    }

    // Validate coordinates
    if (
      !isValidCoordinate(fromLat, fromLng) ||
      !isValidCoordinate(toLat, toLng)
    ) {
      console.error('🚶 ❌ Invalid coordinates provided');
      return null;
    }

    console.log('🚶 🔄 Requesting Mapbox Directions API...');

    // CORRECT: Mapbox Directions API URL format
    const coordinates = `${fromLng.toFixed(6)},${fromLat.toFixed(6)};${toLng.toFixed(6)},${toLat.toFixed(6)}`;

    // Build URL with proper parameters
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}` +
      `?alternatives=false` +
      `&geometries=geojson` +
      `&overview=full` +
      `&steps=true` +
      `&access_token=${API_TOKEN}`;

    console.log('🚶 📡 Mapbox URL:', url.replace(API_TOKEN, 'pk.***'));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `🚶 ❌ Mapbox API error: ${response.status} - ${errorText}`
      );

      // Check for specific error types
      if (response.status === 401) {
        console.error(
          '🚶 ❌ Invalid Mapbox token - check your VITE_MAPBOX_ACCESS_TOKEN'
        );
      } else if (response.status === 422) {
        console.error('🚶 ❌ Invalid coordinates or request parameters');
        console.error('🚶 🔍 Debug info:', {
          fromLat,
          fromLng,
          toLat,
          toLng,
          coordinates,
          isValidFrom: isValidCoordinate(fromLat, fromLng),
          isValidTo: isValidCoordinate(toLat, toLng),
        });
      }

      return null;
    }

    const data = await response.json();
    console.log('🚶 📨 Mapbox response received:', {
      code: data.code,
      routes: data.routes?.length || 0,
      message: data.message,
    });

    // Check for API errors
    if (data.code !== 'Ok') {
      console.error(
        '🚶 ❌ Mapbox API returned error code:',
        data.code,
        data.message
      );
      return null;
    }

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];

      if (!route.geometry?.coordinates) {
        console.error('🚶 ❌ No geometry in Mapbox response');
        return null;
      }

      // Convert GeoJSON coordinates [lng, lat] to [lat, lng]
      const geometry = route.geometry.coordinates.map(
        (coord: number[]) => [coord[1], coord[0]] as [number, number]
      );

      // Process walking steps with detailed instructions
      const steps =
        route.legs?.[0]?.steps?.map((step: any) => {
          const stepGeometry =
            step.geometry?.coordinates?.map(
              (coord: number[]) => [coord[1], coord[0]] as [number, number]
            ) || [];

          return {
            instruction: step.maneuver?.instruction || 'Continue',
            distance: step.distance || 0,
            duration: step.duration || 0,
            coordinates: stepGeometry,
            maneuver: {
              type: step.maneuver?.type || 'continue',
              modifier: step.maneuver?.modifier,
              bearing_after: step.maneuver?.bearing_after,
              bearing_before: step.maneuver?.bearing_before,
            },
            voiceInstruction: step.voiceInstructions?.[0]?.announcement,
          };
        }) || [];

      console.log('🚶 ✅ Mapbox route processed:', {
        distance: `${(route.distance / 1000).toFixed(2)}km`,
        duration: `${Math.round(route.duration / 60)}min`,
        geometryPoints: geometry.length,
        steps: steps.length,
      });

      return {
        distance: Math.round(route.distance || 0),
        duration: Math.round(route.duration || 0),
        geometry,
        steps,
        confidence: 'high',
        source: 'mapbox',
      };
    }

    console.warn('🚶 ⚠️ No routes found in Mapbox response');
    return null;
  } catch (error) {
    console.error('🚶 ❌ Mapbox routing error:', error);
    return null;
  }
}

/**
 * Fallback estimated route when Mapbox is unavailable
 */
function calculateEstimatedWalkingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): WalkingRoute {
  // Calculate straight-line distance
  const straightLineDistance = calculateHaversineDistance(
    fromLat,
    fromLng,
    toLat,
    toLng
  );

  // Apply walking factor for urban areas (1.4x for London streets)
  const walkingFactor = 1.4;
  const estimatedDistance = straightLineDistance * walkingFactor;

  // Estimate duration (average walking speed: 5 km/h = 1.39 m/s)
  const walkingSpeed = 1.39; // m/s
  const estimatedDuration = estimatedDistance / walkingSpeed;

  // Create simple path
  const geometry: [number, number][] = [
    [fromLat, fromLng],
    [toLat, toLng],
  ];

  return {
    distance: Math.round(estimatedDistance),
    duration: Math.round(estimatedDuration),
    geometry,
    steps: [
      {
        instruction: `Walk ${formatDistance(estimatedDistance)} to destination`,
        distance: estimatedDistance,
        duration: estimatedDuration,
        coordinates: geometry,
      },
    ],
    confidence: 'low',
    source: 'estimated',
  };
}

/**
 * Calculate route for multiple waypoints using Mapbox
 */
export const calculateMultiWaypointRoute = async (
  waypoints: Plaque[]
): Promise<{
  totalDistance: number;
  totalDuration: number;
  segments: RouteSegment[];
  error?: string;
}> => {
  console.log('🚶 Calculating Mapbox route for', waypoints.length, 'waypoints');

  if (waypoints.length < 2) {
    return {
      totalDistance: 0,
      totalDuration: 0,
      segments: [],
      error: 'At least 2 waypoints required',
    };
  }

  const segments: RouteSegment[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  let hasErrors = false;

  // Calculate route between each consecutive pair
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    console.log(
      `🚶 Segment ${i + 1}/${waypoints.length - 1}: ${from.title} → ${to.title}`
    );

    const fromLat = parseCoordinate(from.latitude);
    const fromLng = parseCoordinate(from.longitude);
    const toLat = parseCoordinate(to.latitude);
    const toLng = parseCoordinate(to.longitude);

    if (
      fromLat === null ||
      fromLng === null ||
      toLat === null ||
      toLng === null
    ) {
      console.warn(`🚶 ❌ Invalid coordinates for segment ${i + 1}`);
      hasErrors = true;
      continue;
    }

    try {
      const route = await calculateWalkingRoute(fromLat, fromLng, toLat, toLng);

      if (route && route.distance > 0) {
        segments.push({ from, to, route });
        totalDistance += route.distance;
        totalDuration += route.duration;

        console.log(`🚶 ✅ Segment ${i + 1} calculated:`, {
          distance: `${(route.distance / 1000).toFixed(2)}km`,
          duration: `${Math.round(route.duration / 60)}min`,
          source: route.source,
        });
      } else {
        console.error(`🚶 ❌ Failed to calculate segment ${i + 1}`);
        hasErrors = true;
      }
    } catch (error) {
      console.error(`🚶 ❌ Error calculating segment ${i + 1}:`, error);
      hasErrors = true;
    }

    // Rate limiting delay
    if (i < waypoints.length - 2) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  console.log('🚶 Route calculation complete:', {
    totalDistance: `${(totalDistance / 1000).toFixed(2)}km`,
    totalDuration: `${Math.round(totalDuration / 60)}min`,
    segments: segments.length,
    hasErrors,
  });

  return {
    totalDistance: Math.round(totalDistance),
    totalDuration: Math.round(totalDuration),
    segments,
    error: hasErrors
      ? 'Some route segments could not be calculated'
      : undefined,
  };
};

/**
 * SIMPLIFIED: Basic route optimization (no Mapbox Optimization API needed)
 */
export const optimizeRouteWithMapbox = async (
  waypoints: Plaque[]
): Promise<Plaque[]> => {
  // For now, just return the original order
  // You can implement nearest-neighbor optimization here if needed
  console.log('🚶 ℹ️ Using original waypoint order (optimization disabled)');
  return waypoints;
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
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

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
  return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
};

/**
 * Route cache for avoiding repeated API calls
 */
class RouteCache {
  private cache = new Map<string, WalkingRoute>();
  private maxCacheSize = 100;

  private getCacheKey(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): string {
    return `${fromLat.toFixed(6)},${fromLng.toFixed(6)}-${toLat.toFixed(6)},${toLng.toFixed(6)}`;
  }

  get(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): WalkingRoute | null {
    const key = this.getCacheKey(fromLat, fromLng, toLat, toLng);
    const cached = this.cache.get(key);
    if (cached) {
      console.log('🚶 📦 Using cached route');
      return cached;
    }
    return null;
  }

  set(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    route: WalkingRoute
  ): void {
    const key = this.getCacheKey(fromLat, fromLng, toLat, toLng);

    // Simple LRU: remove oldest when full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, route);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const routeCache = new RouteCache();
