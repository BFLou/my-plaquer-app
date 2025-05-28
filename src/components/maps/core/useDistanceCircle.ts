// src/components/maps/core/useDistanceCircle.ts
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface DistanceCircleOptions {
  center: [number, number] | null;
  radius: number;
  enabled: boolean;
}

export const useDistanceCircle = (
  map: L.Map | null,
  options: DistanceCircleOptions
) => {
  const circleRef = useRef<L.Circle | null>(null);
  
  useEffect(() => {
    if (!map) return;
    
    // Clear existing circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    
    // Add new circle if enabled
    if (options.enabled && options.center) {
      const circle = L.circle(options.center, {
        radius: options.radius * 1000, // Convert km to meters
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        color: '#3b82f6',
        weight: 2,
        dashArray: '5, 10'
      }).addTo(map);
      
      circleRef.current = circle;
    }
  }, [map, options.center, options.radius, options.enabled]);
};