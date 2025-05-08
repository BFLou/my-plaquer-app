// src/components/maps/hooks/useMapInitialization.ts - with fixes
import { useState, useEffect, useRef } from 'react';

interface MapOptions {
  center?: [number, number];
  zoom?: number;
  maxZoom?: number;
  minZoom?: number;
  disableAutomaticZoom?: boolean;
}

/**
 * Custom hook for initializing the Leaflet map
 * Handles loading scripts, styles, and setting up the map instance
 */
export const useMapInitialization = (
  mapRef: React.RefObject<HTMLDivElement | null>, 
  options: MapOptions = {}
) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);
  
  // Load Leaflet scripts and styles
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

    // No cleanup to ensure scripts remain loaded
  }, []);

  // Initialize map once scripts are loaded
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Create a small delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      try {
        console.log("Initializing map");
        const defaultOptions = {
          center: [51.505, -0.09], // London coordinates
          zoom: 13,
          maxZoom: 18,
          minZoom: 4,
          disableAutomaticZoom: false
        };
        
        const mapOptions = { ...defaultOptions, ...options };
        
        // Add a brief delay before initializing the map to ensure the container is ready
        // Make sure the container has dimensions before initializing Leaflet
        const mapContainer = mapRef.current;
        if (!mapContainer) return;
        
        // Force the container to have a defined height and width
        mapContainer.style.height = '500px';
        mapContainer.style.width = '100%';
        mapContainer.style.position = 'relative';
        
        // Initialize the map with zoomControl disabled to add it to custom position
        const map = window.L.map(mapContainer, {
          center: mapOptions.center,
          zoom: mapOptions.zoom,
          maxZoom: mapOptions.maxZoom,
          minZoom: mapOptions.minZoom,
          zoomControl: false, // Disable default zoom control
          zoomSnap: 0.5,
          zoomDelta: 0.5,
          wheelDebounceTime: 100,
          wheelPxPerZoomLevel: 100,
          bounceAtZoomLimits: false,
          preferCanvas: true // Use canvas renderer for better performance
        });
        
        // Fix for "_leaflet_pos" error - ensure map is properly sized
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        
        // Add zoom control to the top-right with improved styling
        window.L.control.zoom({
          position: 'topright',
          zoomInTitle: 'Zoom in',
          zoomOutTitle: 'Zoom out'
        }).addTo(map);

        // Add tile layer - using more attractive Carto tiles
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        // Add scale control with metric only
        window.L.control.scale({
          imperial: false,
          position: 'bottomright',
          maxWidth: 150
        }).addTo(map);
        
        // Prevent zoom on scroll unless shift key is pressed
        map.scrollWheelZoom.disable();
        
        // Add event listener to enable zoom on scroll when shift key is pressed
        const enableZoom = (e) => {
          if (e.shiftKey) {
            map.scrollWheelZoom.enable();
          }
        };
        
        const disableZoom = (e) => {
          if (e.key === 'Shift') {
            map.scrollWheelZoom.disable();
          }
        };
        
        document.addEventListener('keydown', enableZoom);
        document.addEventListener('keyup', disableZoom);
        
        // Enable touch zoom
        map.touchZoom.enable();
        
        // Add double-click to zoom
        map.doubleClickZoom.enable();
        
        // Setup resize handler to prevent _leaflet_pos errors
        const handleResize = () => {
          if (map) {
            map.invalidateSize();
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Prevent automatic zooming if requested
        if (mapOptions.disableAutomaticZoom) {
          // Store original fitBounds method
          const originalFitBounds = map.fitBounds;
          
          // Override fitBounds to do nothing unless explicitly called
          map.fitBounds = function() {
            // Only apply if a specific flag is set
            if (map._allowFitBounds) {
              return originalFitBounds.apply(this, arguments);
            }
            return this;
          };
          
          // Method to allow fitBounds calls
          map.allowFitBounds = function() {
            map._allowFitBounds = true;
            return this;
          };
          
          // Method to disallow fitBounds calls
          map.disallowFitBounds = function() {
            map._allowFitBounds = false;
            return this;
          };
        }
        
        // Store map instance
        mapInstanceRef.current = map;
        setMapLoaded(true);
        
        // Add map loaded event
        setTimeout(() => {
          mapRef.current?.dispatchEvent(new CustomEvent('map:loaded', { 
            detail: { map } 
          }));
        }, 100);
        
        // Clean up event listeners on unmount
        return () => {
          document.removeEventListener('keydown', enableZoom);
          document.removeEventListener('keyup', disableZoom);
          window.removeEventListener('resize', handleResize);
          
          // Clean up map instance if component unmounts
          if (map) {
            map.remove();
            mapInstanceRef.current = null;
          }
        };
      } catch (error: any) {
        console.error("Map initialization error:", error);
        setMapError(`Failed to initialize map: ${error.message}`);
      }
    }, 200); // Add delay to ensure DOM is ready
    
    return () => {
      clearTimeout(initTimeout);
    };
  }, [isScriptLoaded, options]);

  return {
    mapLoaded,
    mapError,
    mapInstance: mapInstanceRef.current,
    isScriptLoaded
  };
};

export default useMapInitialization;