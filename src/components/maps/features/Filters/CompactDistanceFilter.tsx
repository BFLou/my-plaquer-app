// src/components/maps/features/Filters/CompactDistanceFilter.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Target,
  Loader,
  X,
  Minus,
  Plus,
} from 'lucide-react';
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
  onToggleExpanded,
}) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
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

  return (
    <div className="bg-white rounded-md border p-3">
      <div
        className="flex items-center justify-between cursor-pointer py-1"
        onClick={onToggleExpanded}
      >
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <MapPin size={16} className="text-green-500" />
          Distance Filter
        </h4>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </div>

      {isExpanded && (
        <div className="pt-3 border-t mt-3 -mx-3 px-3">
          {!distanceFilter.enabled ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-9 justify-start text-xs"
                onClick={handleMyLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <Loader className="mr-2 animate-spin" size={14} />
                ) : (
                  <Target className="mr-2" size={14} />
                )}
                {isLocating ? 'Finding location...' : 'Use my current location'}
              </Button>

              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                庁 Try: "NW1 2DB", "Camden", "Westminster Bridge"
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800">
                      桃 {distanceFilter.locationName}
                    </div>
                    <div className="text-xs text-green-600">
                      Within{' '}
                      {distanceFilter.radius < 1
                        ? `${Math.round(distanceFilter.radius * 1000)}m`
                        : `${distanceFilter.radius}km`}{' '}
                      radius
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                  >
                    <X size={12} />
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">
                  Search Radius
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[0.5, 1, 2, 5].map((distance) => (
                    <Button
                      key={distance}
                      variant={
                        Math.abs(distanceFilter.radius - distance) < 0.01
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => onRadiusChange(distance)}
                      className="h-7 text-xs font-medium"
                    >
                      {distance < 1
                        ? `${Math.round(distance * 1000)}m`
                        : `${distance}km`}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onRadiusChange(Math.max(0.1, distanceFilter.radius - 0.1))
                    }
                    className="h-7 w-7 p-0"
                  >
                    <Minus size={12} />
                  </Button>
                  <span className="text-sm font-medium px-3">
                    {distanceFilter.radius < 1
                      ? `${Math.round(distanceFilter.radius * 1000)}m`
                      : `${distanceFilter.radius}km`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onRadiusChange(Math.min(10, distanceFilter.radius + 0.1))
                    }
                    className="h-7 w-7 p-0"
                  >
                    <Plus size={12} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
