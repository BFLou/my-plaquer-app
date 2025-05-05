// src/components/plaques/map/MapControls.tsx
import React from 'react';
import { Navigation, Filter, Route as RouteIcon, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

type MapControlsProps = {
  isLoadingLocation: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  isRoutingMode: boolean;
  toggleRoutingMode: () => void;
  findUserLocation: () => void;
  hasUserLocation: boolean;
};

const MapControls: React.FC<MapControlsProps> = ({
  isLoadingLocation,
  showFilters,
  setShowFilters,
  isRoutingMode,
  toggleRoutingMode,
  findUserLocation,
  hasUserLocation
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-2">
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={findUserLocation}
          disabled={isLoadingLocation}
          title="Find my location"
        >
          {isLoadingLocation ? (
            <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
          ) : (
            <Navigation size={16} />
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 w-8 p-0 ${showFilters ? 'bg-blue-50' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          disabled={!hasUserLocation}
          title="Distance filter"
        >
          <Filter size={16} />
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 w-8 p-0 ${isRoutingMode ? 'bg-green-50 text-green-600' : ''}`}
          onClick={toggleRoutingMode}
          title={isRoutingMode ? "Exit route planning" : "Plan a route"}
        >
          <RouteIcon size={16} />
        </Button>
      </div>
    </div>
  );
};

export default MapControls;