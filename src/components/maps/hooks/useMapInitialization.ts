import { useState, useEffect, useRef } from 'react';

type MapOptions = {
  center?: [number, number];
  zoom?: number;
  maxZoom?: number;
  minZoom?: number;
};

export const useMapInitialization = (mapRef: React.RefObject<HTMLDivElement>, options: MapOptions = {}) => {
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
        zoom: 13,
        maxZoom: 18,
        minZoom: 8,
      };
      
      const mapOptions = { ...defaultOptions, ...options };
      
      // Initialize the map
      const map = window.L.map(mapRef.current, mapOptions);

      // Add tile layer (map background) - using more attractive tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Create marker cluster group if available
      if (window.L.markerClusterGroup) {
        const clusterGroup = window.L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 18,
          animate: true,
          spiderfyDistanceMultiplier: 1.5,
          iconCreateFunction: function(cluster: any) {
            return window.L.divIcon({
              html: `<div class="marker-cluster"><div>${cluster.getChildCount()}</div></div>`,
              className: 'custom-cluster',
              iconSize: window.L.point(40, 40)
            });
          }
        });
        
        // Modify how cluster clicks are handled
        clusterGroup.on('clusterclick', function(e) {
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