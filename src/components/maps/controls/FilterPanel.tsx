// src/components/maps/controls/FilterPanel.tsx - Compact version without distance settings
import React from 'react';
import { X, CornerUpLeft, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface FilterPanelProps {
  maxDistance: number;
  setMaxDistance: (distance: number) => void;
  filteredPlaquesCount: number;
  applyFilter: () => void;
  closeFilters: () => void;
  resetFilters: () => void;
  hasUserLocation: boolean;
  useImperial?: boolean;
}

/**
 * Compact FilterPanel Component - just shows distance slider and apply button
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  maxDistance, 
  setMaxDistance, 
  filteredPlaquesCount,
  applyFilter,
  closeFilters,
  resetFilters,
  hasUserLocation,
  useImperial = false
}) => {
  // Convert distance based on units
  const displayDistance = useImperial ? (maxDistance * 0.621371) : maxDistance;
  const unit = useImperial ? 'mi' : 'km';
  
  // Generate distance markers based on units
  const distanceMarkers = useImperial 
    ? [0.3, 0.6, 1.2, 1.9, 3.1] // miles
    : [0.5, 1, 2, 3, 5]; // kilometers
  
  const handleDistanceChange = (values: number[]) => {
    const newValue = values[0];
    // Convert back to km for internal storage if using imperial
    const kmValue = useImperial ? (newValue / 0.621371) : newValue;
    setMaxDistance(parseFloat(kmValue.toFixed(1)));
  };
  
  const formatDistance = (distance: number) => {
    return useImperial 
      ? `${(distance * 0.621371).toFixed(1)} mi`
      : `${distance.toFixed(1)} km`;
  };
  
  return (
    <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] w-72">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <MapPin size={16} className="text-gray-500" />
          Distance Filter
        </h3>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={resetFilters}
            title="Reset filters"
          >
            <CornerUpLeft size={14} />
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
            <p className="text-xs">Please find your location or search for an address to use distance filtering.</p>
          </div>
        ) : (
          <>            
            <div className="flex justify-between items-center">
              <span className="text-sm">Range: <span className="font-medium">{formatDistance(maxDistance)}</span></span>
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
                value={[displayDistance]}
                min={useImperial ? 0.3 : 0.5}
                max={useImperial ? 3.1 : 5}
                step={useImperial ? 0.1 : 0.1}
                onValueChange={handleDistanceChange}
                className="w-full"
              />
              
              {/* Distance markers */}
              <div className="flex justify-between text-xs text-gray-500 absolute w-full left-0 -bottom-6">
                {distanceMarkers.map((marker) => (
                  <span 
                    key={marker} 
                    className={`${Math.abs(displayDistance - marker) < 0.1 ? 'text-blue-600 font-medium' : ''}`}
                  >
                    {marker}{unit}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-6 mb-1">
              <p>Show plaques within {formatDistance(maxDistance)} of your location.</p>
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