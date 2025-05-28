// src/components/maps/features/LocationFilter/LocationFilter.tsx
import React, { useState } from 'react';
import { MapPin, X, Loader, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
}

export const LocationFilter: React.FC<LocationFilterProps> = ({
  enabled,
  center,
  radius,
  onSetLocation,
  onRadiusChange,
  onClear
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLocating, findMyLocation, setManualLocation } = useLocationFilter();
  
  const handleFindLocation = async () => {
    const coords = await findMyLocation();
    if (coords) {
      onSetLocation(coords);
    }
  };
  
  const handleAddressSearch = async (address: string) => {
    const coords = await setManualLocation(address);
    if (coords) {
      onSetLocation(coords);
      setIsOpen(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={enabled ? 'default' : 'outline'}
          size="sm"
          className="shadow-lg"
        >
          <MapPin size={16} className="mr-2" />
          {enabled ? `Within ${radius}km` : 'Distance Filter'}
          <ChevronDown size={14} className="ml-2" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Distance Filter</h3>
            {enabled && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                <X size={14} />
              </Button>
            )}
          </div>
          
          {!enabled ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleFindLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <Loader className="mr-2 animate-spin" size={16} />
                ) : (
                  <MapPin className="mr-2" size={16} />
                )}
                Use my location
              </Button>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Or search for a location..."
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddressSearch(e.currentTarget.value);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Radius</label>
                  <span className="text-sm text-gray-500">{radius}km</span>
                </div>
                <Slider
                  value={[radius]}
                  onValueChange={([value]) => onRadiusChange(value)}
                  min={0.5}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
              </div>
              
              <div className="text-xs text-gray-500">
                Showing plaques within {radius}km of your selected location
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};