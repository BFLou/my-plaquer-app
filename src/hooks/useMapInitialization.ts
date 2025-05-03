import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapInitializationOptions {
  initialView?: [number, number];
  initialZoom?: number;
  maxZoom?: number;
  minZoom?: number;
  enableScrollZoom?: boolean;
}

/**
 * A custom hook for initializing and configuring a Leaflet map
 * with custom styles and behaviors
 */
export const useMapInitialization = (
  containerId: string,
  options: MapInitializationOptions = {}
) => {
  const mapRef = useRef<L.Map | null>(null);
  
  const {
    initialView = [51.505, -0.09], // Default to London coordinates
    initialZoom = 13,
    maxZoom = 19,
    minZoom = 3,
    enableScrollZoom = true,
  } = options;

  useEffect(() => {
    // Check if map is already initialized
    if (mapRef.current) return;

    // Add custom styles for map elements
    const style = document.createElement('style');
    style.innerHTML = `
      .compact-popup .leaflet-popup-content-wrapper {
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .compact-popup .leaflet-popup-content {
        margin: 0;
        padding: 0;
        width: auto !important;
      }
      .compact-popup .leaflet-popup-tip {
        background-color: white;
      }
      .plaque-popup button {
        transition: background-color 0.2s;
      }
      .plaque-popup button:hover {
        opacity: 0.9;
      }
      @keyframes dash {
        to {
          stroke-dashoffset: 1000;
        }
      }
      .route-line {
        stroke-dasharray: 5, 10;
        animation: dash 20s linear infinite;
      }
    `;
    document.head.appendChild(style);

    // Initialize the map
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) {
      console.error(`Map container with ID '${containerId}' not found.`);
      return;
    }

    const map = L.map(containerId, {
      center: initialView,
      zoom: initialZoom,
      maxZoom,
      minZoom,
      scrollWheelZoom: enableScrollZoom,
      zoomControl: true
    });

    // Add the OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Store the map reference
    mapRef.current = map;

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [containerId, initialView, initialZoom, maxZoom, minZoom, enableScrollZoom]);

  return { map: mapRef.current };
};

export default useMapInitialization;