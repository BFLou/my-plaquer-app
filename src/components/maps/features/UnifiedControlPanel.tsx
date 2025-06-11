// src/components/maps/features/UnifiedControlPanel.tsx - COMPLETE MOBILE OPTIMIZED VERSION
import React, { useState } from 'react';
import { 
  MapPin, 
  Filter, 
  Route, 
  RotateCcw,
  X,
  Target,
  Settings,
  Menu,
  Navigation,
  Layers
} from 'lucide-react';
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [isCollapsed, setIsCollapsed] = useState(mobile); // Start collapsed on mobile
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [showStandardFilters, setShowStandardFilters] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Calculate active standard filters count
  const activeStandardFiltersCount = 
    selectedColors.length + 
    selectedPostcodes.length + 
    selectedProfessions.length + 
    (onlyVisited ? 1 : 0) + 
    (onlyFavorites ? 1 : 0);

  const totalActiveFilters = activeStandardFiltersCount + (distanceFilter.enabled ? 1 : 0);

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

  // Handle my location
  const handleMyLocation = async () => {
    if (!navigator.geolocation) {
      triggerHapticFeedback('error');
      return;
    }

    setIsLocating(true);
    triggerHapticFeedback('selection');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        onSetLocation(coords);
        setIsLocating(false);
        triggerHapticFeedback('success');
        if (mobile) setQuickActionsOpen(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
        triggerHapticFeedback('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleResetAll = () => {
    if (mobile) {
      triggerHapticFeedback('medium');
    }
    onClearDistanceFilter();
    onResetStandardFilters();
    onResetView();
    if (mobile) {
      setIsCollapsed(true);
      setQuickActionsOpen(false);
    }
  };

  const handleButtonClick = (action: string, callback: () => void) => {
    if (mobile) {
      triggerHapticFeedback('selection');
    }
    console.log(`Control panel: ${action}`);
    callback();
  };

  // Mobile floating toggle button
  if (mobile && isCollapsed) {
    return (
      <div 
        className="fixed top-20 right-4 z-[999]"
        style={{ marginTop: safeArea.top }}
      >
        <MobileButton
          variant="default"
          size="sm"
          className="h-14 w-14 rounded-full shadow-lg bg-white/95 backdrop-blur-sm border-2 border-gray-200"
          onClick={() => {
            triggerHapticFeedback('light');
            setIsCollapsed(false);
          }}
        >
          <div className="relative flex items-center justify-center">
            <Settings size={22} className="text-gray-700" />
            {totalActiveFilters > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center min-w-[20px]"
              >
                {totalActiveFilters}
              </Badge>
            )}
          </div>
        </MobileButton>
      </div>
    );
  }

  return (
    <>
      {/* Main Control Panel */}
      <Card 
        className={`
          ${mobile 
            ? 'fixed bottom-4 left-4 right-4 z-[999] max-w-none shadow-2xl' 
            : 'w-40 sm:w-48 shadow-lg'
          } 
          backdrop-blur-sm bg-white/95 border border-gray-200/50 ${className}
        `}
        style={{
          marginLeft: mobile ? 0 : safeArea.left,
          marginTop: mobile ? 0 : safeArea.top,
          marginBottom: mobile ? safeArea.bottom + 16 : 0
        }}
      >
        <CardContent className={`${mobile ? 'p-4' : 'p-2'} space-y-3`}>
          
          {/* Mobile: Header with close */}
          {mobile && (
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Layers size={18} className="text-blue-500" />
                Map Controls
              </h3>
              <MobileButton
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setIsCollapsed(true);
                }}
              >
                <X size={16} />
              </MobileButton>
            </div>
          )}

          {/* Control Buttons */}
          <div className={`${mobile ? 'grid grid-cols-2 gap-3' : 'space-y-1'}`}>
            
            {/* Distance Filter */}
            <MobileButton
              variant={distanceFilter.enabled ? "default" : "outline"}
              size={mobile ? "default" : "sm"}
              className={`${mobile ? 'h-14' : 'h-8'} w-full justify-between text-xs font-medium ${
                distanceFilter.enabled ? 'bg-blue-500 text-white' : ''
              }`}
              onClick={() => handleButtonClick('Distance Filter', () => setShowDistanceFilter(true))}
            >
              <div className="flex items-center gap-2">
                <MapPin size={mobile ? 18 : 14} />
                <div className="text-left">
                  <div className="font-medium">{mobile ? 'Location' : 'Distance'}</div>
                  {mobile && distanceFilter.enabled && (
                    <div className="text-xs opacity-80 truncate">
                      {distanceFilter.locationName}
                    </div>
                  )}
                </div>
              </div>
              {distanceFilter.enabled && (
                <Badge 
                  variant={distanceFilter.enabled ? "secondary" : "outline"} 
                  className="text-[10px] px-1.5 py-0.5 h-5 bg-white/20"
                >
                  {distanceFilter.radius < 1 
                    ? `${Math.round(distanceFilter.radius * 1000)}m` 
                    : `${distanceFilter.radius}km`}
                </Badge>
              )}
            </MobileButton>

            {/* Standard Filters */}
            <MobileButton
              variant={activeStandardFiltersCount > 0 ? "default" : "outline"}
              size={mobile ? "default" : "sm"}
              className={`${mobile ? 'h-14' : 'h-8'} w-full justify-between text-xs font-medium ${
                activeStandardFiltersCount > 0 ? 'bg-purple-500 text-white' : ''
              }`}
              onClick={() => handleButtonClick('Standard Filters', () => setShowStandardFilters(true))}
            >
              <div className="flex items-center gap-2">
                <Filter size={mobile ? 18 : 14} />
                <div className="text-left">
                  <div className="font-medium">Filters</div>
                  {mobile && activeStandardFiltersCount > 0 && (
                    <div className="text-xs opacity-80">
                      {activeStandardFiltersCount} active
                    </div>
                  )}
                </div>
              </div>
              {activeStandardFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0.5 h-5 bg-white/20"
                >
                  {activeStandardFiltersCount}
                </Badge>
              )}
            </MobileButton>

            {/* Route Planning */}
            <MobileButton
              variant={routeMode ? "default" : "outline"}
              size={mobile ? "default" : "sm"}
              className={`${mobile ? 'h-14' : 'h-8'} w-full justify-between text-xs font-medium ${
                routeMode ? 'bg-green-500 text-white' : ''
              }`}
              onClick={() => handleButtonClick('Route Toggle', onToggleRoute)}
            >
              <div className="flex items-center gap-2">
                <Route size={mobile ? 18 : 14} />
                <div className="text-left">
                  <div className="font-medium">{routeMode ? "Planning" : "Route"}</div>
                  {mobile && routePointsCount > 0 && (
                    <div className="text-xs opacity-80">
                      {routePointsCount} stops
                    </div>
                  )}
                </div>
              </div>
              {routePointsCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0.5 h-5 bg-white/20"
                >
                  {routePointsCount}
                </Badge>
              )}
            </MobileButton>

            {/* Reset */}
            <MobileButton
              variant="outline"
              size={mobile ? "default" : "sm"}
              className={`${mobile ? 'h-14' : 'h-8'} w-full justify-start text-xs font-medium text-gray-600 hover:text-gray-800 border-red-200 hover:border-red-300 hover:bg-red-50`}
              onClick={() => handleButtonClick('Reset All', handleResetAll)}
            >
              <div className="flex items-center gap-2">
                <RotateCcw size={mobile ? 18 : 14} />
                <div className="text-left">
                  <div className="font-medium">Reset</div>
                  {mobile && (
                    <div className="text-xs opacity-70">Clear all</div>
                  )}
                </div>
              </div>
            </MobileButton>
          </div>

          {/* Mobile: Quick Actions Row */}
          {mobile && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <MobileButton
                variant="outline"
                size="default"
                className="h-12 text-sm font-medium border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                onClick={handleMyLocation}
                disabled={isLocating}
              >
                <div className="flex items-center gap-2">
                  {isLocating ? (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                  ) : (
                    <Target size={16} className="text-blue-600" />
                  )}
                  <span className="text-blue-700">
                    {isLocating ? 'Finding...' : 'My Location'}
                  </span>
                </div>
              </MobileButton>
              
              <MobileButton
                variant="outline"
                size="default"
                className="h-12 text-sm font-medium"
                onClick={() => setQuickActionsOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <Menu size={16} />
                  <span>Quick Actions</span>
                </div>
              </MobileButton>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Distance Filter Modal */}
      {showDistanceFilter && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowDistanceFilter(false)} 
          />
          <div 
            className={`relative z-[9999] ${mobile ? 'w-[95vw] max-w-lg' : 'w-full max-w-md'} max-h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col`}
            style={{
              marginBottom: mobile ? safeArea.bottom : undefined
            }}
          >
            
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={20} />
                  <h2 className="text-lg font-semibold">Distance Filter</h2>
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
                <div className="text-sm text-blue-100 mt-1">
                  Active: {distanceFilter.locationName}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-grow overflow-auto p-4">
              {!distanceFilter.enabled ? (
                // Setup new distance filter
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Set a location to find plaques within a specific distance.
                  </div>
                  
                  {/* My Location Button */}
                  <MobileButton
                    variant="outline"
                    className="w-full p-4 justify-start hover:bg-blue-50 border-blue-200"
                    onClick={async () => {
                      await handleMyLocation();
                      setShowDistanceFilter(false);
                    }}
                    disabled={isLocating}
                  >
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      {isLocating ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent" />
                      ) : (
                        <Target size={16} className="text-blue-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        {isLocating ? 'Finding your location...' : 'Use my location'}
                      </div>
                      <div className="text-xs text-gray-500">Find nearby plaques</div>
                    </div>
                  </MobileButton>
                  
                  {/* Manual Address Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Or enter location:
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="London postcode or area..."
                        className="flex-1"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            triggerHapticFeedback('selection');
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
                                triggerHapticFeedback('success');
                              }
                            } catch (error) {
                              console.error('Error searching location:', error);
                              triggerHapticFeedback('error');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Manage existing distance filter
                <div className="space-y-4">
                  {/* Current Location Display */}
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {distanceFilter.radius < 1 
                        ? `${Math.round(distanceFilter.radius * 1000)}m` 
                        : `${distanceFilter.radius}km`}
                    </div>
                    <div className="text-sm text-green-700 truncate">
                      from {distanceFilter.locationName}
                    </div>
                  </div>

                  {/* Quick Distance Presets */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      Quick distances:
                    </div>
                    <div className={`grid ${mobile ? 'grid-cols-3' : 'grid-cols-3'} gap-2`}>
                      {[0.5, 1, 1.5, 2, 3, 5].map((distance) => (
                        <MobileButton
                          key={distance}
                          variant={Math.abs(distanceFilter.radius - distance) < 0.01 ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            triggerHapticFeedback('selection');
                            onRadiusChange(distance);
                          }}
                          className="h-10 text-sm font-medium"
                        >
                          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
                        </MobileButton>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-gray-700">
                        Custom distance:
                      </div>
                      <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
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
                        triggerHapticFeedback('light');
                        onRadiusChange(parseFloat(e.target.value));
                      }}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
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

            {/* Footer Actions */}
            <div className="p-4 border-t bg-gray-50">
              <div className={`flex gap-3 ${mobile ? 'flex-col' : ''}`}>
                {distanceFilter.enabled ? (
                  <>
                    <MobileButton
                      variant="outline"
                      onClick={() => {
                        triggerHapticFeedback('medium');
                        onClearDistanceFilter();
                        setShowDistanceFilter(false);
                      }}
                      className={`${mobile ? 'w-full' : 'flex-1'} border-red-300 text-red-600 hover:bg-red-50`}
                    >
                      Clear Filter
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
        
        onApply={() => {
          triggerHapticFeedback('success');
          setShowStandardFilters(false);
        }}
        onReset={() => {
          triggerHapticFeedback('medium');
          onResetStandardFilters();
          setShowStandardFilters(false);
        }}
        
        distanceFilter={distanceFilter}
        allPlaques={plaques}
        isPlaqueVisited={isPlaqueVisited}
        isFavorite={isFavorite}
      />

      {/* Quick Actions Modal */}
      {mobile && quickActionsOpen && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-center">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setQuickActionsOpen(false)} 
          />
          <div 
            className="relative z-[9999] w-full max-w-lg bg-white rounded-t-2xl shadow-xl"
            style={{ marginBottom: safeArea.bottom }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
                <MobileButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickActionsOpen(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X size={16} />
                </MobileButton>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3">
              <MobileButton
                onClick={() => {
                  setQuickActionsOpen(false);
                  handleMyLocation();
                }}
                className="w-full justify-start h-14 bg-blue-500 hover:bg-blue-600"
                disabled={isLocating}
              >
                <Navigation size={20} className="mr-3" />
                <div className="text-left">
                  <div className="font-medium">Find Plaques Near Me</div>
                  <div className="text-sm opacity-80">Use GPS location</div>
                </div>
              </MobileButton>
              
              <MobileButton
                onClick={() => {
                  setQuickActionsOpen(false);
                  setShowStandardFilters(true);
                }}
                className="w-full justify-start h-14"
                variant="outline"
              >
                <Filter size={20} className="mr-3" />
                <div className="text-left">
                  <div className="font-medium">Open Advanced Filters</div>
                  <div className="text-sm text-gray-500">Color, profession, etc.</div>
                </div>
              </MobileButton>
              
              <MobileButton
                onClick={() => {
                  setQuickActionsOpen(false);
                  handleResetAll();
                }}
                className="w-full justify-start h-14 border-red-200 text-red-600 hover:bg-red-50"
                variant="outline"
              >
                <RotateCcw size={20} className="mr-3" />
                <div className="text-left">
                  <div className="font-medium">Clear All Filters</div>
                  <div className="text-sm text-gray-500">Reset map to default</div>
                </div>
              </MobileButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};