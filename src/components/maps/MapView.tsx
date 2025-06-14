// src/components/maps/MapView.tsx - FIXED: Auto-centering and walking routes
import React, { useEffect, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import { useMap } from '@/components/maps/core/useMap';
import { useMarkers } from '@/components/maps/core/useMarkers';
import { useRoute } from '@/components/maps/core/useRoute';
import { useDistanceCircle } from '@/components/maps/core/useDistanceCircle';
import L from 'leaflet';

interface MapViewProps {
  plaques: Plaque[];
  center: [number, number];
  zoom: number;
  routeMode: boolean;
  routePoints: Plaque[];
  onPlaqueClick: (plaque: Plaque) => void;
  onAddToRoute?: (plaque: Plaque) => void;
  filterCenter: [number, number] | null;
  filterRadius: number;
  filterEnabled: boolean;
  filterLocationName?: string;
  useWalkingRoutes?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  plaques,
  center,
  zoom,
  routeMode,
  routePoints,
  onPlaqueClick,
  onAddToRoute,
  filterCenter,
  filterRadius,
  filterEnabled,
  filterLocationName,
  useWalkingRoutes = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const lastCenterRef = useRef<[number, number] | null>(null);
  const { map, isReady } = useMap(mapRef as React.RefObject<HTMLDivElement>, {
    center,
    zoom,
  });

  // Add markers with enhanced clustering
  useMarkers(map, plaques, {
    onMarkerClick: onPlaqueClick,
    onAddToRoute: onAddToRoute,
    routeMode,
  });

  // Add route line with walking routes support
  useRoute(map, routePoints, useWalkingRoutes);

  // Add enhanced distance circle with location name
  useDistanceCircle(map, {
    center: filterCenter,
    radius: filterRadius,
    enabled: filterEnabled,
    locationName: filterLocationName,
  });

  // CRITICAL FIX: Update view when center/zoom changes with proper comparison
  useEffect(() => {
    if (map && isReady) {
      const [newLat, newLng] = center;
      const lastCenter = lastCenterRef.current;
      
      // Check if center has actually changed to avoid unnecessary updates
      const centerChanged = !lastCenter || 
        Math.abs(lastCenter[0] - newLat) > 0.0001 || 
        Math.abs(lastCenter[1] - newLng) > 0.0001;

      if (centerChanged) {
        console.log('🗺️ MapView: Updating view to center:', center, 'zoom:', zoom);
        
        // Animate to new position
        map.setView(center, zoom, {
          animate: true,
          duration: 1.0,
          easeLinearity: 0.25
        });
        
        // Update reference
        lastCenterRef.current = center;
      }
    }
  }, [map, isReady, center, zoom]);

  // ADDITIONAL: Listen for custom map center events for force centering
  useEffect(() => {
    const handleForceMapCenter = (event: CustomEvent) => {
      if (map && isReady && event.detail?.center) {
        console.log('🗺️ MapView: Force centering map to:', event.detail.center);
        
        const newCenter = event.detail.center;
        const newZoom = event.detail.zoom || 14;
        
        // Force center with animation
        map.setView(newCenter, newZoom, {
          animate: true,
          duration: 1.2,
          easeLinearity: 0.1
        });
        
        // Update reference
        lastCenterRef.current = newCenter;
        
        // Optional: Add a temporary marker to show the center location
        if (event.detail.showMarker !== false) {
          const centerMarker = L.marker(newCenter, {
            icon: L.divIcon({
              className: 'center-location-marker',
              html: `
                <div class="center-marker">
                  <div class="center-marker-dot"></div>
                  <div class="center-marker-pulse"></div>
                </div>
                <style>
                  .center-marker {
                    position: relative;
                    width: 20px;
                    height: 20px;
                  }
                  .center-marker-dot {
                    width: 12px;
                    height: 12px;
                    background: #10b981;
                    border: 2px solid white;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
                    z-index: 2;
                  }
                  .center-marker-pulse {
                    width: 20px;
                    height: 20px;
                    background: rgba(16, 185, 129, 0.3);
                    border-radius: 50%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    animation: pulse-animation 2s infinite;
                  }
                  @keyframes pulse-animation {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                </style>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
          }).addTo(map);
          
          // Remove the marker after 3 seconds
          setTimeout(() => {
            if (map.hasLayer(centerMarker)) {
              map.removeLayer(centerMarker);
            }
          }, 3000);
        }
      }
    };

    // Add event listener
    window.addEventListener('forceMapCenter', handleForceMapCenter as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('forceMapCenter', handleForceMapCenter as EventListener);
    };
  }, [map, isReady]);

  // CRITICAL: Auto-center when filter location changes
  useEffect(() => {
    if (map && isReady && filterEnabled && filterCenter) {
      console.log('🗺️ MapView: Auto-centering on filter location:', filterCenter);
      
      const [filterLat, filterLng] = filterCenter;
      const lastCenter = lastCenterRef.current;
      
      // Check if this is a new filter location
      const isNewFilterLocation = !lastCenter || 
        Math.abs(lastCenter[0] - filterLat) > 0.001 || 
        Math.abs(lastCenter[1] - filterLng) > 0.001;

      if (isNewFilterLocation) {
        // Calculate appropriate zoom based on radius
        let autoZoom = 14;
        if (filterRadius <= 0.5) autoZoom = 15;
        else if (filterRadius <= 1) autoZoom = 14;
        else if (filterRadius <= 2) autoZoom = 13;
        else if (filterRadius <= 5) autoZoom = 12;
        else autoZoom = 11;

        // Animate to filter location
        map.setView(filterCenter, autoZoom, {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.1
        });
        
        // Update reference
        lastCenterRef.current = filterCenter;
        
        console.log(`🗺️ MapView: Centered on ${filterLocationName || 'selected location'} with zoom ${autoZoom}`);
      }
    }
  }, [map, isReady, filterEnabled, filterCenter, filterRadius, filterLocationName]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};