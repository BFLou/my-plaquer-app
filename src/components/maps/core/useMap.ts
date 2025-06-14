// src/components/maps/core/useMap.ts
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapOptions {
  center: [number, number];
  zoom: number;
}

// Make sure this is a named export
export const useMap = (
  containerRef: React.RefObject<HTMLDivElement>,
  options: MapOptions
) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [isReady, setIsReady] = useState(false);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    // Create map
    const mapInstance = L.map(containerRef.current, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstance);

    mapInstanceRef.current = mapInstance;
    setMap(mapInstance);
    setIsReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return { map, isReady };
};
