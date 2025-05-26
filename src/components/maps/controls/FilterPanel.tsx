// src/components/maps/controls/FilterPanel.tsx - FIXED: Working slider and toggle
import React, { useEffect, useState } from 'react';
import { X, CornerUpLeft, Target, Eye, EyeOff, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FilterPanelProps {
  maxDistance: number;
  setMaxDistance: (distance: number) => void;
  filteredPlaquesCount: number;
  applyFilter: () => void;
  closeFilters: () => void;
  resetFilters: () => void;
  hasUserLocation: boolean;
  useImperial?: boolean;
  hideOutsidePlaques?: boolean;
  setHideOutsidePlaques?: (hide: boolean) => void;
  totalPlaques?: number;
}

/**
 * FIXED: Working FilterPanel with proper slider and toggle functionality
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  maxDistance, 
  setMaxDistance, 
  filteredPlaquesCount,
  applyFilter,
  closeFilters,
  resetFilters,
  hasUserLocation,
  useImperial = false,
  hideOutsidePlaques = false,
  setHideOutsidePlaques = () => {},
  totalPlaques = 0
}) => {
  // FIXED: Local state to track slider value for immediate UI feedback
  const [localDistance, setLocalDistance] = useState(maxDistance);
  const [localHideOutside, setLocalHideOutside] = useState(hideOutsidePlaques);

  // FIXED: Sync local state with props when they change
  useEffect(() => {
    setLocalDistance(maxDistance);
  }, [maxDistance]);

  useEffect(() => {
    setLocalHideOutside(hideOutsidePlaques);
  }, [hideOutsidePlaques]);
  
  // FIXED: Convert distance based on units for display
  const getDisplayDistance = (kmValue: number) => {
    return useImperial ? (kmValue * 0.621371) : kmValue;
  };

  const getKmFromDisplay = (displayValue: number) => {
    return useImperial ? (displayValue / 0.621371) : displayValue;
  };

  const displayDistance = getDisplayDistance(localDistance);
  const unit = useImperial ? 'mi' : 'km';
  
  // FIXED: Generate distance markers based on units with proper values
  const distanceMarkers = useImperial 
    ? [0.3, 0.6, 1.2, 1.9, 3.1] // miles
    : [0.5, 1, 2, 3, 5]; // kilometers

  const minDistance = Math.min(...distanceMarkers);
  const maxDistanceLimit = Math.max(...distanceMarkers);
  
  // FIXED: Handle distance change with immediate UI update and debounced backend update
  const handleDistanceChange = (values: number[]) => {
    const newDisplayValue = values[0];
    const newKmValue = getKmFromDisplay(newDisplayValue);
    
    // Update local state immediately for smooth slider movement
    setLocalDistance(newKmValue);
    
    // Debounce the actual state update to prevent too many calls
    clearTimeout(window.distanceChangeTimeout);
    window.distanceChangeTimeout = setTimeout(() => {
      setMaxDistance(newKmValue);
    }, 150);
  };

  // FIXED: Handle toggle change with immediate UI update
  const handleToggleChange = (checked: boolean) => {
    // Update local state immediately for smooth toggle animation
    setLocalHideOutside(checked);
    
    // Update parent state
    setHideOutsidePlaques(checked);
  };
  
  // Auto-apply filter when distance or hide toggle changes
  useEffect(() => {
    if (hasUserLocation && localDistance > 0) {
      // Small delay to prevent too many rapid updates
      const timeoutId = setTimeout(() => {
        applyFilter();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [localDistance, localHideOutside, hasUserLocation, applyFilter]);
  
  const formatDistance = (distance: number) => {
    return useImperial 
      ? `${(distance * 0.621371).toFixed(1)} mi`
      : `${distance.toFixed(1)} km`;
  };
  
  return (
    <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Target size={16} className="text-green-500" />
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
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} />
              <p className="font-medium">Location needed</p>
            </div>
            <p className="text-xs">Please find your location or search for an address to use distance filtering.</p>
          </div>
        ) : (
          <>            
            <div className="flex justify-between items-center">
              <span className="text-sm">
                Range: <span className="font-medium text-green-600">{formatDistance(localDistance)}</span>
              </span>
              <Badge 
                variant={filteredPlaquesCount > 0 ? "default" : "outline"} 
                className="text-xs bg-green-100 text-green-800"
              >
                {filteredPlaquesCount} found
              </Badge>
            </div>
            
            {/* FIXED: Slider with proper value binding and range */}
            <div className="pt-2 pb-6 px-1 relative">
              <Slider
                value={[displayDistance]}
                min={minDistance}
                max={maxDistanceLimit}
                step={useImperial ? 0.1 : 0.1}
                onValueChange={handleDistanceChange}
                className="w-full"
              />
              
              {/* Distance markers */}
              <div className="flex justify-between text-xs text-gray-500 absolute w-full left-0 -bottom-6">
                {distanceMarkers.map((marker) => (
                  <span 
                    key={marker} 
                    className={`${Math.abs(displayDistance - marker) < (useImperial ? 0.1 : 0.1) ? 'text-green-600 font-medium' : ''}`}
                  >
                    {marker}{unit}
                  </span>
                ))}
              </div>
            </div>
            
            {/* FIXED: Toggle with proper state binding */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100 mt-6">
              <div className="flex items-center gap-2">
                {localHideOutside ? <EyeOff size={14} className="text-gray-500" /> : <Eye size={14} className="text-gray-500" />}
                <Label htmlFor="hide-outside" className="text-sm font-medium cursor-pointer">
                  Hide distant plaques
                </Label>
              </div>
              <Switch
                id="hide-outside"
                checked={localHideOutside}
                onCheckedChange={handleToggleChange}
                size="sm"
              />
            </div>
            
            {/* FIXED: Status indicator with proper state */}
            {localHideOutside && filteredPlaquesCount > 0 && (
              <div className="text-xs text-gray-600 bg-green-50 p-3 rounded border border-green-200">
                <div className="flex justify-between items-center">
                  <span>Showing nearby plaques only</span>
                  <span className="font-medium text-green-700">{filteredPlaquesCount}/{totalPlaques}</span>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              <p className="flex items-center gap-1">
                <Target size={12} className="text-blue-600" />
                Circle and results update automatically
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;