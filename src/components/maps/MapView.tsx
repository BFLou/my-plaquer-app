// src/components/maps/MapView.tsx - Updated to support both handlers
import React, { useEffect, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import { useMap } from '@/components/maps/core/useMap';
import { useMarkers } from '@/components/maps/core/useMarkers';
import { useRoute } from '@/components/maps/core/useRoute';
import { useDistanceCircle } from '@/components/maps/core/useDistanceCircle';

interface MapViewProps {
  plaques: Plaque[];
  center: [number, number];
  zoom: number;
  routeMode: boolean;
  routePoints: Plaque[];
  onPlaqueClick: (plaque: Plaque) => void;
  onAddToRoute?: (plaque: Plaque) => void; // NEW: Separate handler for route actions
  filterCenter: [number, number] | null;
  filterRadius: number;
  filterEnabled: boolean;
  filterLocationName?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  plaques,
  center,
  zoom,
  routeMode,
  routePoints,
  onPlaqueClick,
  onAddToRoute, // NEW: Pass through the add to route handler
  filterCenter,
  filterRadius,
  filterEnabled,
  filterLocationName
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { map, isReady } = useMap(mapRef, { center, zoom });
  
  // Add markers with enhanced clustering and BOTH handlers
  useMarkers(map, plaques, {
    onMarkerClick: onPlaqueClick,
    onAddToRoute: onAddToRoute, // Pass the separate route handler
    routeMode
  });
  
  // Add route line
  useRoute(map, routePoints);
  
  // Add enhanced distance circle with location name
  useDistanceCircle(map, {
    center: filterCenter,
    radius: filterRadius,
    enabled: filterEnabled,
    locationName: filterLocationName
  });
  
  // Update view when center/zoom changes
  useEffect(() => {
    if (map && isReady) {
      map.setView(center, zoom);
    }
  }, [map, isReady, center, zoom]);
  
  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};