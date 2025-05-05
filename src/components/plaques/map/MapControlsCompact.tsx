// src/components/plaques/map/MapControlsCompact.tsx
import React from 'react';
import { Navigation, Filter, Target, CornerDownLeft, Route as RouteIcon, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

type MapControlsCompactProps = {
  isLoadingLocation: boolean;
  isRoutingMode: boolean;
  findUserLocation: () => void;
  toggleRoutingMode: () => void;
  resetView: () => void;
  className?: string;
};

/**
 * A compact version of map controls for smaller screens
 */
const MapControlsCompact: React.FC<MapControlsCompactProps> = ({
  isLoadingLocation,
  isRoutingMode,
  findUserLocation,
  toggleRoutingMode,
  resetView,
  className = ''
}) => {
  return (
    <div className={`absolute bottom-4 right-4 z-10 bg-white rounded-full shadow-md p-2 ${className}`}>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full"
          onClick={resetView}
          title="Reset view"
        >
          <Target size={18} />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full"
          onClick={findUserLocation}
          disabled={isLoadingLocation}
          title="Find my location"
        >
          {isLoadingLocation ? (
            <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
          ) : (
            <Navigation size={18} />
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          className={`h-10 w-10 rounded-full ${isRoutingMode ? 'bg-green-50 text-green-600' : ''}`}
          onClick={toggleRoutingMode}
          title={isRoutingMode ? "Exit route planning" : "Plan a route"}
        >
          <RouteIcon size={18} />
        </Button>
      </div>
    </div>
  );
};

export default MapControlsCompact;