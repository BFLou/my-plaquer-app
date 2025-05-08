// src/hooks/useMapInitialization.ts
import { useState, useRef, useCallback, useEffect } from 'react';

export const useMapInitialization = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const routeMarkerGroupRef = useRef(null);
  const routeLineRef = useRef(null);
  const hasInitializedRef = useRef(false);
  
  // Add custom styles for the map
  const addMapStyles = useCallback(() => {
    // Check if styles are already added
    if (document.getElementById('leaflet-custom-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'leaflet-custom-styles';
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
  }, []);

  // Load Leaflet and dependencies
  const loadLeaflet = useCallback(() => {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.L) {
        console.log("Leaflet already loaded");
        resolve(true);
        return;
      }
      
      console.log("Loading Leaflet...");
      
      // Add CSS
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCss);
      
      // Add script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        // Add styles
        addMapStyles();
        resolve(true);
      };
      script.onerror = () => {
        console.error("Failed to load Leaflet");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }, [addMapStyles]);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn("Error cleaning up map:", e);
      }
      mapInstanceRef.current = null;
    }
    
    // Reset all refs
    markersLayerRef.current = null;
    clusterGroupRef.current = null;
    routeMarkerGroupRef.current = null;
    routeLineRef.current = null;
    hasInitializedRef.current = false;
    
    // Clear any Leaflet-specific properties on the container
    const containers = document.querySelectorAll('.map-container');
    containers.forEach(container => {
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }
    });
    
    setMapLoaded(false);
  }, []);
  
  // Initialize map
  const initializeMap = useCallback(async (container, onMapLoaded) => {
    if (!container) {
      console.error("No container provided for map");
      return null;
    }
    
    // Check if we already have an initialized map
    if (mapInstanceRef.current && hasInitializedRef.current) {
      console.log("Map already initialized, reusing existing instance");
      if (onMapLoaded) onMapLoaded(true);
      setMapLoaded(true);
      
      // Force map to fit container size after a short delay
      setTimeout(() => {
        if (mapInstanceRef.current) {
          console.log("Forcing map resize");
          mapInstanceRef.current.invalidateSize(true);
        }
      }, 100);
      
      return mapInstanceRef.current;
    }
    
    // Check container dimensions
    console.log("Container dimensions:", container.offsetWidth, container.offsetHeight);
    
    // Clean up any existing map and clear any _leaflet_id properties
    cleanup();
    
    // Check explicitly for _leaflet_id on the container
    if (container._leaflet_id) {
      console.warn("Container still has _leaflet_id property, removing it");
      delete container._leaflet_id;
    }
    
    // Load leaflet if not loaded
    const leafletLoaded = await loadLeaflet();
    if (!leafletLoaded) {
      setMapError("Failed to load map libraries");
      if (onMapLoaded) onMapLoaded(false);
      return null;
    }
    
    try {
      // Create map instance with all interactions enabled
      const map = window.L.map(container, {
        center: [51.505, -0.09], // London as default
        zoom: 13,
        maxZoom: 18,
        minZoom: 5,
        // Explicitly enable all interaction options
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: true,
        attributionControl: true,
        zoomControl: false // We'll add custom zoom control
      });
      
      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      
      // Create layer groups
      const markersLayer = window.L.layerGroup().addTo(map);
      const routeMarkerGroup = window.L.layerGroup().addTo(map);
      
      // Store references
      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      routeMarkerGroupRef.current = routeMarkerGroup;
      
      // Add custom zoom control in better position
      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
      
      // Force a resize after a delay to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize(true);
        console.log("Forced map resize");
      }, 100);
      
      // Set loaded state
      setMapLoaded(true);
      hasInitializedRef.current = true;
      if (onMapLoaded) onMapLoaded(true);
      
      // Verify map is interactive by adding debug handlers
      map.on('click', function(e) {
        console.log("Map clicked at:", e.latlng);
      });
      
      map.on('moveend', function() {
        console.log("Map moved to center:", map.getCenter());
      });
      
      map.on('zoomend', function() {
        console.log("Map zoomed to level:", map.getZoom());
      });
      
      return map;
    } catch (error) {
      console.error("Error initializing map:", error);
      
      // Special handling for "already initialized" error
      if (error.message && error.message.includes("already initialized")) {
        console.warn("Container already has a map. Attempting recovery...");
        
        // Try to recover existing map instance if possible
        try {
          if (container._leaflet_id) {
            // This is a hack to get the existing map instance
            const existingMap = window.L.maps[container._leaflet_id];
            if (existingMap) {
              console.log("Successfully recovered existing map instance");
              
              // Store references
              mapInstanceRef.current = existingMap;
              setMapLoaded(true);
              hasInitializedRef.current = true;
              if (onMapLoaded) onMapLoaded(true);
              
              // Force resize
              setTimeout(() => {
                existingMap.invalidateSize(true);
              }, 100);
              
              return existingMap;
            }
          }
        } catch (recoveryError) {
          console.error("Error during map recovery:", recoveryError);
        }
        
        // If recovery failed, try hard cleanup and re-initialization
        cleanup();
        
        // Final fallback: force remove and recreate the container
        if (container.parentNode) {
          const parent = container.parentNode;
          const newContainer = container.cloneNode(false);
          parent.replaceChild(newContainer, container);
          
          // Try initialization with clean container after a short delay
          setTimeout(() => {
            initializeMap(newContainer, onMapLoaded);
          }, 100);
          
          return null;
        }
      }
      
      // Report error for other cases
      setMapError(`Failed to initialize map: ${error.message}`);
      if (onMapLoaded) onMapLoaded(false);
      return null;
    }
  }, [cleanup, loadLeaflet]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return {
    mapLoaded,
    mapError,
    mapInstance: mapInstanceRef.current,
    markersLayer: markersLayerRef.current,
    clusterGroup: clusterGroupRef.current,
    routeMarkerGroup: routeMarkerGroupRef.current,
    routeLineRef,
    initializeMap,
    cleanup
  };
};

export default useMapInitialization;