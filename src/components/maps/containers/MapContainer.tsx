// src/components/maps/containers/MapContainer.tsx - Fixed version
import React, { useEffect, useRef } from 'react';

interface MapContainerProps {
  mapLoaded: boolean;
  isDrawingRoute: boolean;
  isRoutingMode: boolean;
}

/**
 * MapContainer Component
 * Handles the actual map DOM element and loading/processing states
 */
const MapContainer = React.forwardRef<HTMLDivElement, MapContainerProps>(({
  mapLoaded,
  isDrawingRoute,
  isRoutingMode,
}, ref) => {
  // Generate a unique ID for this container instance
  const uniqueId = React.useRef(`map-container-${Math.random().toString(36).substring(2, 9)}`);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fix for Leaflet initialization issues
  useEffect(() => {
    // Ensure the map container is fully mounted before Leaflet tries to access it
    const containerElement = ref as React.RefObject<HTMLDivElement>;
    if (containerElement.current) {
      // Force a small delay to ensure DOM is fully rendered
      setTimeout(() => {
        // Only trigger map invalidation, not window resize
        if (window.L && containerElement.current) {
          // Try to find the Leaflet map instance and invalidate its size
          const mapElement = containerElement.current.querySelector('.leaflet-container');
          if (mapElement && (mapElement as any)._leaflet_id) {
            const mapId = (mapElement as any)._leaflet_id;
            const map = window.L.Map.prototype._leaflet_map;
            if (map) {
              map.invalidateSize();
            }
          }
        }
      }, 100);
    }
  }, [ref]);
  
useEffect(() => {
  // Remove or simplify this effect - keep only basic resize handling
  const handleResize = () => {
    window.dispatchEvent(new Event('resize'));
  };
  
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []); 
  // Add styles that might be needed for Leaflet
  useEffect(() => {
    // Check if Leaflet-specific styles are needed
    if (!document.getElementById('leaflet-custom-map-styles')) {
      const style = document.createElement('style');
      style.id = 'leaflet-custom-map-styles';
      style.innerHTML = `
        /* Ensure map container is properly styled */
        .map-container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 400px !important;
          overflow: hidden !important;
        }
        
        
        /* Make sure popups appear correctly */
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
          min-width: 200px;
        }
        
        /* Critical Z-index fixes */
        .leaflet-map-pane {
          z-index: 2 !important;
        }
        
        .leaflet-tile-pane {
          z-index: 1 !important;
        }
        
        .leaflet-overlay-pane {
          z-index: 3 !important;
        }
        
        .leaflet-shadow-pane {
          z-index: 4 !important;
        }
        
        .leaflet-marker-pane {
          z-index: 5 !important;
        }
        
        .leaflet-tooltip-pane {
          z-index: 6 !important;
        }
        
        .leaflet-popup-pane {
          z-index: 7 !important;
        }
        
        /* Make sure route markers are always on top */
        .leaflet-marker-icon.route-marker {
          z-index: 1000 !important;
        }
        
        /* Animation for user location pulse */
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          70% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(0.8);
            opacity: 0;
          }
        }
        
        /* Route marker styles */
        .route-marker-start {
          background: #3b82f6 !important;
          border: 2px solid white !important;
        }
        
        .route-marker-end {
          background: #ef4444 !important;
          border: 2px solid white !important;
        }
        
        .route-marker-waypoint {
          background: #10b981 !important;
          border: 2px solid white !important;
        }
        
        /* Route line animation */
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
        
        .animated-dash {
          animation: dash 30s linear infinite;
        }
        
        /* Toast notifications */
        .map-toast {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 20px;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          min-width: 200px;
          text-align: center;
          opacity: 0;
          animation: fadeIn 0.3s forwards;
        }
        
        .map-toast.success {
          border-left: 4px solid #10b981;
        }
        
        .map-toast.info {
          border-left: 4px solid #3b82f6;
        }
        
        .map-toast.error {
          border-left: 4px solid #ef4444;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        /* Critical fix for _leaflet_pos errors */
        .leaflet-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .leaflet-pane {
          position: absolute;
          left: 0;
          top: 0;
        }
        
       
        
        /* Layer selection control styling */
        .layer-control {
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
          padding: 8px;
        }
        
        .layer-control-item {
          padding: 4px 8px;
          cursor: pointer;
          margin: 2px 0;
          border-radius: 2px;
        }
        
        .layer-control-item:hover {
          background-color: #f0f9ff;
        }
        
        .layer-control-item.active {
          background-color: #3b82f6;
          color: white;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // We don't remove the styles on unmount because other map instances
      // might still need them - they'll be cleaned up when the app closes
    };
  }, []);
  
  return (
    <>
      {/* Map container with unique key to help React tracking */}
      <div 
  ref={ref} 
  key={uniqueId.current}
  id={uniqueId.current}
  className={`w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-md map-container`}
  style={{ 
    minHeight: '400px', 
    height: '500px',
    position: 'relative'
  }}
  data-testid="map-container"
/>
      
      {/* Map overlay for loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-medium text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Loading overlay during route drawing */}
      {isDrawingRoute && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-40 rounded-lg pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="h-5 w-5 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-sm text-gray-700">Calculating walking route...</p>
          </div>
        </div>
      )}
      
      {/* Route planning indicator when active */}
      {isRoutingMode && mapLoaded && (
        <div className="absolute top-16 left-4 bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md z-30">
          Walking Route Planner Active
        </div>
      )}
    </>
  );
});

export default MapContainer;