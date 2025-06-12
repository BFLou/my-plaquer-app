// src/components/maps/features/filters/CompactDistanceFilter.tsx
import React, { useState } from 'react';
import { MapPin, Target, ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

interface CompactDistanceFilterProps {
  distanceFilter: DistanceFilter;
  onSetLocation: (coords: [number, number]) => void;
  onRadiusChange: (radius: number) => void;
  onClear: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const CompactDistanceFilter: React.FC<CompactDistanceFilterProps> = ({
  distanceFilter,
  onSetLocation,
  onRadiusChange,
  onClear,
  isExpanded,
  onToggleExpanded
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');

  const handleMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        onSetLocation(coords);
        setIsLocating(false);
        toast.success('Location found');
      },
      () => {
        setIsLocating(false);
        toast.error('Could not get location');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress + ', London')}&limit=1&countrycodes=gb`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        onSetLocation(coords);
        setSearchAddress('');
        toast.success('Location found');
      } else {
        toast.error('Location not found');
      }
    } catch {
      toast.error('Search failed');
    }
  };

  return (
    <div className="space-y-2">
      {/* Compact header */}
      <Button
        variant={distanceFilter.enabled ? "default" : "outline"}
        size="sm"
        className="w-full h-9 justify-between text-xs"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={14} />
          <span className="truncate">
            {distanceFilter.enabled ? distanceFilter.locationName : 'Distance Filter'}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {distanceFilter.enabled && (
            <Badge variant="secondary" className="text-xs px-1 h-5">
              {distanceFilter.radius < 1 
                ? `${Math.round(distanceFilter.radius * 1000)}m` 
                : `${distanceFilter.radius}km`}
            </Badge>
          )}
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </Button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-2 p-2 bg-gray-50 rounded-md">
          {!distanceFilter.enabled ? (
            <>
              {/* Location setup */}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs justify-start"
                onClick={handleMyLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <div className="animate-spin h-3 w-3 border border-blue-500 rounded-full border-t-transparent mr-1" />
                ) : (
                  <Target size={12} className="mr-1" />
                )}
                My Location
              </Button>
              
              <div className="flex gap-1">
                <Input
                  placeholder="Postcode..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="text-xs h-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddressSearch}
                  disabled={!searchAddress.trim()}
                  className="h-8 px-2 text-xs"
                >
                  Go
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Active filter controls */}
              <div className="text-xs text-center p-2 bg-green-50 rounded border border-green-200">
                <div className="font-medium text-green-800 truncate">
                  {distanceFilter.locationName}
                </div>
                <div className="text-green-600">
                  Within {distanceFilter.radius < 1 
                    ? `${Math.round(distanceFilter.radius * 1000)}m` 
                    : `${distanceFilter.radius}km`}
                </div>
              </div>
              
              {/* Quick radius controls */}
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1, 2, 5].map((distance) => (
                  <Button
                    key={distance}
                    variant={Math.abs(distanceFilter.radius - distance) < 0.01 ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRadiusChange(distance)}
                    className="h-6 text-xs p-0"
                  >
                    {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
                  </Button>
                ))}
              </div>
              
              {/* Fine control */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRadiusChange(Math.max(0.1, distanceFilter.radius - 0.1))}
                    className="h-6 w-6 p-0"
                  >
                    <Minus size={10} />
                  </Button>
                  <span className="text-xs font-medium px-2">
                    {distanceFilter.radius < 1 
                      ? `${Math.round(distanceFilter.radius * 1000)}m` 
                      : `${distanceFilter.radius}km`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRadiusChange(Math.min(10, distanceFilter.radius + 0.1))}
                    className="h-6 w-6 p-0"
                  >
                    <Plus size={10} />
                  </Button>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="w-full h-6 text-xs text-red-600 hover:bg-red-50"
              >
                Clear Filter
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};