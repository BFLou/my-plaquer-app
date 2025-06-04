// src/components/maps/features/UnifiedControlPanel.tsx - COMPLETE MOBILE OPTIMIZED
import React, { useState } from 'react';
import { 
  MapPin, 
  Filter, 
  Route, 
  RotateCcw,
  X,
  Target
} from 'lucide-react';
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileInput } from "@/components/ui/mobile-input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plaque } from '@/types/plaque';
import DiscoverFilterDialog from '../../plaques/DiscoverFilterDialog';
import { capitalizeWords } from '@/utils/stringUtils';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';

// Distance filter interface
interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

interface UnifiedControlPanelProps {
  // Distance filter props
  distanceFilter: DistanceFilter;
  onSetLocation: (coords: [number, number]) => void;
  onRadiusChange: (radius: number) => void;
  onClearDistanceFilter: () => void;
  
  // Standard filter props
  plaques: Plaque[];
  visiblePlaques: Plaque[];
  selectedColors: string[];
  selectedPostcodes: string[];
  selectedProfessions: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
  onColorsChange: (values: string[]) => void;
  onPostcodesChange: (values: string[]) => void;
  onProfessionsChange: (values: string[]) => void;
  onVisitedChange: (value: boolean) => void;
  onFavoritesChange: (value: boolean) => void;
  onResetStandardFilters: () => void;
  
  // Route props
  routeMode: boolean;
  onToggleRoute: () => void;
  routePointsCount: number;
  
  // Reset props
  onResetView: () => void;
  
  // External functions
  isPlaqueVisited?: (id: number) => boolean;
  isFavorite?: (id: number) => boolean;
  
  className?: string;
}

export const UnifiedControlPanel: React.FC<UnifiedControlPanelProps> = ({
  distanceFilter,
  onSetLocation,
  onRadiusChange,
  onClearDistanceFilter,
  plaques,
  selectedColors,
  selectedPostcodes,
  selectedProfessions,
  onlyVisited,
  onlyFavorites,
  onColorsChange,
  onPostcodesChange,
  onProfessionsChange,
  onVisitedChange,
  onFavoritesChange,
  onResetStandardFilters,
  routeMode,
  onToggleRoute,
  routePointsCount,
  onResetView,
  isPlaqueVisited,
  isFavorite,
  className = ''
}) => {
  // Mobile detection and responsive setup
  const mobile = isMobile();
  const safeArea = useSafeArea();
  
  // State management
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [showStandardFilters, setShowStandardFilters] = useState(false);

  // Calculate active standard filters count
  const activeStandardFiltersCount = 
    selectedColors.length + 
    selectedPostcodes.length + 
    selectedProfessions.length + 
    (onlyVisited ? 1 : 0) + 
    (onlyFavorites ? 1 : 0);

  // Generate filter options from all plaques
  const filterOptions = React.useMemo(() => {
    const postcodeCount: Record<string, number> = {};
    const colorCount: Record<string, number> = {};
    const professionCount: Record<string, number> = {};
    
    plaques.forEach(plaque => {
      if (plaque.postcode && plaque.postcode !== "Unknown") {
        postcodeCount[plaque.postcode] = (postcodeCount[plaque.postcode] || 0) + 1;
      }
      
      const color = plaque.color?.toLowerCase();
      if (color && color !== "unknown") {
        colorCount[color] = (colorCount[color] || 0) + 1;
      }
      
      if (plaque.profession && plaque.profession !== "Unknown") {
        professionCount[plaque.profession] = (professionCount[plaque.profession] || 0) + 1;
      }
    });
    
    return {
      postcodeOptions: Object.entries(postcodeCount)
        .map(([value, count]) => ({ label: value, value, count }))
        .sort((a, b) => b.count - a.count),
      
      colorOptions: Object.entries(colorCount)
        .map(([value, count]) => ({
          label: capitalizeWords(value),
          value,
          count
        }))
        .sort((a, b) => b.count - a.count),
      
      professionOptions: Object.entries(professionCount)
        .map(([value, count]) => ({
          label: capitalizeWords(value),
          value,
          count
        }))
        .sort((a, b) => b.count - a.count)
    };
  }, [plaques]);

  const handleResetAll = () => {
    if (mobile) {
      triggerHapticFeedback('medium');
    }
    onClearDistanceFilter();
    onResetStandardFilters();
    onResetView();
  };

  const handleButtonClick = (action: string, callback: () => void) => {
    if (mobile) {
      triggerHapticFeedback('selection');
    }
    console.log(`Control panel: ${action}`);
    callback();
  };

  return (
    <>
      {/* Main Control Panel Card */}
      <Card 
        className={`${mobile ? 'w-36' : 'w-40 sm:w-48'} shadow-lg backdrop-blur-sm bg-white/95 border border-gray-200/50 ${className}`}
        style={{
          marginLeft: mobile ? safeArea.left : undefined,
          marginTop: mobile ? safeArea.top : undefined
        }}
      >
        <CardContent className={`${mobile ? 'p-1.5' : 'p-2'} space-y-1`}>
          
          {/* Distance Filter Button */}
          <MobileButton
            variant={distanceFilter.enabled ? "default" : "outline"}
            size="sm"
            className={`w-full justify-between ${mobile ? 'h-10 text-xs' : 'h-8 text-xs'} font-medium`}
            onClick={() => handleButtonClick('Distance Filter', () => setShowDistanceFilter(true))}
          >
            <div className="flex items-center gap-1.5">
              <MapPin size={mobile ? 16 : 14} />
              <span className="truncate">Distance</span>
            </div>
            {distanceFilter.enabled && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-[16px]">
                {distanceFilter.radius < 1 
                  ? `${Math.round(distanceFilter.radius * 1000)}m` 
                  : `${distanceFilter.radius}km`}
              </Badge>
            )}
          </MobileButton>

          {/* Standard Filters Button */}
          <MobileButton
            variant={activeStandardFiltersCount > 0 ? "default" : "outline"}
            size="sm"
            className={`w-full justify-between ${mobile ? 'h-10 text-xs' : 'h-8 text-xs'} font-medium`}
            onClick={() => handleButtonClick('Standard Filters', () => setShowStandardFilters(true))}
          >
            <div className="flex items-center gap-1.5">
              <Filter size={mobile ? 16 : 14} />
              <span className="truncate">Filters</span>
            </div>
            {activeStandardFiltersCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-[16px]">
                {activeStandardFiltersCount}
              </Badge>
            )}
          </MobileButton>

          {/* Route Planning Button */}
          <MobileButton
            variant={routeMode ? "default" : "outline"}
            size="sm"
            className={`w-full justify-between ${mobile ? 'h-10 text-xs' : 'h-8 text-xs'} font-medium`}
            onClick={() => handleButtonClick('Route Toggle', onToggleRoute)}
          >
            <div className="flex items-center gap-1.5">
              <Route size={mobile ? 16 : 14} />
              <span className="truncate">{routeMode ? "Planning" : "Route"}</span>
            </div>
            {routePointsCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-[16px]">
                {routePointsCount}
              </Badge>
            )}
          </MobileButton>

          {/* Reset Button */}
          <MobileButton
            variant="outline"
            size="sm"
            className={`w-full justify-start ${mobile ? 'h-10 text-xs' : 'h-8 text-xs'} font-medium text-gray-600 hover:text-gray-800`}
            onClick={() => handleButtonClick('Reset All', handleResetAll)}
          >
            <div className="flex items-center gap-1.5">
              <RotateCcw size={mobile ? 16 : 14} />
              <span>Reset</span>
            </div>
          </MobileButton>

        </CardContent>
      </Card>

      {/* Distance Filter Modal - Mobile optimized */}
      {showDistanceFilter && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowDistanceFilter(false)} 
          />
          <div 
            className={`relative z-[9999] ${mobile ? 'w-[95vw]' : 'w-full max-w-sm sm:max-w-md'} max-h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col`}
            style={{
              marginBottom: mobile ? safeArea.bottom : undefined
            }}
          >
            
            {/* Compact Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={18} />
                  <h2 className={`${mobile ? 'text-lg' : 'text-lg'} font-semibold`}>Distance Filter</h2>
                </div>
                <MobileButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDistanceFilter(false)}
                  className="h-8 w-8 p-1 rounded-full hover:bg-white/20 text-white"
                >
                  <X size={16} />
                </MobileButton>
              </div>
              
              {distanceFilter.enabled && distanceFilter.locationName && (
                <div className={`text-sm text-blue-100 mt-1 ${mobile ? 'text-base' : ''}`}>
                  Active: {distanceFilter.locationName}
                </div>
              )}
            </div>

            {/* Compact Content */}
            <div className="flex-grow overflow-auto p-4">
              {!distanceFilter.enabled ? (
                // Setup new distance filter - Mobile optimized
                <div className="space-y-4">
                  <div className={`${mobile ? 'text-base' : 'text-sm'} text-gray-600`}>
                    Set a location to find plaques within a specific distance.
                  </div>
                  
                  {/* My Location Button */}
                  <MobileButton
                    variant="outline"
                    className="w-full p-3 justify-start"
                    onClick={async () => {
                      if (navigator.geolocation) {
                        if (mobile) triggerHapticFeedback('selection');
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const coords: [number, number] = [
                              position.coords.latitude,
                              position.coords.longitude
                            ];
                            onSetLocation(coords);
                            setShowDistanceFilter(false);
                            if (mobile) triggerHapticFeedback('success');
                          },
                          (error) => console.error('Error getting location:', error)
                        );
                      }
                    }}
                  >
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Target size={16} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className={`font-medium ${mobile ? 'text-base' : 'text-sm'}`}>Use my location</div>
                      <div className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500`}>Find nearby plaques</div>
                    </div>
                  </MobileButton>
                  
                  {/* Manual Address Input */}
                  <div className="space-y-2">
                    <label className={`${mobile ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
                      Or enter location:
                    </label>
                    <div className="flex gap-2">
                      <MobileInput
                        placeholder="London postcode or area..."
                        className="flex-1"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            if (mobile) triggerHapticFeedback('selection');
                            try {
                              const query = e.currentTarget.value.includes('London') 
                                ? e.currentTarget.value 
                                : `${e.currentTarget.value}, London, UK`;
                              
                              const response = await fetch(
                                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&countrycodes=gb`
                              );
                              const data = await response.json();
                              
                              if (data && data.length > 0) {
                                const coords: [number, number] = [
                                  parseFloat(data[0].lat),
                                  parseFloat(data[0].lon)
                                ];
                                onSetLocation(coords);
                                setShowDistanceFilter(false);
                                if (mobile) triggerHapticFeedback('success');
                              }
                            } catch (error) {
                              console.error('Error searching location:', error);
                            }
                          }
                        }}
                        preventZoom={true}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Manage existing distance filter
                <div className="space-y-4">
                  {/* Current Location Display */}
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className={`${mobile ? 'text-xl' : 'text-lg'} font-bold text-green-600`}>
                      {distanceFilter.radius < 1 
                        ? `${Math.round(distanceFilter.radius * 1000)}m` 
                        : `${distanceFilter.radius}km`}
                    </div>
                    <div className={`${mobile ? 'text-base' : 'text-sm'} text-green-700 truncate`}>
                      from {distanceFilter.locationName}
                    </div>
                  </div>

                  {/* Quick Distance Presets */}
                  <div className="space-y-2">
                    <div className={`${mobile ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
                      Quick distances:
                    </div>
                    <div className={`grid ${mobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                      {[0.5, 1, 1.5, 2, 3, 5].map((distance) => (
                        <MobileButton
                          key={distance}
                          variant={Math.abs(distanceFilter.radius - distance) < 0.01 ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (mobile) triggerHapticFeedback('selection');
                            onRadiusChange(distance);
                          }}
                          className={`${mobile ? 'h-10 text-sm' : 'h-8 text-xs'} font-medium`}
                        >
                          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
                        </MobileButton>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className={`${mobile ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
                        Custom:
                      </div>
                      <div className={`${mobile ? 'text-base' : 'text-sm'} font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded`}>
                        {distanceFilter.radius < 1 
                          ? `${Math.round(distanceFilter.radius * 1000)}m` 
                          : `${distanceFilter.radius}km`}
                      </div>
                    </div>
                    
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={distanceFilter.radius}
                      onChange={(e) => {
                        if (mobile) triggerHapticFeedback('light');
                        onRadiusChange(parseFloat(e.target.value));
                      }}
                      className={`w-full ${mobile ? 'h-3' : 'h-2'} bg-gray-200 rounded-lg appearance-none cursor-pointer`}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>100m</span>
                      <span>5km</span>
                      <span>10km</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Footer Actions */}
            <div className="p-3 border-t bg-gray-50">
              <div className={`flex gap-2 ${mobile ? 'flex-col' : ''}`}>
                {distanceFilter.enabled ? (
                  <>
                    <MobileButton
                      variant="outline"
                      onClick={() => {
                        if (mobile) triggerHapticFeedback('medium');
                        onClearDistanceFilter();
                        setShowDistanceFilter(false);
                      }}
                      className={`${mobile ? 'w-full' : 'flex-1'} border-red-300 text-red-600 hover:bg-red-50`}
                    >
                      Clear
                    </MobileButton>
                    <MobileButton
                      onClick={() => setShowDistanceFilter(false)}
                      className={`${mobile ? 'w-full' : 'flex-1'} bg-blue-600 hover:bg-blue-700`}
                    >
                      Done
                    </MobileButton>
                  </>
                ) : (
                  <MobileButton
                    variant="outline"
                    onClick={() => setShowDistanceFilter(false)}
                    className="w-full bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </MobileButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Filters Dialog - Mobile optimized */}
      <DiscoverFilterDialog
        isOpen={showStandardFilters}
        onClose={() => setShowStandardFilters(false)}
        
        postcodes={filterOptions.postcodeOptions}
        selectedPostcodes={selectedPostcodes}
        onPostcodesChange={onPostcodesChange}
        
        colors={filterOptions.colorOptions}
        selectedColors={selectedColors}
        onColorsChange={onColorsChange}
        
        professions={filterOptions.professionOptions}
        selectedProfessions={selectedProfessions}
        onProfessionsChange={onProfessionsChange}
        
        onlyVisited={onlyVisited}
        onVisitedChange={onVisitedChange}
        
        onlyFavorites={onlyFavorites}
        onFavoritesChange={onFavoritesChange}
        
        onApply={() => {
          if (mobile) triggerHapticFeedback('success');
          setShowStandardFilters(false);
        }}
        onReset={() => {
          if (mobile) triggerHapticFeedback('medium');
          onResetStandardFilters();
          setShowStandardFilters(false);
        }}
        
        distanceFilter={distanceFilter}
        allPlaques={plaques}
        isPlaqueVisited={isPlaqueVisited}
        isFavorite={isFavorite}
      />
    </>
  );
};