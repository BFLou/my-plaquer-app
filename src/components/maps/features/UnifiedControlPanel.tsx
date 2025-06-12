// src/components/maps/features/UnifiedControlPanel.tsx - REDESIGNED: Desktop Sidebar + Mobile Bottom Sheet
import React, { useState } from 'react';
import { 
  MapPin, 
  Filter, 
  Route, 
  RotateCcw,
  X,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { MobileButton } from "@/components/ui/mobile-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Plaque } from '@/types/plaque';
import DiscoverFilterDialog from '../../plaques/DiscoverFilterDialog';
import { capitalizeWords } from '@/utils/stringUtils';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';
import { toast } from 'sonner';

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

// Desktop Sidebar Component
const DesktopSidebar: React.FC<UnifiedControlPanelProps & {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({
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
  isCollapsed,
  onToggleCollapse
}) => {
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [showStandardFilters, setShowStandardFilters] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');

  const activeStandardFilters = selectedColors.length + selectedPostcodes.length + 
    selectedProfessions.length + (onlyVisited ? 1 : 0) + (onlyFavorites ? 1 : 0);
  const totalActiveFilters = activeStandardFilters + (distanceFilter.enabled ? 1 : 0);

  // Filter options generation
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

  // My Location handler
  const handleMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        onSetLocation(coords);
        setIsLocating(false);
        toast.success('Location found successfully');
      },
      (error) => {
        setIsLocating(false);
        let message = 'Could not get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        
        toast.error(message);
      },
      { 
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000
      }
    );
  };

  // Address search handler
  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    try {
      const searchQuery = searchAddress.includes('London') ? searchAddress : `${searchAddress}, London, UK`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1&` +
        `countrycodes=gb&viewbox=-0.489,51.28,0.236,51.686&bounded=1`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const place = data[0];
        const coords: [number, number] = [
          parseFloat(place.lat),
          parseFloat(place.lon)
        ];
        
        onSetLocation(coords);
        setSearchAddress('');
        toast.success(`Location found: ${place.display_name.split(',')[0]}`);
      } else {
        toast.error('Location not found. Try a more specific address.');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      toast.error('Error searching for location. Please try again.');
    }
  };

  const handleResetAll = () => {
    onClearDistanceFilter();
    onResetStandardFilters();
    onResetView();
  };

  // Collapsed state - floating buttons
  if (isCollapsed) {
    return (
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[999] flex flex-col gap-2">
        {/* Main toggle button */}
        <Button
          variant="default"
          size="sm"
          className="h-12 w-12 rounded-full shadow-lg bg-white/95 backdrop-blur-sm border-2 border-gray-200 hover:bg-white text-gray-700"
          onClick={onToggleCollapse}
        >
          <div className="relative flex items-center justify-center">
            <ChevronRight size={20} />
            {totalActiveFilters > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center min-w-[20px]"
              >
                {totalActiveFilters}
              </Badge>
            )}
          </div>
        </Button>
        
        {/* Quick action buttons */}
        <Button
          variant={routeMode ? "default" : "outline"}
          size="sm"
          className="h-10 w-10 rounded-full shadow-md bg-white/95 backdrop-blur-sm"
          onClick={onToggleRoute}
          title="Toggle Route Mode"
        >
          <Route size={16} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 rounded-full shadow-md bg-white/95 backdrop-blur-sm"
          onClick={handleMyLocation}
          disabled={isLocating}
          title="Find My Location"
        >
          {isLocating ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
          ) : (
            <Target size={16} />
          )}
        </Button>
      </div>
    );
  }

  // Expanded state - full sidebar
  return (
    <>
      <div className="fixed left-4 top-20 bottom-20 z-[999] w-80 max-w-[calc(100vw-2rem)]">
        <Card className="h-full shadow-xl border-2 bg-white/95 backdrop-blur-sm flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">Map Controls</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-8 w-8 p-0 hover:bg-white/50"
              >
                <ChevronLeft size={16} />
              </Button>
            </div>
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto">
            
            {/* Distance Filter */}
            <Button
              variant={distanceFilter.enabled ? "default" : "outline"}
              className="w-full h-12 justify-between text-sm"
              onClick={() => setShowDistanceFilter(true)}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Distance Filter</span>
              </div>
              {distanceFilter.enabled && (
                <Badge variant="secondary" className="text-xs">
                  {distanceFilter.radius < 1 
                    ? `${Math.round(distanceFilter.radius * 1000)}m` 
                    : `${distanceFilter.radius}km`}
                </Badge>
              )}
            </Button>

            {/* Active distance filter display */}
            {distanceFilter.enabled && distanceFilter.locationName && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                <div className="font-medium text-green-800">
                  📍 {distanceFilter.locationName}
                </div>
                <div className="text-green-600">
                  Within {distanceFilter.radius < 1 
                    ? `${Math.round(distanceFilter.radius * 1000)}m` 
                    : `${distanceFilter.radius}km`}
                </div>
              </div>
            )}

            {/* Standard Filters */}
            <Button
              variant={activeStandardFilters > 0 ? "default" : "outline"}
              className="w-full h-12 justify-between text-sm"
              onClick={() => setShowStandardFilters(true)}
            >
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <span>Advanced Filters</span>
              </div>
              {activeStandardFilters > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeStandardFilters}
                </Badge>
              )}
            </Button>

            {/* Route Planning */}
            <Button
              variant={routeMode ? "default" : "outline"}
              className="w-full h-12 justify-between text-sm"
              onClick={onToggleRoute}
            >
              <div className="flex items-center gap-2">
                <Route size={16} />
                <span>{routeMode ? "Route Planning" : "Plan Route"}</span>
              </div>
              {routePointsCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {routePointsCount} stops
                </Badge>
              )}
            </Button>

            {/* Quick Actions Section */}
            <div className="border-t pt-3 mt-4">
              <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Quick Actions
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs"
                  onClick={handleMyLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent mr-1" />
                  ) : (
                    <Target size={14} className="mr-1" />
                  )}
                  My Location
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs text-red-600 hover:bg-red-50"
                  onClick={handleResetAll}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Reset All
                </Button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="border-t pt-3 mt-4">
              <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Map Statistics
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>📍 {plaques.length} total plaques</div>
                <div>🗺️ Central London area</div>
                {routeMode && routePointsCount > 0 && (
                  <div>🚶 Route: {routePointsCount} stops</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distance Filter Modal */}
      {showDistanceFilter && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowDistanceFilter(false)} 
          />
          <div className="relative z-[9999] w-full max-w-md max-h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={20} />
                  <h2 className="text-lg font-semibold">Distance Filter</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDistanceFilter(false)}
                  className="h-8 w-8 p-1 rounded-full hover:bg-white/20 text-white"
                >
                  <X size={16} />
                </Button>
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
                  <Button
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
                  </Button>
                  
                  {/* Manual Address Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Or enter location:
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="London postcode or area..."
                        className="flex-1"
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchAddress.trim()) {
                            handleAddressSearch();
                            setShowDistanceFilter(false);
                          }
                        }}
                      />
                      <Button
                        onClick={async () => {
                          await handleAddressSearch();
                          setShowDistanceFilter(false);
                        }}
                        disabled={!searchAddress.trim()}
                        size="sm"
                      >
                        Go
                      </Button>
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
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 1, 1.5, 2, 3, 5].map((distance) => (
                        <Button
                          key={distance}
                          variant={Math.abs(distanceFilter.radius - distance) < 0.01 ? "default" : "outline"}
                          size="sm"
                          onClick={() => onRadiusChange(distance)}
                          className="h-10 text-sm font-medium"
                        >
                          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
                        </Button>
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
                    
                    <Slider
                      value={[distanceFilter.radius]}
                      onValueChange={(values) => onRadiusChange(values[0])}
                      min={0.1}
                      max={10}
                      step={0.1}
                      className="w-full"
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
              <div className="flex gap-3">
                {distanceFilter.enabled ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onClearDistanceFilter();
                        setShowDistanceFilter(false);
                      }}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Clear Filter
                    </Button>
                    <Button
                      onClick={() => setShowDistanceFilter(false)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowDistanceFilter(false)}
                    className="w-full bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
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

// Mobile Bottom Sheet Component
const MobileBottomSheet: React.FC<UnifiedControlPanelProps & {
  isOpen: boolean;
  onToggle: () => void;
}> = ({
  distanceFilter,
  onSetLocation,
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
  isOpen,
  onToggle
}) => {
  const safeArea = useSafeArea();
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [showStandardFilters, setShowStandardFilters] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const activeStandardFilters = selectedColors.length + selectedPostcodes.length + 
    selectedProfessions.length + (onlyVisited ? 1 : 0) + (onlyFavorites ? 1 : 0);
  const totalActiveFilters = activeStandardFilters + (distanceFilter.enabled ? 1 : 0);

  // Filter options generation
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

  // My Location handler
  const handleMyLocation = async () => {
    if (!navigator.geolocation) {
      triggerHapticFeedback('error');
      toast.error('Geolocation is not supported by your browser');
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
        toast.success('Location found successfully');
      },
      (error) => {
        setIsLocating(false);
        triggerHapticFeedback('error');
        let message = 'Could not get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        
        toast.error(message);
      },
      { 
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000
      }
    );
  };

  const handleResetAll = () => {
    triggerHapticFeedback('medium');
    onClearDistanceFilter();
    onResetStandardFilters();
    onResetView();
  };

  const handleButtonClick = (action: string, callback: () => void) => {
    triggerHapticFeedback('selection');
    console.log(`Control panel: ${action}`);
    callback();
  };

  return (
    <>
      {/* Floating Tab */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999]" style={{ marginBottom: safeArea.bottom }}>
        <MobileButton
          variant="default"
          size="sm"
          className="h-12 px-6 rounded-full shadow-lg bg-white/95 backdrop-blur-sm border-2 border-gray-200 text-gray-700"
          onClick={onToggle}
          touchOptimized
        >
          <div className="flex items-center gap-2">
            <Settings size={18} />
            <span className="font-medium">Controls</span>
            {totalActiveFilters > 0 && (
              <Badge variant="destructive" className="h-5 text-xs px-1.5">
                {totalActiveFilters}
              </Badge>
            )}
          </div>
        </MobileButton>
      </div>

      {/* Bottom Sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-[1000] transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ paddingBottom: safeArea.bottom }}>
        <div className="bg-white rounded-t-2xl shadow-2xl border-t-2 border-gray-200 max-h-[70vh] flex flex-col">
          
          {/* Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-4 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Layers size={20} className="text-blue-500" />
                Map Controls
              </h3>
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0 rounded-full"
                touchOptimized
              >
                <X size={16} />
              </MobileButton>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <MobileButton
                variant={distanceFilter.enabled ? "default" : "outline"}
                className="h-16 flex-col gap-1"
                onClick={() => handleButtonClick('Distance Filter', () => setShowDistanceFilter(true))}
                touchOptimized
              >
                <MapPin size={20} />
                <div className="text-center">
                  <div className="text-sm font-medium">Location</div>
                  {distanceFilter.enabled && (
                    <div className="text-xs opacity-80">
                      {distanceFilter.radius < 1 
                        ? `${Math.round(distanceFilter.radius * 1000)}m` 
                        : `${distanceFilter.radius}km`}
                    </div>
                  )}
                </div>
              </MobileButton>

              <MobileButton
                variant={activeStandardFilters > 0 ? "default" : "outline"}
                className="h-16 flex-col gap-1"
                onClick={() => handleButtonClick('Standard Filters', () => setShowStandardFilters(true))}
                touchOptimized
              >
                <Filter size={20} />
                <div className="text-center">
                  <div className="text-sm font-medium">Filters</div>
                  {activeStandardFilters > 0 && (
                    <div className="text-xs opacity-80">{activeStandardFilters} active</div>
                  )}
                </div>
              </MobileButton>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <MobileButton
                variant={routeMode ? "default" : "outline"}
                className="h-14 flex-col gap-1"
                onClick={() => handleButtonClick('Route Toggle', onToggleRoute)}
                touchOptimized
              >
                <Route size={18} />
                <div className="text-xs text-center">
                  {routeMode ? "Planning" : "Route"}
                  {routePointsCount > 0 && (
                    <div className="text-xs opacity-80">{routePointsCount} stops</div>
                  )}
                </div>
              </MobileButton>

              <MobileButton
                variant="outline"
                className="h-14 flex-col gap-1"
                onClick={() => handleButtonClick('My Location', handleMyLocation)}
                disabled={isLocating}
                touchOptimized
              >
                {isLocating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                ) : (
                  <Target size={18} />
                )}
                <div className="text-xs">{isLocating ? 'Finding...' : 'My Location'}</div>
              </MobileButton>

              <MobileButton
                variant="outline"
                className="h-14 flex-col gap-1 text-red-600 hover:bg-red-50"
                onClick={() => handleButtonClick('Reset All', handleResetAll)}
                touchOptimized
              >
                <RotateCcw size={18} />
                <div className="text-xs">Reset</div>
              </MobileButton>
            </div>

            {/* Active Filters Display */}
            {totalActiveFilters > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <div className="text-sm font-medium text-blue-800 mb-2">Active Filters</div>
                <div className="space-y-1 text-sm text-blue-700">
                  {distanceFilter.enabled && (
                    <div>📍 Within {distanceFilter.radius < 1 
                      ? `${Math.round(distanceFilter.radius * 1000)}m` 
                      : `${distanceFilter.radius}km`} of {distanceFilter.locationName}
                    </div>
                  )}
                  {activeStandardFilters > 0 && (
                    <div>🔍 {activeStandardFilters} attribute filter{activeStandardFilters > 1 ? 's' : ''}</div>
                  )}
                  {routeMode && (
                    <div>🚶 Route planning mode active</div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-medium text-gray-500 mb-1">Map View</div>
              <div className="text-sm text-gray-700">
                📍 {plaques.length} plaques • 🗺️ Central London
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[999]"
          onClick={onToggle}
        />
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
    </>
  );
};

// Main Unified Control Panel Component
export const UnifiedControlPanel: React.FC<UnifiedControlPanelProps> = (props) => {
  const mobile = isMobile();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (mobile) {
    return (
      <MobileBottomSheet
        {...props}
        isOpen={isMobileOpen}
        onToggle={() => setIsMobileOpen(!isMobileOpen)}
      />
    );
  }

  return (
    <DesktopSidebar
      {...props}
      isCollapsed={isDesktopCollapsed}
      onToggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
    />
  );
};