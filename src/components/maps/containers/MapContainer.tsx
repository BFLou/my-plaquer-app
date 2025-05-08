// src/components/maps/containers/MapContainer.tsx
import React, { useEffect } from 'react';

interface MapContainerProps {
  mapLoaded: boolean;
  isDrawingRoute: boolean;
  isRoutingMode: boolean;
}

const MapContainer = React.forwardRef<HTMLDivElement, MapContainerProps>(({
  mapLoaded,
  isDrawingRoute,
  isRoutingMode
}, ref) => {
  // Add styles that might be needed for Leaflet
  useEffect(() => {
    // Check if Leaflet-specific styles are needed
    if (!document.getElementById('leaflet-custom-map-styles')) {
      const style = document.createElement('style');
      style.id = 'leaflet-custom-map-styles';
      style.innerHTML = `
        /* Ensure map container is properly styled */
        .map-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 400px;
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
        
        /* Z-index fixes */
        .leaflet-map-pane {
          z-index: 1 !important;
        }
        
        .leaflet-tile-pane {
          z-index: 2 !important;
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
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up when component unmounts
      const styleElement = document.getElementById('leaflet-custom-map-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
  
  return (
    <>
      {/* Map container */}
      <div 
        ref={ref} 
        className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-md map-container"
        style={{ minHeight: '400px', height: '500px' }}
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