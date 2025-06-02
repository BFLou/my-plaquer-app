// src/components/maps/RouteMapContainer.tsx - Fixed version without re-render loops
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
}

const RouteMapContainer: React.FC<RouteMapContainerProps> = ({
  route,
  plaques,
  onPlaqueClick,
  className = '',
  showRoute = true,
  routeColor = '#22c55e'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    const initializeMap = async () => {
      // Prevent multiple initializations
      if (initializingRef.current || !mapRef.current || !plaques.length) return;
      
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

        // Calculate center
        const lats = plaques.map(p => parseFloat(p.latitude as string));
        const lngs = plaques.map(p => parseFloat(p.longitude as string));
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

        // Add markers
        const markers: any[] = [];
        plaques.forEach((plaque, index) => {
          const lat = parseFloat(plaque.latitude as string);
          const lng = parseFloat(plaque.longitude as string);
          
          if (isNaN(lat) || isNaN(lng)) return;

          // Create marker icon
          let backgroundColor = '#3b82f6';
          let label = (index + 1).toString();

          if (index === 0) {
            backgroundColor = '#22c55e';
            label = 'S';
          } else if (index === plaques.length - 1) {
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
                ${index === 0 ? 'Start' : index === plaques.length - 1 ? 'End' : `Stop ${index + 1}`}: ${plaque.title}
              </div>
              <div style="font-size: 11px; color: #666; margin-bottom: 4px;">
                ${plaque.location || plaque.address || ''}
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
          markers.push(marker);
        });

        // Add route line if showRoute is true
        if (showRoute && plaques.length > 1) {
          const routeCoords = plaques.map(plaque => [
            parseFloat(plaque.latitude as string),
            parseFloat(plaque.longitude as string)
          ]).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

          if (routeCoords.length > 1) {
            L.polyline(routeCoords, {
              color: routeColor,
              weight: 3,
              opacity: 0.7,
              dashArray: '8, 4'
            }).addTo(map);
          }
        }

        // Fit bounds to show all markers
        if (markers.length > 0) {
          const group = new L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.05));
        }

      } catch (error) {
        console.error('Error initializing map:', error);
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

  // Handle plaques changes without reinitializing map
  useEffect(() => {
    if (!mapInstanceRef.current || !plaques.length) return;

    // Just re-fit bounds when plaques change
    try {
      const L = window.L || (global as any).L;
      if (L && mapInstanceRef.current) {
        const coords = plaques.map(plaque => [
          parseFloat(plaque.latitude as string),
          parseFloat(plaque.longitude as string)
        ]).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

        if (coords.length > 0) {
          const bounds = L.latLngBounds(coords);
          mapInstanceRef.current.fitBounds(bounds.pad(0.05));
        }
      }
    } catch (error) {
      console.warn('Error updating map bounds:', error);
    }
  }, [plaques.map(p => p.id).join(',')]); // Only when plaque IDs change

  return (
    <div className={`relative ${className}`}>
      {/* Route info overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3">
        <div className="text-sm font-medium text-gray-900 mb-1">{route.name}</div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>📍 {plaques.length} stops</div>
          <div>📏 {route.total_distance.toFixed(1)} km</div>
          <div>⏱️ ~{Math.ceil(route.total_distance * 12)} min walk</div>
        </div>
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