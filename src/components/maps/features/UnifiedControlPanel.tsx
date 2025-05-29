// src/components/maps/features/UnifiedControlPanel.tsx - REFINED: Compact and mobile-friendly
import React, { useState } from 'react';
import { 
  MapPin, 
  Filter, 
  Route, 
  RotateCcw,
  ChevronDown,
  X,
  Target,
  Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plaque } from '@/types/plaque';
import { LocationFilter } from './LocationFilter/LocationFilter';
import DiscoverFilterDialog from '../../plaques/DiscoverFilterDialog';
import { capitalizeWords } from '@/utils/stringUtils';

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
  visiblePlaques,
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
    onClearDistanceFilter();
    onResetStandardFilters();
    onResetView();
  };

  return (
    <>
      <Card className={`w-40 sm:w-48 shadow-lg backdrop-blur-sm bg-white/95 border border-gray-200/50 ${className}`}>
        <CardContent className="p-2 space-y-1">
          
          {/* Distance Filter Button */}
          <Button
            variant={distanceFilter.enabled ? "default" : "outline"}
            size="sm"
            className="w-full justify-between h-8 text-left text-xs font-medium"
            onClick={() => setShowDistanceFilter(true)}
          >
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              <span className="truncate">Distance</span>
            </div>
            {distanceFilter.enabled && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-[16px]">
                {distanceFilter.radius < 1 
                  ? `${Math.round(distanceFilter.radius * 1000)}m` 
                  : `${distanceFilter.radius}km`}
              </Badge>
            )}
          </Button>

          {/* Standard Filters Button */}
          <Button
            variant={activeStandardFiltersCount > 0 ? "default" : "outline"}
            size="sm"
            className="w-full justify-between h-8 text-left text-xs font-medium"
            onClick={() => setShowStandardFilters(true)}
          >
            <div className="flex items-center gap-1.5">
              <Filter size={14} />
              <span className="truncate">Filters</span>
            </div>
            {activeStandardFiltersCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-[16px]">
                {activeStandardFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Route Planning Button */}
          <Button
            variant={routeMode ? "default" : "outline"}
            size="sm"
            className="w-full justify-between h-8 text-left text-xs font-medium"
            onClick={onToggleRoute}
          >
            <div className="flex items-center gap-1.5">
              <Route size={14} />
              <span className="truncate">{routeMode ? "Planning" : "Route"}</span>
            </div>
            {routePointsCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-[16px]">
                {routePointsCount}
              </Badge>
            )}
          </Button>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start h-8 text-left text-xs font-medium text-gray-600 hover:text-gray-800"
            onClick={handleResetAll}
          >
            <div className="flex items-center gap-1.5">
              <RotateCcw size={14} />
              <span>Reset</span>
            </div>
          </Button>

        </CardContent>
      </Card>

      {/* Distance Filter Modal - Compact design */}
      {showDistanceFilter && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDistanceFilter(false)} />
          <div className="relative z-[9999] w-full max-w-sm sm:max-w-md max-h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
            
            {/* Compact Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={18} />
                  <h2 className="text-lg font-semibold">Distance Filter</h2>
                </div>
                <button
                  onClick={() => setShowDistanceFilter(false)}
                  className="h-8 w-8 p-1 rounded-full hover:bg-white/20 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              
              {distanceFilter.enabled && distanceFilter.locationName && (
                <div className="text-sm text-blue-100 mt-1">
                  Active: {distanceFilter.locationName}
                </div>
              )}
            </div>

            {/* Compact Content */}
            <div className="flex-grow overflow-auto p-4">
              {!distanceFilter.enabled ? (
                // Setup new distance filter - Compact
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Set a location to find plaques within a specific distance.
                  </div>
                  
                  {/* My Location Button */}
                  <button
                    onClick={async () => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const coords: [number, number] = [
                              position.coords.latitude,
                              position.coords.longitude
                            ];
                            onSetLocation(coords);
                            setShowDistanceFilter(false);
                          },
                          (error) => console.error('Error getting location:', error)
                        );
                      }
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Target size={16} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">Use my location</div>
                      <div className="text-xs text-gray-500">Find nearby plaques</div>
                    </div>
                  </button>
                  
                  {/* Manual Address Input - Compact */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Or enter location:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="London postcode or area..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
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
                              }
                            } catch (error) {
                              console.error('Error searching location:', error);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Manage existing distance filter - Compact
                <div className="space-y-4">
                  {/* Current Location Display - Compact */}
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-lg font-bold text-green-600">
                      {distanceFilter.radius < 1 
                        ? `${Math.round(distanceFilter.radius * 1000)}m` 
                        : `${distanceFilter.radius}km`}
                    </div>
                    <div className="text-sm text-green-700 truncate">
                      from {distanceFilter.locationName}
                    </div>
                  </div>

                  {/* Quick Distance Presets - Compact Grid */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Quick distances:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 1, 1.5, 2, 3, 5].map((distance) => (
                        <button
                          key={distance}
                          onClick={() => onRadiusChange(distance)}
                          className={`
                            h-8 px-2 text-xs font-medium rounded-md transition-all
                            ${Math.abs(distanceFilter.radius - distance) < 0.01
                              ? 'bg-blue-500 text-white border-blue-600'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            }
                          `}
                        >
                          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Slider - Compact */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-gray-700">Custom:</div>
                      <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
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
                      onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
              <div className="flex gap-2">
                {distanceFilter.enabled ? (
                  <>
                    <button
                      onClick={() => {
                        onClearDistanceFilter();
                        setShowDistanceFilter(false);
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors font-medium text-sm"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowDistanceFilter(false)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowDistanceFilter(false)}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Filters Dialog */}
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
        
        onApply={() => setShowStandardFilters(false)}
        onReset={() => {
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