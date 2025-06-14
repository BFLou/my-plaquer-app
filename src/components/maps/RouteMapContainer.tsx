// src/components/maps/RouteMapContainer.tsx - FIXED: No route duplication
import React, { useEffect, useRef, useState } from 'react';
import { Plaque } from '@/types/plaque';
import { RouteData } from '@/hooks/useRoutes';
import { calculateMultiWaypointRoute } from '@/services/WalkingDistanceService';

interface RouteMapContainerProps {
  route: RouteData;
  plaques: Plaque[];
  onPlaqueClick?: (plaque: Plaque) => void;
  className?: string;
  showRoute?: boolean;
  routeColor?: string;
  useWalkingRoutes?: boolean;
  onError?: () => void;
}

// FIXED: Helper function to safely convert coordinates to numbers
const getValidCoordinate = (coord: number | string | undefined): number => {
  if (typeof coord === 'number' && !isNaN(coord)) {
    return coord;
  }
  if (typeof coord === 'string') {
    const parsed = parseFloat(coord);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// FIXED: Helper to get valid coordinate pair
const getValidCoordinates = (plaque: Plaque): [number, number] => {
  const lat = getValidCoordinate(plaque.latitude);
  const lng = getValidCoordinate(plaque.longitude);
  return [lat, lng];
};

// FIXED: Filter out invalid plaques
const getValidPlaques = (plaques: Plaque[]): Array<Plaque & { validCoords: [number, number] }> => {
  return plaques
    .map(plaque => {
      const validCoords = getValidCoordinates(plaque);
      return { ...plaque, validCoords };
    })
    .filter(plaque => {
      const [lat, lng] = plaque.validCoords;
      return lat !== 0 || lng !== 0; // Filter out 0,0 coordinates
    });
};

const RouteMapContainer: React.FC<RouteMapContainerProps> = ({
  route,
  plaques,
  onPlaqueClick,
  className = '',
  showRoute = true,
  routeColor = '#22c55e',
  useWalkingRoutes = false,
  onError
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const initializingRef = useRef(false);
  const [walkingRouteGeometry, setWalkingRouteGeometry] = useState<[number, number][][]>([]);
  const [isLoadingWalkingRoute, setIsLoadingWalkingRoute] = useState(false);

  // Load walking route data
  const loadWalkingRoute = async (validPlaques: Array<Plaque & { validCoords: [number, number] }>) => {
    if (!useWalkingRoutes || validPlaques.length < 2) {
      console.log('🚶 Walking routes disabled or insufficient plaques:', { 
        useWalkingRoutes, 
        plaqueCount: validPlaques.length 
      });
      setIsLoadingWalkingRoute(false);
      return;
    }

    try {
      setIsLoadingWalkingRoute(true);
      console.log('🚶 Loading walking route for', validPlaques.length, 'plaques');
      
      const routeData = await calculateMultiWaypointRoute(validPlaques);
      
      console.log('🚶 Walking route result:', {
        totalDistance: routeData.totalDistance,
        totalDuration: routeData.totalDuration,
        segmentCount: routeData.segments?.length || 0,
        hasError: !!routeData.error
      });
      
      if (routeData.segments && routeData.segments.length > 0) {
        const geometry = routeData.segments.map(segment => segment.route.geometry);
        setWalkingRouteGeometry(geometry);
        console.log('✅ Walking route loaded successfully - should show GREEN lines');
      } else {
        console.log('⚠️ No walking route geometry available - will show YELLOW fallback');
        setWalkingRouteGeometry([]);
      }
    } catch (error) {
      console.error('❌ Error loading walking route - will show YELLOW fallback:', error);
      setWalkingRouteGeometry([]);
    } finally {
      setIsLoadingWalkingRoute(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeMap = async () => {
      // Prevent multiple initializations
      if (initializingRef.current || !mapRef.current) return;
      
      // FIXED: Get valid plaques first
      const validPlaques = getValidPlaques(plaques);
      if (!validPlaques.length) {
        console.warn('No valid plaques with coordinates found');
        if (onError) onError();
        return;
      }
      
      initializingRef.current = true;

      try {
        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Import Leaflet
        const L = (await import('leaflet')).default;
        
        // Fix marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        if (!mounted || !mapRef.current) return;

        // FIXED: Calculate center from valid coordinates
        const coords = validPlaques.map(p => p.validCoords);
        const lats = coords.map(([lat]) => lat);
        const lngs = coords.map(([, lng]) => lng);
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

        // Create map
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([centerLat, centerLng], 13);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Create stable click handler
        const createClickHandler = (plaque: Plaque) => {
          return () => {
            if (onPlaqueClick) {
              onPlaqueClick(plaque);
            }
          };
        };

        // FIXED: Add markers with proper coordinate handling
        const markers: any[] = [];
        validPlaques.forEach((plaque, index) => {
          const [lat, lng] = plaque.validCoords;

          // Create marker icon
          let backgroundColor = '#3b82f6';
          let label = (index + 1).toString();

          if (index === 0) {
            backgroundColor = '#22c55e';
            label = 'S';
          } else if (index === validPlaques.length - 1) {
            backgroundColor = '#ef4444';
            label = 'E';
          }

          const iconHtml = `
            <div style="
              background-color: ${backgroundColor};
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${label}
            </div>
          `;

          const icon = L.divIcon({
            className: 'custom-route-marker',
            html: iconHtml,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const marker = L.marker([lat, lng], { icon }).addTo(map);
          
          // Add click handler
          marker.on('click', createClickHandler(plaque));
          
          // Add popup
          const popupContent = `
            <div style="padding: 4px; min-width: 150px;">
              <div style="font-weight: bold; font-size: 13px; margin-bottom: 2px;">
                ${index === 0 ? 'Start' : index === validPlaques.length - 1 ? 'End' : `Stop ${index + 1}`}: ${plaque.title}
              </div>
              <div style="font-size: 11px; color: #666; margin-bottom: 4px;">
                ${plaque.location || plaque.address || ''}
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
          markers.push(marker);
        });

        // FIXED: DON'T add any routes here - wait for walking routes to load
        console.log('🗺️ Map initialized, deferring route rendering until walking route calculation completes');

        // Load walking route if enabled
        if (useWalkingRoutes) {
          await loadWalkingRoute(validPlaques);
        } else {
          // If not using walking routes, set loading to false so fallback renders
          setIsLoadingWalkingRoute(false);
        }

        // FIXED: Calculate bounds directly from coordinates
        if (validPlaques.length > 0) {
          const coords: [number, number][] = validPlaques.map(p => p.validCoords);
          const bounds = L.latLngBounds(coords);
          map.fitBounds(bounds.pad(0.05));
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        if (onError) onError();
      } finally {
        initializingRef.current = false;
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []); // Empty dependency array - only initialize once

  // FIXED: Handle route rendering - only add ONE type of route
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    const validPlaques = getValidPlaques(plaques);
    
    // Remove ALL existing route lines
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer.options?.className === 'walking-route-line' || 
          layer.options?.className === 'fallback-route-line') {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Only add routes after walking route calculation is complete AND if we should show routes
    if (!isLoadingWalkingRoute && showRoute && validPlaques.length > 1) {
      if (useWalkingRoutes && walkingRouteGeometry.length > 0) {
        // Add REAL walking routes (GREEN, SOLID)
        console.log('✅ Adding real walking routes (GREEN)');
        walkingRouteGeometry.forEach((geometry, index) => {
          if (geometry && geometry.length >= 2) {
            const routeLine = L.polyline(geometry, {
              color: routeColor, // Green
              weight: 4,
              opacity: 0.8,
              smoothFactor: 1,
              className: 'walking-route-line'
            });

            routeLine.on('mouseover', function(this: L.Polyline) {
              this.setStyle({
                weight: 6,
                opacity: 1
              });
            });

            routeLine.on('mouseout', function(this: L.Polyline) {
              this.setStyle({
                weight: 4,
                opacity: 0.8
              });
            });

            routeLine.bindPopup(`
              <div class="text-sm">
                <div class="font-medium">🚶 Walking Route Segment ${index + 1}</div>
                <div class="text-xs text-green-600 mt-1">
                  ✅ Real walking path
                </div>
              </div>
            `);

            routeLine.addTo(mapInstanceRef.current);
          }
        });
      } else {
        // Only add fallback if walking routes failed or disabled (YELLOW, DASHED)
        console.log('⚠️ Adding fallback straight-line route (YELLOW/ORANGE)');
        const routeCoords: [number, number][] = validPlaques.map(plaque => plaque.validCoords);
        
        if (routeCoords.length > 1) {
          const fallbackLine = L.polyline(routeCoords, {
            color: '#f59e0b', // Amber for fallback
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 4',
            className: 'fallback-route-line'
          });

          fallbackLine.bindPopup(`
            <div class="text-sm">
              <div class="font-medium">📍 Estimated Route</div>
              <div class="text-xs text-amber-600 mt-1">
                ⚠️ Direct line estimate
              </div>
            </div>
          `);

          fallbackLine.addTo(mapInstanceRef.current);
        }
      }
    }
  }, [walkingRouteGeometry, routeColor, isLoadingWalkingRoute, showRoute, useWalkingRoutes, plaques.map(p => p.id).join(',')]);

  // FIXED: Get valid plaques for display
  const validPlaques = getValidPlaques(plaques);

  if (!validPlaques.length) {
    return (
      <div className={`relative ${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-8">
          <div className="text-gray-500 mb-2">No valid coordinates found</div>
          <div className="text-sm text-gray-400">
            {plaques.length} plaques found, but none have valid coordinates
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Route info overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3">
        <div className="text-sm font-medium text-gray-900 mb-1">{route.name}</div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>📍 {validPlaques.length} stops</div>
          <div>📏 {route.total_distance.toFixed(1)} km</div>
          <div>⏱️ ~{Math.ceil(route.total_distance * 12)} min walk</div>
          {useWalkingRoutes && (
            <div className={isLoadingWalkingRoute ? "text-blue-600" : walkingRouteGeometry.length > 0 ? "text-green-600" : "text-amber-600"}>
              {isLoadingWalkingRoute ? '🔄 Loading walking route...' : 
               walkingRouteGeometry.length > 0 ? '✅ Real walking paths' : '⚠️ Estimated paths'}
            </div>
          )}
        </div>
        {plaques.length !== validPlaques.length && (
          <div className="text-xs text-amber-600 mt-1">
            ⚠️ {plaques.length - validPlaques.length} stops missing coordinates
          </div>
        )}
      </div>

      {/* Map container */}
      <div 
        ref={mapRef} 
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default RouteMapContainer;