// src/components/maps/features/Desktop/DesktopCompactSidebar.tsx - UPDATED
import React, { useState } from 'react';
import {
  Filter,
  Route,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Navigation2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plaque } from '@/types/plaque';
import DiscoverFilterDialog from '../../../plaques/DiscoverFilterDialog';
import { CompactDistanceFilter } from '../Filters/CompactDistanceFilter';
import { capitalizeWords } from '@/utils/stringUtils';

interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

interface DesktopCompactSidebarProps {
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

  // Collapse state
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DesktopCompactSidebar: React.FC<DesktopCompactSidebarProps> = (
  props
) => {
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
    isCollapsed,
    onToggleCollapse,
    plaques,
  } = props;

  const [showStandardFilters, setShowStandardFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    distance: false,
    filters: false,
  });

  const activeStandardFilters =
    selectedColors.length +
    selectedPostcodes.length +
    selectedProfessions.length +
    selectedOrganisations.length +
    (onlyVisited ? 1 : 0) +
    (onlyFavorites ? 1 : 0);
  const totalActiveFilters =
    activeStandardFilters + (distanceFilter.enabled ? 1 : 0);

  const filterOptions = React.useMemo(() => {
    const postcodeCount: Record<string, number> = {};
    const colorCount: Record<string, number> = {};
    const professionCount: Record<string, number> = {};
    const organisationCount: Record<string, number> = {};

    plaques.forEach((plaque) => {
      if (plaque.postcode && plaque.postcode !== 'Unknown') {
        postcodeCount[plaque.postcode] =
          (postcodeCount[plaque.postcode] || 0) + 1;
      }

      const color = plaque.color?.toLowerCase();
      if (color && color !== 'unknown') {
        colorCount[color] = (colorCount[color] || 0) + 1;
      }

      if (plaque.profession && plaque.profession !== 'Unknown') {
        professionCount[plaque.profession] =
          (professionCount[plaque.profession] || 0) + 1;
      }

      if (plaque.organisations && plaque.organisations !== 'Unknown') {
        organisationCount[plaque.organisations] =
          (organisationCount[plaque.organisations] || 0) + 1;
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
          count,
        }))
        .sort((a, b) => b.count - a.count),

      professionOptions: Object.entries(professionCount)
        .map(([value, count]) => ({
          label: capitalizeWords(value),
          value,
          count,
        }))
        .sort((a, b) => b.count - a.count),

      organisationOptions: Object.entries(organisationCount)
        .map(([value, count]) => ({
          label: capitalizeWords(value),
          value,
          count,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }, [plaques]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Collapsed state - minimal floating controls
  if (isCollapsed) {
    return (
      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-[999] flex flex-col gap-1">
        <Button
          variant="default"
          size="sm"
          className="h-10 w-10 rounded-full shadow-lg bg-white/95 backdrop-blur-sm border border-gray-200 hover:bg-white text-gray-700 relative"
          onClick={onToggleCollapse}
        >
          <ChevronRight size={16} />
          {totalActiveFilters > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center min-w-[16px]"
            >
              {totalActiveFilters}
            </Badge>
          )}
        </Button>

        {/* SINGLE Route toggle button */}
        <Button
          variant={routeMode ? 'default' : 'outline'}
          size="sm"
          className="h-8 w-8 rounded-full shadow-md bg-white/95 backdrop-blur-sm relative"
          onClick={onToggleRoute}
          title="Route Mode"
        >
          <Route size={12} />
          {routePointsCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-3 w-3 text-xs p-0 flex items-center justify-center min-w-[12px]"
            >
              {routePointsCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  // Expanded state - compact sidebar
  return (
    <>
      <div className="fixed left-3 top-20 bottom-20 z-[999] w-64 max-w-[calc(100vw-1.5rem)]">
        <Card className="h-full shadow-lg border bg-white/98 backdrop-blur-sm flex flex-col">
          {/* Compact header */}
          <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">
                  Controls
                </h3>
                {totalActiveFilters > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {totalActiveFilters}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-6 w-6 p-0 hover:bg-white/50"
              >
                <ChevronLeft size={12} />
              </Button>
            </div>
          </div>

          {/* Compact content */}
          <CardContent className="flex-1 p-3 space-y-2 overflow-y-auto">
            {/* Distance Filter */}
            <CompactDistanceFilter
              distanceFilter={distanceFilter}
              onSetLocation={onSetLocation}
              onRadiusChange={onRadiusChange}
              onClear={onClearDistanceFilter}
              isExpanded={expandedSections.distance}
              onToggleExpanded={() => toggleSection('distance')}
            />

            {/* Standard Filters */}
            <Button
              variant={activeStandardFilters > 0 ? 'default' : 'outline'}
              size="sm"
              className="w-full h-9 justify-between text-xs"
              onClick={() => setShowStandardFilters(true)}
            >
              <div className="flex items-center gap-1.5">
                <Filter size={14} />
                <span>Filters</span>
              </div>
              {activeStandardFilters > 0 && (
                <Badge variant="secondary" className="text-xs px-1 h-5">
                  {activeStandardFilters}
                </Badge>
              )}
            </Button>

            {/* Route Planning - REMOVED from here, now in floating controls */}

            {/* Quick Actions */}
            <div className="border-t pt-2 mt-2">
              <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Quick Actions
              </div>

              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs justify-start"
                  onClick={onResetView}
                >
                  <Navigation2 size={12} className="mr-1.5" />
                  Reset View
                </Button>

                {totalActiveFilters > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs text-red-600 hover:bg-red-50 justify-start"
                    onClick={() => {
                      onClearDistanceFilter();
                      onResetStandardFilters();
                    }}
                  >
                    <RotateCcw size={12} className="mr-1.5" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
