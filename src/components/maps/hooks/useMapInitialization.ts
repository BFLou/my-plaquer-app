// src/components/maps/hooks/useMapInitialization.ts
import { useState, useEffect, useRef } from 'react';

type MapOptions = {
  center?: [number, number];
  zoom?: number;
  maxZoom?: number;
  minZoom?: number;
  disableAutomaticZoom?: boolean;
};

export const useMapInitialization = (mapRef: React.RefObject<HTMLDivElement | null>, options: MapOptions = {}) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
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

    // Add styles for map and markers
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
        minZoom: 4,
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
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelDebounceTime: 100,
        wheelPxPerZoomLevel: 100,
        bounceAtZoomLimits: false
      });
      
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
      document.addEventListener('keydown', function(e) {
        if (e.shiftKey) {
          map.scrollWheelZoom.enable();
        }
      });
      
      document.addEventListener('keyup', function(e) {
        if (e.key === 'Shift') {
          map.scrollWheelZoom.disable();
        }
      });
      
      // Enable touch zoom
      map.touchZoom.enable();
      
      // Add a subtle shadow overlay to make the markers pop
      const shadowOverlay = window.L.rectangle(
        [[-90, -180], [90, 180]], 
        { 
          color: 'transparent',
          fillColor: '#000', 
          fillOpacity: 0.03,
          interactive: false
        }
      ).addTo(map);
      
      // Add double-click to zoom
      map.doubleClickZoom.enable();
      
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
    isScriptLoaded
  };
};

export default useMapInitialization;