// src/components/maps/controls/MapControls.tsx - Updated to work with UnifiedSearchWidget
import React from 'react';
import { 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
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
  showFilters: boolean; // Kept for compatibility but not used
  setShowFilters: (show: boolean) => void; // Kept for compatibility but not used
  isRoutingMode: boolean;
  toggleRoutingMode: () => void;
  findUserLocation: () => void; // Kept for compatibility but not used
  hasUserLocation: boolean;
  routePointsCount: number;
  resetMap: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  activeBaseMap?: string;
  changeBaseMap?: (type: string) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
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
      <div className="absolute top-4 right-4 z-[800] bg-white rounded-lg shadow-md p-2">
        <div className="flex flex-col gap-2">
          
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