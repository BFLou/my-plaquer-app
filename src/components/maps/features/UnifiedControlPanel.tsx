// src/components/maps/features/UnifiedControlPanel.tsx - NEW: Single control panel for all map actions
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
      <Card className={`w-48 shadow-lg backdrop-blur-sm bg-white/95 ${className}`}>
        <CardContent className="p-2 space-y-1">
          
          {/* Distance Filter Button */}
          <Button
            variant={distanceFilter.enabled ? "default" : "outline"}
            size="sm"
            className="w-full justify-between h-10 text-left"
            onClick={() => setShowDistanceFilter(true)}
          >
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="flex-1 text-left">
                {distanceFilter.enabled ? "Distance" : "Distance"}
              </span>
            </div>
            {distanceFilter.enabled && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
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
            className="w-full justify-between h-10 text-left"
            onClick={() => setShowStandardFilters(true)}
          >
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <span className="flex-1 text-left">Filters</span>
            </div>
            {activeStandardFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {activeStandardFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Route Planning Button */}
          <Button
            variant={routeMode ? "default" : "outline"}
            size="sm"
            className="w-full justify-between h-10 text-left"
            onClick={onToggleRoute}
          >
            <div className="flex items-center gap-2">
              <Route size={16} />
              <span className="flex-1 text-left">
                {routeMode ? "Planning" : "Route"}
              </span>
            </div>
            {routePointsCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {routePointsCount}
              </Badge>
            )}
          </Button>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start h-10 text-left text-gray-600 hover:text-gray-800"
            onClick={handleResetAll}
          >
            <div className="flex items-center gap-2">
              <RotateCcw size={16} />
              <span>Reset</span>
            </div>
          </Button>

        </CardContent>
      </Card>

      {/* Distance Filter Modal - REDESIGNED: Match DiscoverFilterDialog styling */}
      {showDistanceFilter && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDistanceFilter(false)} />
          <div className="relative z-[9999] w-full max-w-md h-[85vh] max-h-[650px] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
            
            {/* Header - Match DiscoverFilterDialog style */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-white">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target size={20} />
                  Distance Filter
                </h2>
                <button
                  onClick={() => setShowDistanceFilter(false)}
                  className="h-8 w-8 p-1 rounded-full hover:bg-white/20 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="text-sm text-blue-100">
                {distanceFilter.enabled && distanceFilter.locationName
                  ? `Active filter: ${distanceFilter.locationName}`
                  : "Set a location to filter plaques by distance"
                }
              </div>
            </div>

            {/* Status Alert - When distance filter is active */}
            {distanceFilter.enabled && distanceFilter.locationName && (
              <div className="px-4 py-3 bg-blue-50 border-b">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <MapPin className="h-4 w-4" />
                  <div>
                    <strong>Location Filter Active:</strong> Showing results within{' '}
                    {distanceFilter.radius < 1 
                      ? `${Math.round(distanceFilter.radius * 1000)}m` 
                      : `${distanceFilter.radius}km`}{' '}
                    of {distanceFilter.locationName}.
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-grow overflow-auto p-4">
              {!distanceFilter.enabled ? (
                // Setup new distance filter
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Set a center location to find plaques within a specific distance radius.
                  </div>
                  
                  {/* Use My Location Button */}
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
                          (error) => {
                            console.error('Error getting location:', error);
                          }
                        );
                      }
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Target size={16} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">Use my current location</div>
                      <div className="text-xs text-gray-500">Find plaques near me</div>
                    </div>
                  </button>
                  
                  {/* Manual Address Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Or enter a location manually:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter London postcode, area, or address..."
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
                    <div className="text-xs text-gray-500">
                      Examples: "NW1 2DB", "Camden", "Westminster Bridge"
                    </div>
                  </div>
                  
                  <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    💡 <strong>Tip:</strong> Use the search bar above the map to find specific locations, then fine-tune the distance here.
                  </div>
                </div>
              ) : (
                // Manage existing distance filter
                <div className="space-y-6">
                  {/* Current Location Display */}
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {distanceFilter.radius < 1 
                        ? `${Math.round(distanceFilter.radius * 1000)}m` 
                        : `${distanceFilter.radius}km`}
                    </div>
                    <div className="text-sm text-green-700">
                      Search radius from {distanceFilter.locationName}
                    </div>
                  </div>

                  {/* Quick Distance Presets */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">Quick distances:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 1, 1.5, 2, 3, 5].map((distance) => (
                        <button
                          key={distance}
                          onClick={() => onRadiusChange(distance)}
                          className={`
                            h-10 px-2 text-xs font-medium rounded-md transition-all
                            ${Math.abs(distanceFilter.radius - distance) < 0.01
                              ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            }
                          `}
                        >
                          <div className="font-medium">
                            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
                          </div>
                          <div className="text-[10px] opacity-75">
                            {distance < 1 ? 'Close' : distance <= 2 ? 'Walk' : 'Wide'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-gray-700">Custom distance:</div>
                      <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {distanceFilter.radius < 1 
                          ? `${Math.round(distanceFilter.radius * 1000)}m` 
                          : `${distanceFilter.radius}km`}
                      </div>
                    </div>
                    
                    <div className="px-1">
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={distanceFilter.radius}
                        onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
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
                        <span>Estimated walking time:</span>
                        <span className="font-medium">~{Math.round(distanceFilter.radius * 12)} minutes</span>
                      </div>
                      {distanceFilter.center && (
                        <div className="flex items-center justify-between mt-1">
                          <span>Center coordinates:</span>
                          <span className="font-mono text-[10px]">
                            {distanceFilter.center[0].toFixed(4)}, {distanceFilter.center[1].toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions - Match DiscoverFilterDialog */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-3">
                {distanceFilter.enabled ? (
                  <>
                    <button
                      onClick={() => {
                        onClearDistanceFilter();
                        setShowDistanceFilter(false);
                      }}
                      className="flex-1 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors font-medium text-sm"
                    >
                      Clear Filter
                    </button>
                    <button
                      onClick={() => setShowDistanceFilter(false)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowDistanceFilter(false)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Filters Dialog - UPDATED: Higher z-index for map view */}
      <DiscoverFilterDialog
        isOpen={showStandardFilters}
        onClose={() => setShowStandardFilters(false)}
        
        // Filter options
        postcodes={filterOptions.postcodeOptions}
        selectedPostcodes={selectedPostcodes}
        onPostcodesChange={onPostcodesChange}
        
        colors={filterOptions.colorOptions}
        selectedColors={selectedColors}
        onColorsChange={onColorsChange}
        
        professions={filterOptions.professionOptions}
        selectedProfessions={selectedProfessions}
        onProfessionsChange={onProfessionsChange}
        
        // Toggle options
        onlyVisited={onlyVisited}
        onVisitedChange={onVisitedChange}
        
        onlyFavorites={onlyFavorites}
        onFavoritesChange={onFavoritesChange}
        
        // Actions
        onApply={() => setShowStandardFilters(false)}
        onReset={() => {
          onResetStandardFilters();
          setShowStandardFilters(false);
        }}
        
        // Distance filter integration
        distanceFilter={distanceFilter}
        allPlaques={plaques}
        isPlaqueVisited={isPlaqueVisited}
        isFavorite={isFavorite}
      />
    </>
  );
};