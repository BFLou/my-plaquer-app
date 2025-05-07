// src/components/maps/containers/MapContainer.tsx
import React from 'react';

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