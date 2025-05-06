// src/components/maps/controls/MapControls.tsx
import React from 'react';
import { Navigation, Filter, Route as RouteIcon, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MapControlsProps {
  isLoadingLocation: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  isRoutingMode: boolean;
  toggleRoutingMode: () => void;
  findUserLocation: () => void;
  hasUserLocation: boolean;
  routePointsCount: number;
  resetMap: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  isLoadingLocation,
  showFilters,
  setShowFilters,
  isRoutingMode,
  toggleRoutingMode,
  findUserLocation,
  hasUserLocation,
  routePointsCount,
  resetMap
}) => {
  return (
    <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-md p-2 map-controls">
      <div className="flex flex-col gap-2">
        {/* Location Button */}
        <div className="relative group">
          <Button 
            variant={hasUserLocation ? "outline" : "default"}
            size="sm" 
            className={`h-10 w-10 p-0 ${isLoadingLocation ? 'bg-blue-50' : ''}`}
            onClick={findUserLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
            ) : (
              <Navigation size={18} className={hasUserLocation ? 'text-blue-600' : ''} />
            )}
          </Button>
          <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
            Find my location
          </div>
        </div>
        
        {/* Filter Button */}
        <div className="relative group">
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-10 w-10 p-0 relative ${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} className={showFilters ? 'text-blue-600' : ''} />
            {hasUserLocation && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
            )}
          </Button>
          <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
            Distance filter{!hasUserLocation ? " (find location first)" : ""}
          </div>
        </div>
        
        {/* Route Button */}
        <div className="relative group">
          <Button 
            variant={isRoutingMode ? "default" : "outline"}
            size="sm" 
            className={`h-10 w-10 p-0 relative ${isRoutingMode ? 'bg-green-600 text-white' : ''}`}
            onClick={toggleRoutingMode}
          >
            <RouteIcon size={18} />
            {isRoutingMode && routePointsCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center bg-green-500 rounded-full text-white text-xs">
                {routePointsCount}
              </span>
            )}
          </Button>
          <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
            {isRoutingMode ? "Exit route planning" : "Plan a route"}
          </div>
        </div>
        
        {/* Reset Button */}
        <div className="relative group">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 p-0"
            onClick={resetMap}
          >
            <Map size={18} />
          </Button>
          <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
            Reset map view
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapControls;