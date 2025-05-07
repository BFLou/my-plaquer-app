// src/hooks/useMapInitialization.ts
import { useState, useRef, useCallback } from 'react';

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
      
      /* Animating dash array for routes */
      @keyframes dash {
        to {
          stroke-dashoffset: 1000;
        }
      }
      
      /* Route marker styling by position */
      .route-marker-start .route-marker-diamond {
        background-color: #3b82f6 !important; /* Blue */
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3) !important;
      }
      
      .route-marker-end .route-marker-diamond {
        background-color: #ef4444 !important; /* Red */
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3) !important;
      }
      
      .route-marker-waypoint .route-marker-diamond {
        background-color: #10b981 !important; /* Green */
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3) !important;
      }
      
      .route-marker-start .route-marker-label {
        background-color: #3b82f6 !important;
      }
      
      .route-marker-end .route-marker-label {
        background-color: #ef4444 !important;
      }
      
      .route-marker-waypoint .route-marker-label {
        background-color: #10b981 !important;
      }
    `;
    
    document.head.appendChild(style);
  };
  
  // Initialize the map
// In useMapInitialization.ts
const initializeMap = useCallback((mapContainer, setMapLoadedCallback = null) => {
  if (!mapContainer) {
    console.error("Map container not available");
    return;
  }
  
  // Add debug log to check container dimensions
  console.log("Map container dimensions:", mapContainer.offsetWidth, mapContainer.offsetHeight);
  
  // Load Leaflet if not already loaded - keep your existing code here
  // ...
  
  // When creating the map, ensure it has a clear height
  try {
    // Create map instance
    const map = window.L.map(mapContainer, {
      center: [51.505, -0.09], // London as default
      zoom: 13,
      maxZoom: 18,
      minZoom: 4,
      zoomControl: false, // Disable default zoom control
      scrollWheelZoom: true,
      doubleClickZoom: true
    });
    
    // Immediately after map creation, check if it has a valid size
    console.log("Map size:", map.getSize());
    
    // Force a refresh if size is 0
    if (map.getSize().x === 0 || map.getSize().y === 0) {
      setTimeout(() => map.invalidateSize(), 100);
    }
    
    // Continue with the rest of your initialization code
    // ...
  } catch (error) {
    console.error("Error initializing map:", error);
  }
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