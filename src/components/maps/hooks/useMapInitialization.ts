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
  const initTimeoutRef = useRef(null);
  
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
  
  // Thorough cleanup function to prevent Leaflet container issues
  const cleanup = useCallback(() => {
    // Clear any pending timeouts
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    if (mapInstanceRef.current) {
      try {
        // Remove all layers first - defensive coding to prevent memory leaks
        try {
          mapInstanceRef.current.eachLayer(layer => {
            mapInstanceRef.current.removeLayer(layer);
          });
        } catch (e) {
          console.warn("Error removing map layers:", e);
        }
        
        // Then properly remove the map
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn("Error removing map:", e);
        }
        
        mapInstanceRef.current = null;
      } catch (e) {
        console.warn("Error cleaning up map:", e);
      }
    }
    
    // Reset all refs
    markersLayerRef.current = null;
    clusterGroupRef.current = null;
    routeMarkerGroupRef.current = null;
    routeLineRef.current = null;
    
    // Explicitly set hasInitialized to false
    hasInitializedRef.current = false;
    
    setMapLoaded(false);
  }, []);

  // Initialize map with proper error handling and container cleanup
  const initializeMap = useCallback(async (container, onMapLoaded) => {
    if (!container) {
      console.error("No container provided for map");
      if (onMapLoaded) onMapLoaded(false);
      return null;
    }
    
    // Log container dimensions to help debug
    console.log("Container dimensions:", container.offsetWidth, container.offsetHeight);
    
    // Ensure any previous map is properly cleaned up
    cleanup();
    
    // Ensure the container is empty
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Make sure Leaflet is loaded
    const leafletLoaded = await loadLeaflet();
    if (!leafletLoaded) {
      setMapError("Failed to load map libraries");
      if (onMapLoaded) onMapLoaded(false);
      return null;
    }
    
    try {
      // Create a wrapper div that will hold the map
      // This allows us to reset the container without affecting the React ref
      const mapWrapper = document.createElement('div');
      mapWrapper.style.width = '100%';
      mapWrapper.style.height = '100%';
      mapWrapper.className = 'leaflet-map-wrapper';
      container.appendChild(mapWrapper);
      
      // CRITICAL: Wait for next frame to ensure DOM is updated
      // This helps prevent the '_leaflet_pos' error
      setTimeout(() => {
        try {
          // Create map instance with all interactions enabled
          const map = window.L.map(mapWrapper, {
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
          
          // Set loaded state
          setMapLoaded(true);
          hasInitializedRef.current = true;
          if (onMapLoaded) onMapLoaded(true);
          
          // Force a resize after a delay to ensure proper rendering
          // Use a safer approach to invalidateSize that won't trigger the _leaflet_pos error
          initTimeoutRef.current = setTimeout(() => {
            if (map && !map._isDestroyed) {
              // Check if the map container is still properly attached to DOM
              if (map._container && map._container.parentNode) {
                try {
                  map.invalidateSize({ animate: false, pan: false });
                  console.log("Forced map resize");
                } catch (e) {
                  console.warn("Error during map resize:", e);
                }
              }
            }
          }, 300); // Increased timeout for more reliability
          
          // Add some debug event handlers
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
          console.error("Error initializing map in setTimeout:", error);
          setMapError(`Failed to initialize map: ${error.message}`);
          if (onMapLoaded) onMapLoaded(false);
          return null;
        }
      }, 50); // Small timeout to ensure DOM is ready
      
      return null; // Initial return is null, real map returned in setTimeout
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(`Failed to initialize map: ${error.message}`);
      
      if (onMapLoaded) onMapLoaded(false);
      return null;
    }
  }, [cleanup, loadLeaflet]);

  // Clean up on unmount to prevent memory leaks
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