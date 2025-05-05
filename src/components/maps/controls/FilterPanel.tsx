// src/components/maps/controls/FilterPanel.tsx
import React from 'react';
import { X, CornerUpLeft, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

type FilterPanelProps = {
  maxDistance: number;
  setMaxDistance: (distance: number) => void;
  filteredPlaquesCount: number;
  applyFilter: () => void;
  closeFilters: () => void;
  resetFilters: () => void;
  hasUserLocation: boolean;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  maxDistance, 
  setMaxDistance, 
  filteredPlaquesCount,
  applyFilter,
  closeFilters,
  resetFilters,
  hasUserLocation
}) => {
  // Distance marker generator for the slider
  const distanceMarkers = [0.5, 1, 2, 3, 5];
  
  return (
    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-20 w-72 sm:w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <MapPin size={16} className="text-gray-500" />
          Distance Filter
        </h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={resetFilters}
            title="Reset filters"
          >
            <CornerUpLeft size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={closeFilters}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {!hasUserLocation ? (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-700 text-sm">
            <p className="font-medium mb-1">Location needed</p>
            <p className="text-xs">Please find your location first using the locate button to use distance filtering.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm">Range: <span className="font-medium">{maxDistance} km</span></span>
              <Badge 
                variant={filteredPlaquesCount > 0 ? "secondary" : "outline"} 
                className="text-xs"
              >
                {filteredPlaquesCount > 0 
                  ? `${filteredPlaquesCount} plaques` 
                  : "Set range"}
              </Badge>
            </div>
            
            <div className="pt-2 pb-6 px-1 relative">
              <Slider
                value={[maxDistance]}
                min={0.5}
                max={5}
                step={0.1}
                onValueChange={(values) => setMaxDistance(parseFloat(values[0].toFixed(1)))}
                className="w-full"
              />
              
              {/* Distance markers */}
              <div className="flex justify-between text-xs text-gray-500 absolute w-full left-0 -bottom-6">
                {distanceMarkers.map((marker) => (
                  <span 
                    key={marker} 
                    className={`${maxDistance === marker ? 'text-blue-600 font-medium' : ''}`}
                  >
                    {marker}km
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-6 mb-1">
              <p>This filter will show plaques within {maxDistance} km of your current location.</p>
            </div>
            
            <Button 
              size="sm" 
              className="w-full"
              onClick={applyFilter}
              disabled={!hasUserLocation}
            >
              Apply Filter
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;