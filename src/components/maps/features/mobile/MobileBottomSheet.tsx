// src/components/maps/features/mobile/MobileBottomSheet.tsx
import React, { useState } from 'react';
import { 
  Filter, 
  Route, 
  RotateCcw,
  X,
  Target,
  Settings,
  Layers
} from 'lucide-react';
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import DiscoverFilterDialog from '../../../plaques/DiscoverFilterDialog';
import { capitalizeWords } from '@/utils/stringUtils';
import { triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';
import { toast } from 'sonner';

interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

interface MobileBottomSheetProps {
  // Distance filter props
  distanceFilter: DistanceFilter;
  onSetLocation: (coords: [number, number]) => void;
  onClearDistanceFilter: () => void;
  
  // Standard filter props
  plaques: Plaque[];
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
  
  // Sheet state
  isOpen: boolean;
  onToggle: () => void;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = (props) => {
  const {
    distanceFilter,
    onSetLocation,
    onClearDistanceFilter,
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
    onToggle,
    plaques
  } = props;

  const safeArea = useSafeArea();
  const [showStandardFilters, setShowStandardFilters] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const activeStandardFilters = selectedColors.length + selectedPostcodes.length + 
    selectedProfessions.length + (onlyVisited ? 1 : 0) + (onlyFavorites ? 1 : 0);
  const totalActiveFilters = activeStandardFilters + (distanceFilter.enabled ? 1 : 0);

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

  const handleMyLocation = async () => {
    if (!navigator.geolocation) {
      triggerHapticFeedback('error');
      toast.error('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    triggerHapticFeedback('selection');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        onSetLocation(coords);
        setIsLocating(false);
        triggerHapticFeedback('success');
        toast.success('Location found');
      },
      () => {
        setIsLocating(false);
        triggerHapticFeedback('error');
        toast.error('Could not get location');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <>
      {/* Floating Tab - More compact */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[999]" style={{ marginBottom: safeArea.bottom }}>
        <MobileButton
          variant="default"
          size="sm"
          className="h-10 px-4 rounded-full shadow-lg bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-700"
          onClick={onToggle}
          touchOptimized
        >
          <div className="flex items-center gap-2">
            <Settings size={16} />
            <span className="text-sm font-medium">Controls</span>
            {totalActiveFilters > 0 && (
              <Badge variant="destructive" className="h-4 text-xs px-1">
                {totalActiveFilters}
              </Badge>
            )}
          </div>
        </MobileButton>
      </div>

      {/* Bottom Sheet - More compact */}
      <div className={`fixed inset-x-0 bottom-0 z-[1000] transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ paddingBottom: safeArea.bottom }}>
        <div className="bg-white rounded-t-xl shadow-2xl border-t border-gray-200 max-h-[65vh] flex flex-col">
          
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Layers size={18} className="text-blue-500" />
                Map Controls
                {totalActiveFilters > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {totalActiveFilters}
                  </Badge>
                )}
              </h3>
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-7 w-7 p-0 rounded-full"
                touchOptimized
              >
                <X size={14} />
              </MobileButton>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            
            {/* Primary Actions - 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <MobileButton
                variant={distanceFilter.enabled ? "default" : "outline"}
                className="h-14 flex-col gap-1 text-center"
                onClick={() => handleMyLocation()}
                disabled={isLocating}
                touchOptimized
              >
                {isLocating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                ) : (
                  <Target size={18} />
                )}
                <div className="text-xs">
                  {isLocating ? 'Finding...' : 'Near Me'}
                </div>
              </MobileButton>

              <MobileButton
                variant={activeStandardFilters > 0 ? "default" : "outline"}
                className="h-14 flex-col gap-1 text-center"
                onClick={() => setShowStandardFilters(true)}
                touchOptimized
              >
                <Filter size={18} />
                <div className="text-xs">
                  Filters
                  {activeStandardFilters > 0 && ` (${activeStandardFilters})`}
                </div>
              </MobileButton>

              <MobileButton
                variant={routeMode ? "default" : "outline"}
                className="h-14 flex-col gap-1 text-center"
                onClick={onToggleRoute}
                touchOptimized
              >
                <Route size={18} />
                <div className="text-xs">
                  Route
                  {routePointsCount > 0 && ` (${routePointsCount})`}
                </div>
              </MobileButton>

              <MobileButton
                variant="outline"
                className="h-14 flex-col gap-1 text-center text-red-600 hover:bg-red-50"
                onClick={() => {
                  onClearDistanceFilter();
                  onResetStandardFilters();
                  onResetView();
                }}
                touchOptimized
              >
                <RotateCcw size={18} />
                <div className="text-xs">Reset All</div>
              </MobileButton>
            </div>

            {/* Active Filters Summary */}
            {totalActiveFilters > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <div className="text-sm font-medium text-blue-800 mb-1">Active Filters</div>
                <div className="space-y-1 text-xs text-blue-700">
                  {distanceFilter.enabled && (
                    <div>📍 {distanceFilter.locationName}</div>
                  )}
                  {activeStandardFilters > 0 && (
                    <div>🔍 {activeStandardFilters} attribute filter{activeStandardFilters > 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
            )}
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