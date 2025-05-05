// src/components/plaques/map/MapControls.tsx
import React from 'react';
import { Navigation, Filter, Target, CornerDownLeft, Route as RouteIcon, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

type MapControlsProps = {
  isLoadingLocation: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  isRoutingMode: boolean;
  toggleRoutingMode: () => void;
  findUserLocation: () => void;
  maxDistance: number;
  setMaxDistance: (distance: number) => void;
  filteredPlaquesCount: number;
  resetFilters: () => void;
  applyDistanceFilter: () => void;
};

const MapControls: React.FC<MapControlsProps> = ({
  isLoadingLocation,
  showFilters,
  setShowFilters,
  isRoutingMode,
  toggleRoutingMode,
  findUserLocation,
  maxDistance,
  setMaxDistance,
  filteredPlaquesCount,
  resetFilters,
  applyDistanceFilter
}) => {
  return (
    <>
      {/* Map controls */}
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
          
          {/* Reset button - visible when filters active */}
          {showFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 text-red-500"
              onClick={resetFilters}
              title="Reset filters"
            >
              <CornerDownLeft size={16} />
            </Button>
          )}
        </div>
      </div>
      
      {/* Distance filter panel */}
      {showFilters && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-10 w-64">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Distance Filter</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setShowFilters(false)}
            >
              <X size={14} />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Range: {maxDistance} km</span>
              <Badge variant="outline" className="text-xs">
                {filteredPlaquesCount} plaques
              </Badge>
            </div>
            
            <Slider
              value={[maxDistance]}
              min={0.5}
              max={5}
              step={0.5}
              onValueChange={(values) => setMaxDistance(values[0])}
              className="w-full"
            />
            
            <Button 
              size="sm" 
              className="w-full"
              onClick={applyDistanceFilter}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default MapControls;