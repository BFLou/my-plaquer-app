// src/components/maps/features/Filters/CompactDistanceFilter.tsx - MOBILE-FIRST: Fully optimized for touch
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  MapPin,
  Target,
  Loader,
  X,
  Minus,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

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
  const mobile = isMobile();

  // Auto-expand with mobile-optimized timing
  useEffect(() => {
    if (distanceFilter.enabled && distanceFilter.locationName === 'Your Location') {
      console.log('🗺️ CompactDistanceFilter: Auto-expanding for new location');
      setTimeout(() => {
        if (!isExpanded) {
          onToggleExpanded();
          if (mobile) {
            triggerHapticFeedback('light');
          }
        }
      }, mobile ? 300 : 200); // Slightly longer delay on mobile
    }
  }, [distanceFilter.enabled, distanceFilter.locationName, isExpanded, onToggleExpanded, mobile]);

  // Enhanced location handling with mobile-specific optimizations
  const handleMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }

    setIsLocating(true);
    if (mobile) triggerHapticFeedback('medium');

    const timeoutId = setTimeout(() => {
      setIsLocating(false);
      toast.error('Location request timed out. Please try again.');
    }, mobile ? 20000 : 15000); // Longer timeout on mobile

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        onSetLocation(coords);
        setIsLocating(false);
        if (mobile) triggerHapticFeedback('success');
        
        const accuracy = position.coords.accuracy 
          ? ` (±${Math.round(position.coords.accuracy)}m accuracy)`
          : '';
        toast.success(`Location found${mobile ? '' : accuracy}`); // Shorter message on mobile
      },
      (error) => {
        clearTimeout(timeoutId);
        setIsLocating(false);
        if (mobile) triggerHapticFeedback('error');
        
        let errorMessage = 'Could not get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = mobile 
              ? 'Location access denied. Enable in browser settings.' 
              : 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Check GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        toast.error(errorMessage);
      },
      { 
        timeout: mobile ? 20000 : 15000, 
        enableHighAccuracy: true, 
        maximumAge: 300000
      }
    );
  }, [onSetLocation, mobile]);

  // Mobile-optimized slider handler
  const handleRadiusChange = useCallback((value: number[]) => {
    const newRadius = value[0];
    onRadiusChange(newRadius);
    
    if (mobile) {
      triggerHapticFeedback('light');
    }
  }, [onRadiusChange, mobile]);

  // Quick radius change with mobile feedback
  const handleQuickRadius = useCallback((distance: number) => {
    onRadiusChange(distance);
    if (mobile) triggerHapticFeedback('light');
  }, [onRadiusChange, mobile]);

  // Fine adjustment with mobile constraints
  const handleRadiusAdjust = useCallback((increment: number) => {
    const newRadius = Math.max(0.1, Math.min(10, distanceFilter.radius + increment));
    onRadiusChange(newRadius);
    if (mobile) triggerHapticFeedback('light');
  }, [distanceFilter.radius, onRadiusChange, mobile]);

  // Mobile-friendly radius display
  const displayRadius = useCallback((radius: number) => {
    if (radius < 1) {
      return `${Math.round(radius * 1000)}m`;
    } else if (radius < 10) {
      return `${radius.toFixed(1)}km`;
    } else {
      return `${Math.round(radius)}km`;
    }
  }, []);

  const currentDisplayRadius = displayRadius(distanceFilter.radius);

  // Clear handler with mobile confirmation
  const handleClear = useCallback(() => {
    if (mobile) triggerHapticFeedback('medium');
    onClear();
    toast.info('Distance filter cleared');
  }, [onClear, mobile]);

  // Toggle with mobile optimization
  const handleToggleExpanded = useCallback(() => {
    if (mobile) triggerHapticFeedback('light');
    onToggleExpanded();
  }, [onToggleExpanded, mobile]);

  return (
    <div 
      className={cn(
        "bg-white rounded-lg border shadow-sm compact-distance-filter-container",
        mobile ? "p-4" : "p-3" // More padding on mobile
      )}
      style={{
        position: 'relative',
        zIndex: 1005,
        isolation: 'isolate',
      }}
    >
      {/* MOBILE-OPTIMIZED: Header with larger touch target */}
      <div
        className={cn(
          "flex items-center justify-between cursor-pointer rounded-md transition-all duration-200",
          mobile 
            ? "py-3 px-2 min-h-[52px] hover:bg-gray-50 active:bg-gray-100" 
            : "py-1 hover:bg-gray-50"
        )}
        onClick={handleToggleExpanded}
        style={{
          position: 'relative',
          zIndex: 1006,
          // CRITICAL: Ensure proper touch target on mobile
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MapPin size={mobile ? 18 : 16} className="text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-gray-700",
              mobile ? "text-base" : "text-sm"
            )}>
              Distance Filter
            </h4>
            {/* MOBILE-OPTIMIZED: Better active indicator */}
            {distanceFilter.enabled && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={cn(
                  "text-green-600 font-medium",
                  mobile ? "text-sm" : "text-xs"
                )}>
                  Active: {currentDisplayRadius}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className={cn(
          "flex-shrink-0 rounded-full transition-transform duration-200",
          mobile ? "p-2" : "p-1",
          isExpanded && "rotate-180"
        )}>
          <ChevronDown size={mobile ? 18 : 16} className="text-gray-500" />
        </div>
      </div>

      {/* MOBILE-OPTIMIZED: Smooth expansion with proper spacing */}
      {isExpanded && (
        <div 
          className={cn(
            "border-t mt-3 -mx-3 px-3 animate-in slide-in-from-top-2 duration-300",
            mobile ? "pt-4 -mx-4 px-4" : "pt-3"
          )}
          style={{
            position: 'relative',
            zIndex: 1006,
            background: 'white',
            isolation: 'isolate',
          }}
        >
          {!distanceFilter.enabled ? (
            <div className={cn(
              "space-y-4",
              mobile && "space-y-5"
            )}>
              {/* MOBILE-OPTIMIZED: Large, accessible location button */}
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left transition-all duration-200",
                  mobile 
                    ? "h-14 text-base px-4 rounded-xl" 
                    : "h-9 text-xs",
                  isLocating && "opacity-75",
                  !isLocating && "hover:shadow-md active:scale-[0.98]"
                )}
                onClick={handleMyLocation}
                disabled={isLocating}
                style={{
                  position: 'relative',
                  zIndex: 1007,
                  fontSize: mobile ? '16px' : undefined, // Prevent iOS zoom
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  {isLocating ? (
                    <Loader className="animate-spin flex-shrink-0" size={mobile ? 18 : 14} />
                  ) : (
                    <Target className="flex-shrink-0" size={mobile ? 18 : 14} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium",
                      mobile ? "text-base" : "text-xs"
                    )}>
                      {isLocating ? 'Finding your location...' : 'Use my current location'}
                    </div>
                    {mobile && !isLocating && (
                      <div className="text-sm text-gray-500 mt-1">
                        Tap to find plaques near you
                      </div>
                    )}
                  </div>
                </div>
              </Button>

              {/* MOBILE-OPTIMIZED: Better formatted examples */}
              <div className={cn(
                "text-gray-500 bg-blue-50 rounded-xl border border-blue-100",
                mobile ? "p-4" : "p-3"
              )}>
                <div className={cn(
                  "font-medium text-blue-700 mb-2 flex items-center gap-2",
                  mobile ? "text-sm" : "text-xs"
                )}>
                  💡 Try searching by:
                </div>
                <div className={cn(
                  "space-y-1",
                  mobile ? "text-sm" : "text-xs"
                )}>
                  <div>• <strong>Postcode:</strong> "NW1 2DB", "SW1A 1AA"</div>
                  <div>• <strong>Area:</strong> "Camden", "Westminster"</div>
                  <div>• <strong>Landmark:</strong> "Tower Bridge"</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              "space-y-4",
              mobile && "space-y-5"
            )}>
              {/* MOBILE-OPTIMIZED: Enhanced active display */}
              <div 
                className={cn(
                  "bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm",
                  mobile ? "p-4" : "p-3"
                )}
                style={{
                  position: 'relative',
                  zIndex: 1007,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium text-green-800 flex items-center gap-2 mb-2",
                      mobile ? "text-base" : "text-sm"
                    )}>
                      <MapPin size={mobile ? 16 : 12} className="text-green-600 flex-shrink-0" />
                      <span className="truncate">{distanceFilter.locationName}</span>
                    </div>
                    <div className={cn(
                      "text-green-600",
                      mobile ? "text-sm" : "text-xs"
                    )}>
                      Showing plaques within <span className="font-semibold">{currentDisplayRadius}</span> radius
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className={cn(
                      "text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 rounded-lg transition-all",
                      mobile 
                        ? "h-12 w-12 min-w-[48px] min-h-[48px]" 
                        : "h-7 w-7 p-0"
                    )}
                    style={{
                      position: 'relative',
                      zIndex: 1008,
                    }}
                    title="Clear distance filter"
                  >
                    <X size={mobile ? 16 : 12} />
                  </Button>
                </div>
              </div>

              {/* MOBILE-OPTIMIZED: Radius controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "font-medium text-gray-600",
                    mobile ? "text-sm" : "text-xs"
                  )}>
                    Search Radius
                  </div>
                  <div className={cn(
                    "font-semibold px-3 py-1.5 bg-gray-50 rounded-lg border text-gray-700",
                    mobile ? "text-base" : "text-sm"
                  )}>
                    {currentDisplayRadius}
                  </div>
                </div>

                {/* MOBILE-OPTIMIZED: Quick radius buttons */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
                  {[0.5, 1, 2, 5].map((distance) => {
                    const isActive = Math.abs(distanceFilter.radius - distance) < 0.01;
                    return (
                      <Button
                        key={distance}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleQuickRadius(distance)}
                        className={cn(
                          "font-medium transition-all duration-200 rounded-lg",
                          mobile 
                            ? "h-12 text-base" 
                            : "h-7 text-xs",
                          isActive && "shadow-md scale-105",
                          !isActive && mobile && "hover:scale-[1.02] active:scale-[0.98]"
                        )}
                        style={{
                          position: 'relative',
                          zIndex: 1007,
                          fontSize: mobile ? '16px' : undefined, // Prevent iOS zoom
                        }}
                      >
                        {displayRadius(distance)}
                      </Button>
                    );
                  })}
                </div>

                {/* MOBILE-OPTIMIZED: Slider with fine controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRadiusAdjust(-0.1)}
                      disabled={distanceFilter.radius <= 0.1}
                      className={cn(
                        "flex-shrink-0 rounded-lg transition-all",
                        mobile 
                          ? "h-12 w-12 min-w-[48px]" 
                          : "h-7 w-7 p-0",
                        !mobile && "hover:scale-110 active:scale-95"
                      )}
                      style={{
                        position: 'relative',
                        zIndex: 1007,
                      }}
                      title="Decrease radius"
                    >
                      <Minus size={mobile ? 16 : 12} />
                    </Button>
                    
                    <div className="flex-1 px-2">
                      <Slider
                        value={[distanceFilter.radius]}
                        onValueChange={handleRadiusChange}
                        min={0.1}
                        max={10}
                        step={0.1}
                        className={cn(
                          "w-full",
                          mobile && "touch-manipulation"
                        )}
                        style={{
                          position: 'relative',
                          zIndex: 1007,
                          // MOBILE-OPTIMIZED: Larger touch target for slider
                          ...(mobile && {
                            height: '48px',
                            padding: '12px 0',
                          })
                        }}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRadiusAdjust(0.1)}
                      disabled={distanceFilter.radius >= 10}
                      className={cn(
                        "flex-shrink-0 rounded-lg transition-all",
                        mobile 
                          ? "h-12 w-12 min-w-[48px]" 
                          : "h-7 w-7 p-0",
                        !mobile && "hover:scale-110 active:scale-95"
                      )}
                      style={{
                        position: 'relative',
                        zIndex: 1007,
                      }}
                      title="Increase radius"
                    >
                      <Plus size={mobile ? 16 : 12} />
                    </Button>
                  </div>

                  {/* MOBILE-OPTIMIZED: Slider labels */}
                  <div className="flex justify-between text-xs text-gray-400 px-1">
                    <span>100m</span>
                    <span>1km</span>
                    <span>5km</span>
                    <span>10km</span>
                  </div>
                </div>

                {/* MOBILE-OPTIMIZED: Walking time estimate */}
                <div className={cn(
                  "text-gray-500 bg-gray-50 rounded-lg border",
                  mobile ? "p-3" : "p-2"
                )}>
                  <div className="flex items-center justify-between">
                    <span className={mobile ? "text-sm" : "text-xs"}>
                      Estimated walking time:
                    </span>
                    <span className={cn(
                      "font-medium text-gray-700",
                      mobile ? "text-sm" : "text-xs"
                    )}>
                      ~{Math.round(distanceFilter.radius * 12)} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};