// src/components/maps/RouteMapContainer.tsx - ENHANCED: Aligned with app UI/UX
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Plaque } from '@/types/plaque';
import { RouteData } from '@/hooks/useRoutes';
import { calculateMultiWaypointRoute } from '@/services/WalkingDistanceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Navigation,
  Clock,
  MapPin,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader,
} from 'lucide-react';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import L from 'leaflet';

interface RouteMapContainerProps {
  route: RouteData;
  plaques: Plaque[];
  onPlaqueClick?: (plaque: Plaque) => void;
  className?: string;
  showRoute?: boolean;
  routeColor?: string;
  useWalkingRoutes?: boolean;
  onError?: () => void;
  showStats?: boolean;
  allowFullscreen?: boolean;
}

// Helper functions for coordinate validation
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

const getValidCoordinates = (plaque: Plaque): [number, number] => {
  const lat = getValidCoordinate(plaque.latitude);
  const lng = getValidCoordinate(plaque.longitude);
  return [lat, lng];
};

const getValidPlaques = (
  plaques: Plaque[]
): Array<Plaque & { validCoords: [number, number] }> => {
  return plaques
    .map((plaque) => {
      const validCoords = getValidCoordinates(plaque);
      return { ...plaque, validCoords };
    })
    .filter((plaque) => {
      const [lat, lng] = plaque.validCoords;
      return lat !== 0 || lng !== 0;
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
  onError,
  showStats = true,
  allowFullscreen = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const initializingRef = useRef(false);
  const mobile = isMobile();

  // Enhanced state management
  const [walkingRouteGeometry, setWalkingRouteGeometry] = useState<
    [number, number][][]
  >([]);
  const [isLoadingWalkingRoute, setIsLoadingWalkingRoute] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(mobile);

  // Get valid plaques for processing
  const validPlaques = useMemo(() => getValidPlaques(plaques), [plaques]);

  // Enhanced walking route loading
  const loadWalkingRoute = async (
    validPlaques: Array<Plaque & { validCoords: [number, number] }>
  ) => {
    if (!useWalkingRoutes || validPlaques.length < 2) {
      setIsLoadingWalkingRoute(false);
      return;
    }

    try {
      setIsLoadingWalkingRoute(true);
      const routeData = await calculateMultiWaypointRoute(validPlaques);

      if (routeData.segments && routeData.segments.length > 0) {
        const geometry = routeData.segments.map(
          (segment) => segment.route.geometry
        );
        setWalkingRouteGeometry(geometry);
      } else {
        setWalkingRouteGeometry([]);
      }
    } catch (error) {
      console.error('Error loading walking route:', error);
      setWalkingRouteGeometry([]);
    } finally {
      setIsLoadingWalkingRoute(false);
    }
  };

  // Enhanced map initialization
  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      if (initializingRef.current || !mapRef.current || !validPlaques.length)
        return;

      initializingRef.current = true;

      try {
        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const L = (await import('leaflet')).default;

        // Fix marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        if (!mounted || !mapRef.current) return;

        // Calculate center from valid coordinates
        const coords = validPlaques.map((p) => p.validCoords);
        const lats = coords.map(([lat]) => lat);
        const lngs = coords.map(([, lng]) => lng);
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

        // Create map with enhanced styling
        const map = L.map(mapRef.current, {
          zoomControl: false, // We'll add custom controls
          attributionControl: true,
          preferCanvas: true,
          renderer: L.canvas({ padding: 0.5 }),
        }).setView([centerLat, centerLng], 13);

        // Add modern tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          className: 'map-tiles',
        }).addTo(map);

        mapInstanceRef.current = map;
        setMapReady(true);

        // Create enhanced markers
        const markers: any[] = [];
        validPlaques.forEach((plaque, index) => {
          const [lat, lng] = plaque.validCoords;

          let backgroundColor = '#3b82f6';
          let borderColor = '#1d4ed8';
          let label = (index + 1).toString();

          if (index === 0) {
            backgroundColor = '#22c55e';
            borderColor = '#16a34a';
            label = 'S';
          } else if (index === validPlaques.length - 1) {
            backgroundColor = '#ef4444';
            borderColor = '#dc2626';
            label = 'E';
          }

          const iconHtml = `
            <div style="
              background: linear-gradient(135deg, ${backgroundColor}, ${borderColor});
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              transition: transform 0.2s ease;
              cursor: pointer;
            " class="route-marker">
              ${label}
            </div>
          `;

          const icon = L.divIcon({
            className: 'custom-route-marker',
            html: iconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([lat, lng], { icon }).addTo(map);

          // Enhanced click handler
          if (onPlaqueClick) {
            marker.on('click', () => {
              if (mobile) triggerHapticFeedback('selection');
              onPlaqueClick(plaque);
            });
          }

          // Enhanced popup
          const popupContent = `
            <div class="route-popup" style="padding: 8px; min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1f2937;">
                ${index === 0 ? '🚶 Start' : index === validPlaques.length - 1 ? '🏁 End' : `📍 Stop ${index + 1}`}
              </div>
              <div style="font-weight: 500; font-size: 13px; margin-bottom: 6px; color: #374151;">
                ${plaque.title}
              </div>
              <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">
                ${plaque.location || plaque.address || 'Location not specified'}
              </div>
              ${
                plaque.profession
                  ? `
                <div style="margin-top: 6px;">
                  <span style="
                    background: #ddd6fe; 
                    color: #6d28d9; 
                    padding: 2px 6px; 
                    border-radius: 12px; 
                    font-size: 10px; 
                    font-weight: 500;
                  ">
                    ${plaque.profession}
                  </span>
                </div>
              `
                  : ''
              }
            </div>
          `;

          marker.bindPopup(popupContent, {
            className: 'route-marker-popup',
            maxWidth: 250,
            offset: [0, -10],
          });

          markers.push(marker);
        });

        // Load walking route if enabled
        if (useWalkingRoutes) {
          await loadWalkingRoute(validPlaques);
        } else {
          setIsLoadingWalkingRoute(false);
        }

        // Fit bounds with proper padding
        if (validPlaques.length > 0) {
          const coords: [number, number][] = validPlaques.map(
            (p) => p.validCoords
          );
          const bounds = L.latLngBounds(coords);
          map.fitBounds(bounds, {
            padding: mobile ? [20, 20] : [40, 40],
            maxZoom: 16,
          });
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
  }, [validPlaques.length]);

  // Enhanced route rendering
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    const L = (window as any).L;

    // Remove existing route lines
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (
        layer.options?.className === 'walking-route-line' ||
        layer.options?.className === 'fallback-route-line'
      ) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    if (!isLoadingWalkingRoute && showRoute && validPlaques.length > 1) {
      if (useWalkingRoutes && walkingRouteGeometry.length > 0) {
        // Real walking routes
        walkingRouteGeometry.forEach((geometry, index) => {
          if (geometry && geometry.length >= 2) {
            const routeLine = L.polyline(geometry, {
              color: routeColor,
              weight: 4,
              opacity: 0.8,
              smoothFactor: 1,
              lineCap: 'round',
              lineJoin: 'round',
              className: 'walking-route-line',
            });

            routeLine.on('mouseover', function (this: L.Polyline) {
              this.setStyle({ weight: 6, opacity: 1 });
            });

            routeLine.on('mouseout', function (this: L.Polyline) {
              this.setStyle({ weight: 4, opacity: 0.8 });
            });

            routeLine.bindPopup(`
              <div style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-weight: 600; color: #059669;">🚶 Walking Route Segment ${index + 1}</div>
                <div style="font-size: 11px; color: #10b981; margin-top: 4px;">
                  ✅ Optimized walking path
                </div>
              </div>
            `);

            routeLine.addTo(mapInstanceRef.current);
          }
        });
      } else {
        // Fallback straight-line route
        const routeCoords: [number, number][] = validPlaques.map(
          (plaque) => plaque.validCoords
        );

        if (routeCoords.length > 1) {
          const fallbackLine = L.polyline(routeCoords, {
            color: '#f59e0b',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 5',
            lineCap: 'round',
            className: 'fallback-route-line',
          });

          fallbackLine.bindPopup(`
            <div style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="font-weight: 600; color: #d97706;">📍 Estimated Route</div>
              <div style="font-size: 11px; color: #f59e0b; margin-top: 4px;">
                ⚠️ Direct line approximation
              </div>
            </div>
          `);

          fallbackLine.addTo(mapInstanceRef.current);
        }
      }
    }
  }, [
    walkingRouteGeometry,
    routeColor,
    isLoadingWalkingRoute,
    showRoute,
    useWalkingRoutes,
    mapReady,
  ]);

  // Map control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
      if (mobile) triggerHapticFeedback('light');
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
      if (mobile) triggerHapticFeedback('light');
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && validPlaques.length > 0) {
      const coords: [number, number][] = validPlaques.map((p) => p.validCoords);
      const bounds = L.latLngBounds(coords);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: mobile ? [20, 20] : [40, 40],
        maxZoom: 16,
      });
      if (mobile) triggerHapticFeedback('medium');
    }
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (mobile) triggerHapticFeedback('medium');

    // Invalidate map size after fullscreen toggle
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);
  };

  // Error state
  if (!validPlaques.length) {
    return (
      <Card className={`${className} bg-gray-50`}>
        <CardContent className="flex items-center justify-center h-64 p-8">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">No valid coordinates found</div>
            <div className="text-sm text-gray-400">
              {plaques.length} plaques found, but none have valid coordinates
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white'
    : `relative ${className}`;

  return (
    <div className={containerClasses}>
      <div className="relative h-full w-full bg-gray-100 rounded-lg overflow-hidden">
        {/* Enhanced Stats Overlay */}
        {showStats && (
          <Card
            className={`absolute top-4 left-4 z-[1000] shadow-lg border-0 ${
              statsCollapsed
                ? 'w-auto'
                : mobile
                  ? 'max-w-[calc(100vw-120px)]'
                  : 'w-80'
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div
                  className={statsCollapsed ? 'flex items-center gap-2' : ''}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation
                      size={16}
                      className="text-green-600 flex-shrink-0"
                    />
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {route.name}
                    </h3>
                  </div>

                  {!statsCollapsed && (
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                          <MapPin size={12} />
                        </div>
                        <div className="font-semibold text-gray-900">
                          {validPlaques.length}
                        </div>
                        <div className="text-gray-500">stops</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                          <Navigation size={12} />
                        </div>
                        <div className="font-semibold text-gray-900">
                          {route.total_distance.toFixed(1)} km
                        </div>
                        <div className="text-gray-500">distance</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                          <Clock size={12} />
                        </div>
                        <div className="font-semibold text-gray-900">
                          ~{Math.ceil(route.total_distance * 12)} min
                        </div>
                        <div className="text-gray-500">walk</div>
                      </div>
                    </div>
                  )}

                  {!statsCollapsed && useWalkingRoutes && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div
                        className={`text-xs flex items-center gap-1 ${
                          isLoadingWalkingRoute
                            ? 'text-blue-600'
                            : walkingRouteGeometry.length > 0
                              ? 'text-green-600'
                              : 'text-amber-600'
                        }`}
                      >
                        {isLoadingWalkingRoute ? (
                          <>
                            <Loader size={10} className="animate-spin" />
                            Loading walking route...
                          </>
                        ) : walkingRouteGeometry.length > 0 ? (
                          <>✅ Real walking paths</>
                        ) : (
                          <>⚠️ Estimated paths</>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatsCollapsed(!statsCollapsed)}
                  className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                >
                  {statsCollapsed ? (
                    <Maximize2 size={12} />
                  ) : (
                    <Minimize2 size={12} />
                  )}
                </Button>
              </div>

              {plaques.length !== validPlaques.length && (
                <div className="mt-2 pt-2 border-t border-amber-100">
                  <div className="text-xs text-amber-600 flex items-center gap-1">
                    ⚠️ {plaques.length - validPlaques.length} stops missing
                    coordinates
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhanced Map Controls */}
        <div
          className={`absolute z-[1000] flex flex-col gap-2 ${
            mobile ? 'top-4 right-4' : 'bottom-4 right-4'
          }`}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="w-10 h-10 p-0 rounded-none border-b border-gray-200 hover:bg-gray-50"
            >
              <ZoomIn size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="w-10 h-10 p-0 rounded-none hover:bg-gray-50"
            >
              <ZoomOut size={16} />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetView}
            className="w-10 h-10 p-0 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
            title="Reset view"
          >
            <RotateCcw size={16} />
          </Button>

          {allowFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFullscreen}
              className="w-10 h-10 p-0 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          )}
        </div>

        {/* Map Container */}
        <div
          ref={mapRef}
          className="h-full w-full"
          style={{ minHeight: isFullscreen ? '100vh' : '400px' }}
        />

        {/* Loading Overlay */}
        {!mapReady && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 text-sm">Loading map...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMapContainer;
