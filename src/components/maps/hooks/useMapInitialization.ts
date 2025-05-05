// src/components/maps/hooks/useMapInitialization.ts
// This replaces your existing useMapInitialization.ts file
import { useState, useEffect, useRef } from 'react';

type MapOptions = {
  center?: [number, number];
  zoom?: number;
  maxZoom?: number;
  minZoom?: number;
  disableAutomaticZoom?: boolean; // New option to disable automatic zooming
};

export const useMapInitialization = (mapRef: React.RefObject<HTMLDivElement | null>, options: MapOptions = {}) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clusterGroupRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  
  // Load Leaflet scripts
  useEffect(() => {
    if (window.L) {
      setIsScriptLoaded(true);
      return;
    }

    // Create and load Leaflet CSS
    const linkLeaflet = document.createElement('link');
    linkLeaflet.rel = 'stylesheet';
    linkLeaflet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkLeaflet);

    // Create and load MarkerCluster CSS
    const linkCluster = document.createElement('link');
    linkCluster.rel = 'stylesheet';
    linkCluster.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    document.head.appendChild(linkCluster);

    const linkClusterDefault = document.createElement('link');
    linkClusterDefault.rel = 'stylesheet';
    linkClusterDefault.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    document.head.appendChild(linkClusterDefault);

    // Load Leaflet JS
    const scriptLeaflet = document.createElement('script');
    scriptLeaflet.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    scriptLeaflet.async = true;
    scriptLeaflet.onload = () => {
      // Load MarkerCluster JS after Leaflet is loaded
      const scriptCluster = document.createElement('script');
      scriptCluster.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      scriptCluster.async = true;
      
      scriptCluster.onload = () => {
        console.log("Map plugins loaded successfully");
        setIsScriptLoaded(true);
      };
      
      scriptCluster.onerror = (err) => {
        console.error("Error loading MarkerCluster:", err);
        setMapError("Failed to load map resources");
        setIsScriptLoaded(true); // Still try to initialize the map without clustering
      };
      
      document.head.appendChild(scriptCluster);
    };
    
    scriptLeaflet.onerror = (err) => {
      console.error("Error loading Leaflet:", err);
      setMapError("Failed to load map resources");
    };
    
    document.head.appendChild(scriptLeaflet);

    // Add critical inline styles for the map
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-container {
        width: 100%;
        height: 100%;
      }
      .custom-marker {
        background: transparent !important;
        border: none !important;
        transition: transform 0.2s ease;
      }
      .custom-marker:hover {
        transform: scale(1.2);
        z-index: 1000 !important;
      }
      .selected-marker {
        transform: scale(1.2);
        z-index: 1000 !important;
        animation: markerPulse 1.5s infinite;
      }
      @keyframes markerPulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      /* Added custom styles for markers */
      .marker-cluster {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #3b82f6;
        box-shadow: 0 0 0 2px white;
      }
      
      .marker-cluster div {
        margin: 0;
        padding: 0;
        text-align: center;
      }
      
      .custom-cluster-icon {
        background: transparent !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup if component unmounts
      document.head.removeChild(linkLeaflet);
      document.head.removeChild(linkCluster);
      document.head.removeChild(linkClusterDefault);
      document.head.removeChild(scriptLeaflet);
      if (document.querySelector('script[src*="leaflet.markercluster.js"]')) {
        document.head.removeChild(document.querySelector('script[src*="leaflet.markercluster.js"]')!);
      }
      document.head.removeChild(style);
    };
  }, []);

  // Initialize map once scripts are loaded
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      console.log("Initializing map");
      const defaultOptions = {
        center: [51.505, -0.09], // London coordinates
        zoom: 12, // Increased initial zoom level
        maxZoom: 18,
        minZoom: 8,
        disableAutomaticZoom: false
      };
      
      const mapOptions = { ...defaultOptions, ...options };
      
      // Initialize the map with zoomControl disabled to add it to custom position
      const map = window.L.map(mapRef.current, {
        center: mapOptions.center,
        zoom: mapOptions.zoom,
        maxZoom: mapOptions.maxZoom,
        minZoom: mapOptions.minZoom,
        zoomControl: false, // Disable default zoom control
      });
      
      // Add zoom control to the top-right
      window.L.control.zoom({
        position: 'topright'
      }).addTo(map);

      // Add tile layer (map background) - using more attractive tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Create marker cluster group if available with improved styles
      if (window.L.markerClusterGroup) {
        const clusterGroup = window.L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          zoomToBoundsOnClick: !mapOptions.disableAutomaticZoom, // Disable auto-zoom if requested
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 18,
          animate: true,
          spiderfyDistanceMultiplier: 1.5,
          iconCreateFunction: function(cluster: any) {
            const count = cluster.getChildCount();
            let size = 40;
            
            // Adjust size based on count
            if (count > 50) size = 60;
            else if (count > 20) size = 50;
            else if (count < 5) size = 36;
            
            return window.L.divIcon({
              html: `
                <div class="flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-blue-500">
                  <div class="bg-blue-500 text-white rounded-full flex items-center justify-center w-full h-full font-semibold p-1">
                    ${count}
                  </div>
                </div>
              `,
              className: 'custom-cluster-icon',
              iconSize: window.L.point(size, size),
              iconAnchor: window.L.point(size/2, size/2)
            });
          }
        });
        
        // Customize cluster click behavior
        clusterGroup.on('clusterclick', function(e: any) {
            if (mapOptions.disableAutomaticZoom) {
            // If auto-zoom is disabled, prefer spiderfying instead of zooming
            e.layer.spiderfy();
            return false; // Prevent default behavior
          }
          
          // Get zoom level
          const currentZoom = map.getZoom();
          const maxZoom = map.getMaxZoom();
          
          // If at max zoom, spiderfy instead of zooming out
          if (currentZoom >= maxZoom) {
            e.layer.spiderfy();
            // Prevent default zoom-out behavior
            return false;
          }
        });

        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup;
      }

      // Add scale control
      window.L.control.scale({
        imperial: false,
        position: 'bottomright'
      }).addTo(map);
      
      // Store map instance
      mapInstanceRef.current = map;
      setMapLoaded(true);
      
    } catch (error: any) {
      console.error("Map initialization error:", error);
      setMapError(`Failed to initialize map: ${error.message}`);
    }
  }, [isScriptLoaded, options]);

  return {
    mapLoaded,
    mapError,
    mapInstance: mapInstanceRef.current,
    markers: markersRef.current,
    clusterGroup: clusterGroupRef.current,
    heatLayer: heatLayerRef.current,
    routeLine: routeLineRef.current,
    isScriptLoaded
  };
};

export default useMapInitialization;