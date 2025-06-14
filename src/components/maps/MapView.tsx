// src/components/maps/MapView.tsx - FIXED: Walking routes support
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
  onAddToRoute?: (plaque: Plaque) => void;
  filterCenter: [number, number] | null;
  filterRadius: number;
  filterEnabled: boolean;
  filterLocationName?: string;
  useWalkingRoutes?: boolean; // NEW: Enable walking routes
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
  useWalkingRoutes = false // NEW: Default to false for backward compatibility
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { map, isReady } = useMap(mapRef as React.RefObject<HTMLDivElement>, { center, zoom });
  
  // Add markers with enhanced clustering and BOTH handlers
  useMarkers(map, plaques, {
    onMarkerClick: onPlaqueClick,
    onAddToRoute: onAddToRoute,
    routeMode
  });
  
  // FIXED: Add route line with walking routes support
  useRoute(map, routePoints, useWalkingRoutes);
  
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