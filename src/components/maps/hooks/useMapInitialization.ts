// src/components/maps/hooks/useMapInitialization.ts
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for initializing and managing the Leaflet map
 */
export const useMapInitialization = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const routeMarkerGroupRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  
  // Load Leaflet libraries
  const loadLeafletScripts = useCallback(() => {
    // Check if already loaded
    if (window.L) {
      console.log("Leaflet already loaded");
      return true;
    }
    
    console.log("Loading Leaflet libraries...");
    
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
        return true;
      };
      
      scriptCluster.onerror = (err) => {
        console.error("Error loading MarkerCluster:", err);
        setMapError("Failed to load map resources");
        return false;
      };
      
      document.head.appendChild(scriptCluster);
    };
    
    scriptLeaflet.onerror = (err) => {
      console.error("Error loading Leaflet:", err);
      setMapError("Failed to load map resources");
      return false;
    };
    
    document.head.appendChild(scriptLeaflet);

    // Add custom styles for map and markers
    addMapStyles();
    
    return false; // Scripts are still loading
  }, []);
  
  // Add custom styles for the map
  const addMapStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-container {
        width: 100%;
        height: 100%;
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      
      /* Custom marker styles */
      .custom-marker {
        background: transparent !important;
        border: none !important;
        transition: all 0.3s ease;
      }
      
      .custom-marker:hover {
        z-index: 1000 !important;
      }
      
      /* Popup styling */
      .leaflet-popup-content-wrapper {
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
      }
      
      .leaflet-popup-content {
        margin: 0;
        padding: 0;
      }
      
      .leaflet-popup-tip {
        background-color: white;
      }
      
      /* Control styling */
      .leaflet-control-zoom {
        border: none !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
      }
      
      .leaflet-control-zoom-in, .leaflet-control-zoom-out {
        border-radius: 0.25rem !important;
        color: #4b5563 !important;
        border: 1px solid #e5e7eb !important;
      }
      
      .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
        background-color: #f9fafb !important;
        color: #1f2937 !important;
      }
      
      /* Attribution styling */
      .leaflet-control-attribution {
        background-color: rgba(255, 255, 255, 0.8) !important;
        padding: 0.25rem 0.5rem !important;
        border-radius: 0.25rem !important;
        font-size: 0.7rem !important;
      }
      
      /* Customize cluster icons */
      .marker-cluster {
        background-color: rgba(59, 130, 246, 0.6) !important;
        border-radius: 50% !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
      }
      
      .marker-cluster div {
        background-color: rgba(59, 130, 246, 0.8) !important;
        color: white !important;
        font-weight: bold !important;
      }
      
      /* Animation for marker drop */
      @keyframes marker-drop {
        0% {
          transform: translateY(-20px);
          opacity: 0;
        }
        60% {
          transform: translateY(5px);
          opacity: 1;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      /* Scale animations for markers and clusters */
      @keyframes scale-in {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Animating dash array for routes */
      @keyframes dash {
        to {
          stroke-dashoffset: 1000;
        }
      }
      
      /* Modern spiderfy lines */
      .leaflet-marker-icon-wrapper svg line {
        stroke: #3b82f6 !important;
        stroke-width: 2 !important;
        stroke-dasharray: 4, 4 !important;
      }
      
      /* Route marker styling */
      .route-marker-container {
        position: relative;
        z-index: 1000 !important;
      }
      
      .route-marker-diamond {
        width: 28px;
        height: 28px;
        transform: rotate(45deg);
        border-radius: 4px;
        font-weight: bold;
        font-size: 14px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000 !important;
        transition: transform 0.2s ease;
      }
      
      .route-marker-diamond:hover {
        transform: rotate(45deg) scale(1.1);
      }
      
      .route-marker-content {
        transform: rotate(-45deg);
        color: white;
        font-weight: bold;
      }
      
      .route-marker-label {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      
      /* Route distance labels */
      .route-distance-label {
        background-color: white !important;
        border-radius: 12px !important;
        padding: 3px 6px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        border: 1px solid #10b981 !important;
        color: #10b981 !important;
        font-weight: 500 !important;
        font-size: 11px !important;
        white-space: nowrap !important;
        z-index: 950 !important;
      }
    `;
    
    document.head.appendChild(style);
  };
  
  // Initialize the map
  const initializeMap = useCallback((mapContainer, setMapLoadedCallback = null) => {
    if (!mapContainer || !window.L) {
      console.error("Map container or Leaflet not available");
      return;
    }
    
    // Check if map is already initialized
    if (mapInstanceRef.current) {
      console.log("Map already initialized, skipping initialization");
      if (setMapLoadedCallback) {
        setMapLoadedCallback(true);
      }
      return;
    }
    
    console.log("Initializing map...");
    
    try {
      // Create map instance
      const map = window.L.map(mapContainer, {
        center: [51.505, -0.09], // London as default
        zoom: 13,
        maxZoom: 18,
        minZoom: 4,
        zoomControl: false, // Disable default zoom control to add it to the topright
        scrollWheelZoom: true,
        doubleClickZoom: true
      });
      
      mapInstanceRef.current = map;
      
      // Add zoom control in better position
      window.L.control.zoom({
        position: 'topright'
      }).addTo(map);
      
      // Add tile layer - Carto light map
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);
      
      // Create marker layer group
      const markers = window.L.layerGroup().addTo(map);
      markersLayerRef.current = markers;
      
      // Create a separate layer for route markers to prevent clustering
      const routeMarkers = window.L.layerGroup().addTo(map);
      routeMarkerGroupRef.current = routeMarkers;
      
      // Create cluster group if available
      if (window.L.markerClusterGroup) {
        const clusters = window.L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 18,
          animate: true,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            let size = 40;
            
            // Size based on count
            if (count < 5) size = 40;
            else if (count < 20) size = 44;
            else if (count < 50) size = 48;
            else size = 52;
            
            return window.L.divIcon({
              html: `
                <div class="custom-cluster">
                  <div class="custom-cluster-inner">
                    ${count}
                  </div>
                </div>
              `,
              className: 'custom-cluster-icon',
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            });
          }
        });
        
        map.addLayer(clusters);
        clusterGroupRef.current = clusters;
      }
      
      // Add scale control
      window.L.control.scale({
        imperial: false,
        position: 'bottomright',
        maxWidth: 150
      }).addTo(map);
      
      // Set map as loaded
      setMapLoaded(true);
      if (setMapLoadedCallback) {
        setMapLoadedCallback(true);
      }
      
      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(`Failed to initialize map: ${error.message}`);
    }
  }, []);
  
  // Effect to load scripts when component mounts
  useEffect(() => {
    loadLeafletScripts();
  }, [loadLeafletScripts]);
  
  return {
    mapLoaded,
    mapError,
    mapInstance: mapInstanceRef.current,
    markersLayer: markersLayerRef.current,
    clusterGroup: clusterGroupRef.current,
    routeMarkerGroup: routeMarkerGroupRef.current,
    routeLineRef,
    initializeMap
  };
};

export default useMapInitialization;