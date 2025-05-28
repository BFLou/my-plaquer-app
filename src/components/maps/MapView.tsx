// src/components/maps/MapView.tsx
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
  filterCenter: [number, number] | null;
  filterRadius: number;
  filterEnabled: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  plaques,
  center,
  zoom,
  routeMode,
  routePoints,
  onPlaqueClick,
  filterCenter,
  filterRadius,
  filterEnabled
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { map, isReady } = useMap(mapRef, { center, zoom });
  
  // Add markers
  useMarkers(map, plaques, {
    onMarkerClick: onPlaqueClick,
    routeMode
  });
  
  // Add route line
  useRoute(map, routePoints);
  
  // Add distance circle
  useDistanceCircle(map, {
    center: filterCenter,
    radius: filterRadius,
    enabled: filterEnabled
  });
  
  // Update view when center/zoom changes
  useEffect(() => {
    if (map && isReady) {
      map.setView(center, zoom);
    }
  }, [map, isReady, center, zoom]);
  
  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};