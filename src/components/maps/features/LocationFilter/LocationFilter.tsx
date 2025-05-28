// src/components/maps/features/LocationFilter/LocationFilter.tsx - Fixed radius controls
import React, { useState } from 'react';
import { MapPin, X, Loader, ChevronDown, Target, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLocationFilter } from './useLocationFilter';

interface LocationFilterProps {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  onSetLocation: (coords: [number, number]) => void;
  onRadiusChange: (radius: number) => void;
  onClear: () => void;
  locationName?: string;
}

export const LocationFilter: React.FC<LocationFilterProps> = ({
  enabled,
  center,
  radius,
  onSetLocation,
  onRadiusChange,
  onClear,
  locationName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLocating, findMyLocation, setManualLocation } = useLocationFilter();
  
  const handleFindLocation = async () => {
    const coords = await findMyLocation();
    if (coords) {
      onSetLocation(coords);
      setIsOpen(false);
    }
  };
  
  const handleAddressSearch = async (address: string) => {
    const coords = await setManualLocation(address);
    if (coords) {
      onSetLocation(coords);
      setIsOpen(false);
    }
  };

  // Preset distance options with better coverage
  const distancePresets = [
    { value: 0.25, label: '250m', description: 'Very close' },
    { value: 0.5, label: '500m', description: 'Walking distance' },
    { value: 1, label: '1km', description: 'Short walk' },
    { value: 1.5, label: '1.5km', description: 'Medium walk' },
    { value: 2, label: '2km', description: 'Long walk' },
    { value: 3, label: '3km', description: 'Extended area' },
    { value: 5, label: '5km', description: 'Wide area' },
    { value: 10, label: '10km', description: 'Very wide area' }
  ];

  // Handle preset button clicks
  const handlePresetClick = (value: number) => {
    onRadiusChange(value);
  };

  // Handle slider changes
  const handleSliderChange = (values: number[]) => {
    onRadiusChange(values[0]);
  };

  // Format radius display
  const formatRadius = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km}km`;
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={enabled ? 'default' : 'outline'}
          size="sm"
          className="shadow-lg min-w-[140px]"
        >
          {enabled ? (
            <div className="flex items-center gap-2">
              <Target size={16} />
              <span>{formatRadius(radius)} radius</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span>Distance Filter</span>
            </div>
          )}
          <ChevronDown size={14} className="ml-2" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Ruler size={16} className="text-blue-500" />
              Distance Filter
            </h3>
            {enabled && (
              <Button variant="ghost" size="sm" onClick={onClear} className="h-8 w-8 p-0">
                <X size={14} />
              </Button>
            )}
          </div>
          {enabled && locationName && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Center: {locationName}
              </Badge>
            </div>
          )}
        </div>
        
        {!enabled ? (
          <div className="p-4 space-y-4">
            <div className="text-sm text-gray-600 mb-3">
              Set a center location to find plaques within a specific distance radius.
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleFindLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <Loader className="mr-2 animate-spin" size={16} />
              ) : (
                <Target className="mr-2" size={16} />
              )}
              Use my current location
            </Button>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Enter London postcode, area, or address..."
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleAddressSearch(e.currentTarget.value);
                  }
                }}
              />
              <div className="text-xs text-gray-500 mt-1">
                Examples: "NW1 2DB", "Camden", "Westminster Bridge"
              </div>
            </div>
            
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              💡 <strong>Tip:</strong> Use the search bar above to find specific postcodes and areas, then fine-tune the distance here.
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Current Radius Display */}
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatRadius(radius)}</div>
              <div className="text-xs text-blue-600/70">Current search radius</div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Quick distances:</div>
              <div className="grid grid-cols-2 gap-2">
                {distancePresets.slice(0, 6).map((preset) => (
                  <Button
                    key={preset.value}
                    variant={Math.abs(radius - preset.value) < 0.01 ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-10 px-2 flex flex-col items-center justify-center"
                    onClick={() => handlePresetClick(preset.value)}
                  >
                    <span className="font-medium">{preset.label}</span>
                    <span className="text-[10px] opacity-70">{preset.description}</span>
                  </Button>
                ))}
              </div>
              
              {/* Extended presets for larger distances */}
              <div className="grid grid-cols-2 gap-2">
                {distancePresets.slice(6).map((preset) => (
                  <Button
                    key={preset.value}
                    variant={Math.abs(radius - preset.value) < 0.01 ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-10 px-2 flex flex-col items-center justify-center"
                    onClick={() => handlePresetClick(preset.value)}
                  >
                    <span className="font-medium">{preset.label}</span>
                    <span className="text-[10px] opacity-70">{preset.description}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Custom Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-700">Custom distance:</div>
                <div className="text-sm font-bold text-blue-600">{formatRadius(radius)}</div>
              </div>
              
              <div className="px-1">
                <Slider
                  value={[radius]}
                  onValueChange={handleSliderChange}
                  min={0.1}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>100m</span>
                  <span>1km</span>
                  <span>5km</span>
                  <span>10km</span>
                </div>
              </div>
            </div>

            {/* Distance Info */}
            <div className="pt-3 border-t space-y-2">
              <div className="text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Walking time:</span>
                  <span className="font-medium">~{Math.round(radius * 12)} minutes</span>
                </div>
                {center && (
                  <div className="flex items-center justify-between mt-1">
                    <span>Center coordinates:</span>
                    <span className="font-mono text-[10px]">
                      {center[0].toFixed(4)}, {center[1].toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Clear Button */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onClear}
              >
                <X size={14} className="mr-2" />
                Clear Distance Filter
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};