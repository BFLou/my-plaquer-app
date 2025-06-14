// src/components/maps/features/mobile/MobileBottomSheet.tsx - UPDATED
import React, { useState } from 'react';
import {
  Filter,
  Route,
  RotateCcw,
  X,
  Target,
  Settings,
  Layers,
  MapPin,
  Minus,
  Plus,
  Loader
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
  onRadiusChange: (radius: number) => void;
  onClearDistanceFilter: () => void;

  // Standard filter props
  plaques: Plaque[];
  selectedColors: string[];
  selectedPostcodes: string[];
  selectedProfessions: string[];
  selectedOrganisations: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
  onColorsChange: (values: string[]) => void;
  onPostcodesChange: (values: string[]) => void;
  onProfessionsChange: (values: string[]) => void;
  onOrganisationsChange: (values: string[]) => void;
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
    onRadiusChange,
    onClearDistanceFilter,
    selectedColors,
    selectedPostcodes,
    selectedProfessions,
    selectedOrganisations,
    onlyVisited,
    onlyFavorites,
    onColorsChange,
    onPostcodesChange,
    onProfessionsChange,
    onOrganisationsChange,
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
    selectedProfessions.length + selectedOrganisations.length + (onlyVisited ? 1 : 0) + (onlyFavorites ? 1 : 0);
  const totalActiveFilters = activeStandardFilters + (distanceFilter.enabled ? 1 : 0);

  const filterOptions = React.useMemo(() => {
    const postcodeCount: Record<string, number> = {};
    const colorCount: Record<string, number> = {};
    const professionCount: Record<string, number> = {};
    const organisationCount: Record<string, number> = {};

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

      if (plaque.organisations && plaque.organisations !== "Unknown") {
        organisationCount[plaque.organisations] = (organisationCount[plaque.organisations] || 0) + 1;
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
        .sort((a, b) => b.count - a.count),

      organisationOptions: Object.entries(organisationCount)
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

      {/* Bottom Sheet - Enhanced with distance filter */}
      <div className={`fixed inset-x-0 bottom-0 z-[1000] transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ paddingBottom: safeArea.bottom }}>
        <div className="bg-white rounded-t-xl shadow-2xl border-t border-gray-200 max-h-[75vh] flex flex-col">

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

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* Distance Filter Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-green-500" />
                Distance Filter
              </h4>

              {!distanceFilter.enabled ? (
                <div className="space-y-3">
                  {/* My Location Button */}
                  <MobileButton
                    variant="outline"
                    className="w-full h-12 justify-start"
                    onClick={handleMyLocation}
                    disabled={isLocating}
                    touchOptimized
                  >
                    {isLocating ? (
                      <Loader className="mr-2 animate-spin" size={16} />
                    ) : (
                      <Target className="mr-2" size={16} />
                    )}
                    {isLocating ? 'Finding location...' : 'Use my current location'}
                  </MobileButton>

                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    💡 Try: "NW1 2DB", "Camden", "Westminster Bridge"
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Active Filter Display */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-green-800">
                          📍 {distanceFilter.locationName}
                        </div>
                        <div className="text-xs text-green-600">
                          Within {distanceFilter.radius < 1
                            ? `${Math.round(distanceFilter.radius * 1000)}m`
                            : `${distanceFilter.radius}km`} radius
                        </div>
                      </div>
                      <MobileButton
                        variant="ghost"
                        size="sm"
                        onClick={onClearDistanceFilter}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        touchOptimized
                      >
                        <X size={14} />
                      </MobileButton>
                    </div>
                  </div>

                  {/* Radius Controls */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Search Radius</div>

                    {/* Quick Distance Buttons */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[0.5, 1, 2, 5].map((distance) => (
                        <MobileButton
                          key={distance}
                          variant={Math.abs(distanceFilter.radius - distance) < 0.01 ? "default" : "outline"}
                          size="sm"
                          onClick={() => onRadiusChange(distance)}
                          className="h-8 text-xs font-medium"
                          touchOptimized
                        >
                          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
                        </MobileButton>
                      ))}
                    </div>

                    {/* Fine Control */}
                    <div className="flex items-center justify-between">
                      <MobileButton
                        variant="outline"
                        size="sm"
                        onClick={() => onRadiusChange(Math.max(0.1, distanceFilter.radius - 0.1))}
                        className="h-8 w-8 p-0"
                        touchOptimized
                      >
                        <Minus size={12} />
                      </MobileButton>
                      <span className="text-sm font-medium px-3">
                        {distanceFilter.radius < 1
                          ? `${Math.round(distanceFilter.radius * 1000)}m`
                          : `${distanceFilter.radius}km`}
                      </span>
                      <MobileButton
                        variant="outline"
                        size="sm"
                        onClick={() => onRadiusChange(Math.min(10, distanceFilter.radius + 0.1))}
                        className="h-8 w-8 p-0"
                        touchOptimized
                      >
                        <Plus size={12} />
                      </MobileButton>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Actions - Updated grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
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

              {/* SINGLE Route button */}
              <MobileButton
                variant={routeMode ? "default" : "outline"}
                className="h-14 flex-col gap-1 text-center relative"
                onClick={onToggleRoute}
                touchOptimized
              >
                <Route size={18} />
                <div className="text-xs">
                  Route
                </div>
                {routePointsCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                  >
                    {routePointsCount}
                  </Badge>
                )}
              </MobileButton>

              <MobileButton
                variant="outline"
                className="h-14 flex-col gap-1 text-center"
                onClick={onResetView}
                touchOptimized
              >
                <Target size={18} />
                <div className="text-xs">Reset View</div>
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
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800 mb-1">Active Filters</div>
                <div className="space-y-1 text-xs text-blue-700">
                  {distanceFilter.enabled && (
                    <div>📍 {distanceFilter.locationName}</div>
                  )}
                  {activeStandardFilters > 0 && (
                    <div>🏷️ {activeStandardFilters} attribute filter{activeStandardFilters > 1 ? 's' : ''}</div>
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

        organisations={filterOptions.organisationOptions}
        selectedOrganisations={selectedOrganisations}
        onOrganisationsChange={onOrganisationsChange}

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