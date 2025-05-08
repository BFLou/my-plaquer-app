// src/components/maps/controls/MapControls.tsx
import React from 'react';
import { 
  Navigation, 
  Filter, 
  Route as RouteIcon, 
  Map
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

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

/**
 * MapControls Component
 * Provides control buttons for the map (location, filter, route, etc.)
 */
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
    <TooltipProvider>
      <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-md p-2">
        <div className="flex flex-col gap-2">
          {/* Location Button */}
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Find my location</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Filter Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`h-10 w-10 p-0 relative ${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
                disabled={!hasUserLocation}
              >
                <Filter size={18} className={showFilters ? 'text-blue-600' : ''} />
                {hasUserLocation && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Distance filter{!hasUserLocation ? " (find location first)" : ""}</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Route Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isRoutingMode ? "default" : "outline"}
                size="sm" 
                className={`h-10 w-10 p-0 relative ${isRoutingMode ? 'bg-green-600 text-white' : ''}`}
                onClick={toggleRoutingMode}
              >
                <RouteIcon size={18} />
                {isRoutingMode && routePointsCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center bg-green-500"
                  >
                    {routePointsCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isRoutingMode ? "Exit route planning" : "Plan a route"}</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Reset Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 p-0"
                onClick={resetMap}
              >
                <Map size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Reset map view</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MapControls;