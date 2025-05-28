// src/components/maps/core/useRoute.ts
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Plaque } from '@/types/plaque';

export const useRoute = (map: L.Map | null, routePoints: Plaque[]) => {
  const routeLineRef = useRef<L.Polyline | null>(null);
  const routeMarkersRef = useRef<L.Marker[]>([]);
  
  useEffect(() => {
    if (!map) return;
    
    // Clear existing route
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
    }
    
    routeMarkersRef.current.forEach(marker => map.removeLayer(marker));
    routeMarkersRef.current = [];
    
    if (routePoints.length < 2) return;
    
    // Create route line
    const coordinates = routePoints.map(p => [
      parseFloat(p.latitude as string),
      parseFloat(p.longitude as string)
    ] as L.LatLngTuple);
    
    const routeLine = L.polyline(coordinates, {
      color: '#10b981',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10'
    }).addTo(map);
    
    routeLineRef.current = routeLine;
    
    // Add route markers
    routePoints.forEach((point, index) => {
      const lat = parseFloat(point.latitude as string);
      const lng = parseFloat(point.longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      const color = index === 0 ? '#22c55e' : 
                   index === routePoints.length - 1 ? '#ef4444' : 
                   '#3b82f6';
      
      const label = String.fromCharCode(65 + index);
      
      const icon = L.divIcon({
        className: 'route-marker',
        html: `
          <div style="
            width: 30px;
            height: 30px;
            background-color: ${color};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${label}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      routeMarkersRef.current.push(marker);
    });
    
  }, [map, routePoints]);
};