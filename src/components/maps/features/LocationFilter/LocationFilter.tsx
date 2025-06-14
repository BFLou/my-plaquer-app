// src/components/maps/features/LocationFilter/LocationFilter.tsx - REDESIGNED: Simplified approach
import React, { useState } from 'react';
import { MapPin, X, Loader, Target, Ruler, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  locationName,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const { isLocating, findMyLocation, setManualLocation } = useLocationFilter();

  // Quick distance presets
  const quickDistances = [0.5, 1, 2, 5];

  // Handle finding user location
  const handleFindLocation = async () => {
    const coords = await findMyLocation();
    if (coords) {
      onSetLocation(coords);
      setShowControls(false);
    }
  };

  // Handle address search
  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    const coords = await setManualLocation(searchAddress);
    if (coords) {
      onSetLocation(coords);
      setSearchAddress('');
      setShowControls(false);
    }
  };

  // Format radius display
  const formatRadius = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km}km`;
  };

  // Handle key press in search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddressSearch();
    }
  };

  // Main button display logic
  const getMainButtonContent = () => {
    if (enabled && locationName) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <Target size={16} className="text-green-600 flex-shrink-0" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-medium truncate max-w-[120px]">
              {locationName}
            </span>
            <span className="text-xs text-gray-500">
              {formatRadius(radius)} radius
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <MapPin size={16} />
        <span>Distance Filter</span>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Main Toggle Button */}
      <Button
        variant={enabled ? 'default' : 'outline'}
        size="sm"
        className="shadow-lg min-w-[160px] h-10 justify-start"
        onClick={() => setShowControls(!showControls)}
      >
        {getMainButtonContent()}
        <Settings size={14} className="ml-auto flex-shrink-0" />
      </Button>

      {/* Controls Panel */}
      {showControls && (
        <Card className="absolute top-12 right-0 w-80 z-[1100] shadow-xl border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ruler size={16} className="text-blue-500" />
                Distance Filter Setup
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowControls(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X size={14} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Current Status */}
            {enabled && center && locationName && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800">
                      Active: {locationName}
                    </div>
                    <div className="text-xs text-green-600">
                      {formatRadius(radius)} search radius
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            )}

            {/* Location Setup */}
            {!enabled && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Set Center Location
                </Label>

                {/* My Location Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-10"
                  onClick={handleFindLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <>
                      <Loader className="mr-2 animate-spin" size={16} />
                      Finding location...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2" size={16} />
                      Use my current location
                    </>
                  )}
                </Button>

                {/* Address Search */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter postcode or address..."
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddressSearch}
                    disabled={!searchAddress.trim()}
                    size="sm"
                  >
                    Go
                  </Button>
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  💡 Try: "NW1 2DB", "Camden", "Westminster Bridge"
                </div>
              </div>
            )}

            {/* Distance Controls - Show when enabled */}
            {enabled && (
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  Search Radius
                </Label>

                {/* Quick Distance Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {quickDistances.map((distance) => (
                    <Button
                      key={distance}
                      variant={
                        Math.abs(radius - distance) < 0.01
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      className="h-8 text-xs font-medium"
                      onClick={() => onRadiusChange(distance)}
                    >
                      {formatRadius(distance)}
                    </Button>
                  ))}
                </div>

                {/* Custom Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Custom:</span>
                    <Badge variant="secondary" className="text-xs">
                      {formatRadius(radius)}
                    </Badge>
                  </div>

                  <Slider
                    value={[radius]}
                    onValueChange={(values) => onRadiusChange(values[0])}
                    min={0.1}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>100m</span>
                    <span>1km</span>
                    <span>5km</span>
                    <span>10km</span>
                  </div>
                </div>

                {/* Distance Info */}
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="flex justify-between">
                    <span>Walking time:</span>
                    <span className="font-medium">
                      ~{Math.round(radius * 12)} min
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
              {enabled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    onClear();
                    setShowControls(false);
                  }}
                >
                  Clear Filter
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowControls(false)}
              >
                {enabled ? 'Done' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
