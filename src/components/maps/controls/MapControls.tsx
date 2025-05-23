// src/components/maps/controls/MapControls.tsx - Updated with better filter icon
import React from 'react';
import { 
  Navigation, 
  Target, // Changed from Filter to Target for distance filter
  Route as RouteIcon, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  zoomIn?: () => void;
  zoomOut?: () => void;
  activeBaseMap?: string;
  changeBaseMap?: (type: string) => void;
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
  resetMap,
  zoomIn,
  zoomOut,
  activeBaseMap = 'street',
  changeBaseMap
}) => {

  const mapTypeNames: Record<string, string> = {
    'street': 'Street',
    'satellite': 'Satellite',
    'terrain': 'Terrain',
    'light': 'Light',
    'dark': 'Dark'
  };

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
          
          {/* Distance Filter Button - Changed icon to Target */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`h-10 w-10 p-0 relative ${showFilters ? 'bg-green-50 border-green-200' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
                disabled={!hasUserLocation}
              >
                <Target size={18} className={showFilters ? 'text-green-600' : ''} />
                {hasUserLocation && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Distance filter{!hasUserLocation ? " (set location first)" : ""}</p>
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
          
          {/* Zoom In Button */}
          {zoomIn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 w-10 p-0"
                  onClick={zoomIn}
                >
                  <ZoomIn size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Zoom in</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Zoom Out Button */}
          {zoomOut && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 w-10 p-0"
                  onClick={zoomOut}
                >
                  <ZoomOut size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Zoom out</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Map Layers Button */}
          {changeBaseMap && (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 w-10 p-0"
                    >
                      <Layers size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="left" className="w-32">
                    {Object.entries(mapTypeNames).map(([type, name]) => (
                      <DropdownMenuItem 
                        key={type}
                        className={activeBaseMap === type ? 'bg-blue-50 text-blue-700' : ''}
                        onClick={() => changeBaseMap(type)}
                      >
                        {name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Change map style</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Reset Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 p-0"
                onClick={resetMap}
              >
                <RotateCcw size={18} />
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