// src/components/maps/RouteMapContainer.tsx - FIXED: Proper coordinate type handling
import React, { useEffect, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import { RouteData } from '@/hooks/useRoutes';

interface RouteMapContainerProps {
  route: RouteData;
  plaques: Plaque[];
  onPlaqueClick?: (plaque: Plaque) => void;
  className?: string;
  showRoute?: boolean;
  routeColor?: string;
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
  onError
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const initializingRef = useRef(false);

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

        // FIXED: Add route line with proper coordinate types
        if (showRoute && validPlaques.length > 1) {
          const routeCoords: [number, number][] = validPlaques.map(plaque => plaque.validCoords);

          if (routeCoords.length > 1) {
            L.polyline(routeCoords, {
              color: routeColor,
              weight: 3,
              opacity: 0.7,
              dashArray: '8, 4'
            }).addTo(map);
          }
        }

        // FIXED: Calculate bounds directly from coordinates instead of using featureGroup
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

  // FIXED: Handle plaques changes without reinitializing map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const validPlaques = getValidPlaques(plaques);
    if (!validPlaques.length) return;

    // Just re-fit bounds when plaques change
    try {
      const L = (window as any).L;
      if (L && mapInstanceRef.current) {
        const coords: [number, number][] = validPlaques.map(plaque => plaque.validCoords);

        if (coords.length > 0) {
          const bounds = L.latLngBounds(coords);
          mapInstanceRef.current.fitBounds(bounds.pad(0.05));
        }
      }
    } catch (error) {
      console.warn('Error updating map bounds:', error);
    }
  }, [plaques.map(p => p.id).join(',')]); // Only when plaque IDs change

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