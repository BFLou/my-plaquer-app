// src/components/maps/core/useRoute.ts - FIXED: Walking routes with WalkingDistanceService
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Plaque } from '@/types/plaque';
import {
  calculateMultiWaypointRoute,
  RouteSegment,
} from '@/services/WalkingDistanceService';

export const useRoute = (
  map: L.Map | null,
  routePoints: Plaque[],
  useWalkingRoutes: boolean = false
) => {
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const routeMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    console.log(
      '🗺️ useRoute: Processing route with',
      routePoints.length,
      'points, walking routes:',
      useWalkingRoutes
    );

    if (!map) {
      console.log('🗺️ useRoute: No map available');
      return;
    }

    // Clear existing route layers and markers
    if (routeLayersRef.current) {
      console.log('🗺️ useRoute: Removing existing route line');
      map.removeLayer(routeLayersRef.current);
      routeLayersRef.current = null;
    }

    routeMarkersRef.current.forEach((marker) => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    routeMarkersRef.current = [];

    if (routePoints.length < 2) {
      console.log('🗺️ useRoute: Not enough points for route');
      return;
    }

    // Create a layer group to hold all route elements
    const routeLayerGroup = L.layerGroup().addTo(map);
    routeLayersRef.current = routeLayerGroup;

    console.log('🗺️ useRoute: Starting route calculation...');

    // Function to create fallback straight-line routes
    const createFallbackRoute = () => {
      if (!routeLayersRef.current) return;

      for (let i = 0; i < routePoints.length - 1; i++) {
        const start = routePoints[i];
        const end = routePoints[i + 1];

        if (
          !start.latitude ||
          !start.longitude ||
          !end.latitude ||
          !end.longitude
        ) {
          continue;
        }

        const startLat =
          typeof start.latitude === 'string'
            ? parseFloat(start.latitude)
            : start.latitude;
        const startLng =
          typeof start.longitude === 'string'
            ? parseFloat(start.longitude)
            : start.longitude;
        const endLat =
          typeof end.latitude === 'string'
            ? parseFloat(end.latitude)
            : end.latitude;
        const endLng =
          typeof end.longitude === 'string'
            ? parseFloat(end.longitude)
            : end.longitude;

        if (
          isNaN(startLat) ||
          isNaN(startLng) ||
          isNaN(endLat) ||
          isNaN(endLng)
        ) {
          continue;
        }

        const fallbackLine = L.polyline(
          [
            [startLat, startLng],
            [endLat, endLng],
          ],
          {
            color: '#f59e0b', // amber-500 for fallback
            weight: 3,
            opacity: 0.7,
            dashArray: '15, 10',
            className: 'fallback-route-line',
          }
        );

        fallbackLine.bindPopup(`
          <div class="text-sm">
            <div class="font-medium">Estimated Route</div>
            <div class="text-gray-600">
              ${start.title} → ${end.title}
            </div>
            <div class="mt-1 text-amber-600">
              ⚠️ Direct line estimate
            </div>
          </div>
        `);

        routeLayerGroup.addLayer(fallbackLine);
      }
    };

    // Function to add route point markers
    const addRouteMarkers = () => {
      if (!routeLayersRef.current) return;

      routePoints.forEach((point, index) => {
        const lat =
          typeof point.latitude === 'string'
            ? parseFloat(point.latitude)
            : point.latitude;
        const lng =
          typeof point.longitude === 'string'
            ? parseFloat(point.longitude)
            : point.longitude;

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

        // Determine marker color and style
        let color: string;
        let label: string;

        if (index === 0) {
          color = '#22c55e'; // green-500 for start
          label = 'START';
        } else if (index === routePoints.length - 1) {
          color = '#ef4444'; // red-500 for end
          label = 'END';
        } else {
          color = '#3b82f6'; // blue-500 for waypoints
          label = (index + 1).toString();
        }

        // Create custom marker
        const icon = L.divIcon({
          className: 'route-marker-custom',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background-color: ${color};
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 3px solid white;
            ">
              ${
                index === 0 || index === routePoints.length - 1
                  ? `<div style="font-size: 8px; line-height: 1;">${label}</div>`
                  : label
              }
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([lat, lng], {
          icon,
          zIndexOffset: 1000,
        });

        marker.bindPopup(`
          <div class="text-sm">
            <div class="font-medium">
              ${index === 0 ? '🚶 Start: ' : index === routePoints.length - 1 ? '🏁 End: ' : `📍 Stop ${index + 1}: `}
              ${point.title}
            </div>
            <div class="text-gray-600 mt-1">
              ${point.location || point.address || 'No address'}
            </div>
            ${
              point.profession
                ? `
              <div class="text-xs text-blue-600 mt-1">
                ${point.profession}
              </div>
            `
                : ''
            }
          </div>
        `);

        routeLayerGroup.addLayer(marker);
        routeMarkersRef.current.push(marker);
      });
    };

    // Calculate walking route or use fallback
    const calculateRoute = async () => {
      // CRITICAL: Only use walking routes if specifically enabled
      if (useWalkingRoutes) {
        try {
          console.log('🚶 Calculating REAL walking routes...');
          const routeData = await calculateMultiWaypointRoute(routePoints);
          console.log('🚶 Walking route calculation result:', routeData);

          // Check if the component is still mounted and layer group exists
          if (
            !routeLayersRef.current ||
            !map.hasLayer(routeLayersRef.current)
          ) {
            console.log('🗺️ useRoute: Route layer group no longer exists');
            return;
          }

          // Add REAL walking route segments
          if (routeData.segments && routeData.segments.length > 0) {
            console.log(
              '🚶 Creating REAL walking route with',
              routeData.segments.length,
              'segments'
            );

            let totalCoordinates = 0;

            routeData.segments.forEach(
              (segment: RouteSegment, index: number) => {
                console.log(
                  `🚶 Processing walking segment ${index} with ${segment.route.geometry.length} geometry points`
                );

                if (
                  segment.route.geometry &&
                  segment.route.geometry.length >= 2
                ) {
                  // Create the REAL walking route line
                  const routeLine = L.polyline(segment.route.geometry, {
                    color: '#10b981', // green-500 - WALKING route color
                    weight: 4,
                    opacity: 0.8,
                    smoothFactor: 1,
                    // NO DASH - solid line for walking routes
                    className: 'walking-route-line',
                  });

                  routeLine.on('mouseover', function (this: L.Polyline) {
                    this.setStyle({
                      weight: 6,
                      opacity: 1,
                      color: '#059669', // green-600
                    });
                  });

                  routeLine.on('mouseout', function (this: L.Polyline) {
                    this.setStyle({
                      weight: 4,
                      opacity: 0.8,
                      color: '#10b981',
                    });
                  });

                  // Add popup with REAL route info
                  const distanceKm = (segment.route.distance / 1000).toFixed(1);
                  const durationMin = Math.round(segment.route.duration / 60);
                  routeLine.bindPopup(`
                  <div class="text-sm">
                    <div class="font-medium">🚶 Walking Route</div>
                    <div class="text-gray-600">
                      ${segment.from.title} → ${segment.to.title}
                    </div>
                    <div class="mt-1">
                      📍 ${distanceKm}km • ⏱️ ${durationMin} min
                    </div>
                    <div class="text-xs text-green-600 mt-1">
                      ✅ Real walking path
                    </div>
                  </div>
                `);

                  routeLayerGroup.addLayer(routeLine);
                  totalCoordinates += segment.route.geometry.length;
                }
              }
            );

            console.log(
              '🚶 Total coordinates for REAL walking route:',
              totalCoordinates
            );
            console.log('✅ Added REAL walking route to map');
          } else {
            console.log('🚶 No detailed walking route data, using fallback');
            createFallbackRoute();
          }
        } catch (error) {
          console.error('❌ Error calculating walking route:', error);
          console.log('🚶 Falling back to straight lines');
          createFallbackRoute();
        }
      } else {
        // Use simple straight-line routes when walking routes disabled
        console.log(
          '🗺️ Using simple straight-line routes (walking routes disabled)'
        );
        createFallbackRoute();
      }

      // Always add route point markers
      addRouteMarkers();
    };

    // Start the route calculation
    calculateRoute();

    // Cleanup function
    return () => {
      if (map && routeLayersRef.current) {
        map.removeLayer(routeLayersRef.current);
      }
      routeMarkersRef.current.forEach((marker) => {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    };
  }, [map, routePoints, useWalkingRoutes]); // Added useWalkingRoutes to dependencies
};
