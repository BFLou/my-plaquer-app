// src/components/collections/CollectionFilterView.tsx - COMPLETE MOBILE OPTIMIZED
import React, { useState } from 'react';
import { Search, Grid, List, Map, X } from 'lucide-react';
import { Plaque } from '@/types/plaque';
import { MobileInput } from '@/components/ui/mobile-input';
import { MobileButton } from '@/components/ui/mobile-button';
import { Badge } from '@/components/ui/badge';
import { capitalizeWords } from '@/utils/stringUtils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddPlaquesButton from './AddPlaquesButton';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';

type ViewMode = 'grid' | 'list' | 'map';

type CollectionFilterViewProps = {
  plaques: Plaque[];
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddPlaquesClick: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
  onFilterChange?: (filtered: Plaque[]) => void;
  className?: string;
  showMapView?: boolean;
};

const CollectionFilterView: React.FC<CollectionFilterViewProps> = ({
  plaques,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  onAddPlaquesClick,
  isLoading = false,
  children,
  onFilterChange,
  className = '',
  showMapView = true,
}) => {
  // Mobile detection and responsive setup
  const mobile = isMobile();
  const safeArea = useSafeArea();

  // State management - FIXED: Removed unused activeFilters state
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);

  // Generate profession statistics
  const professionStats = React.useMemo(() => {
    const professionCounts: Record<string, number> = {};

    plaques.forEach((plaque) => {
      // Get profession or use 'Unknown' default - with capitalization
      const profession = plaque.profession
        ? capitalizeWords(plaque.profession)
        : 'Unknown';
      professionCounts[profession] = (professionCounts[profession] || 0) + 1;
    });

    return Object.entries(professionCounts)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count);
  }, [plaques]);

  // Filter plaques based on search query
  const filteredPlaques = React.useMemo(() => {
    return plaques.filter((plaque) => {
      // Filter by search query
      const matchesSearch =
        !searchQuery.trim() ||
        plaque.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plaque.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plaque.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [plaques, searchQuery]);

  // Update parent component when filtered plaques change
  React.useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredPlaques);
    }
  }, [filteredPlaques, onFilterChange]);

  // Clear search with haptic feedback
  const clearSearch = () => {
    if (mobile) {
      triggerHapticFeedback('light');
    }
    setSearchQuery('');
    setSelectedProfessions([]);
  };

  // Handle view mode change with haptic feedback
  const handleViewModeChange = (newMode: ViewMode) => {
    if (mobile) {
      triggerHapticFeedback('selection');
    }
    setViewMode(newMode);
  };

  // Handle add plaques with haptic feedback
  const handleAddPlaques = () => {
    if (mobile) {
      triggerHapticFeedback('medium');
    }
    onAddPlaquesClick();
  };

  return (
    <div
      className={`space-y-4 ${className}`}
      style={{
        paddingLeft: mobile ? safeArea.left : undefined,
        paddingRight: mobile ? safeArea.right : undefined,
      }}
    >
      {/* Main Filter Container - Mobile optimized */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        {/* Search Input - Mobile optimized */}
        <div className="relative w-full mb-3">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={mobile ? 18 : 16}
          />
          <MobileInput
            placeholder="Search plaques..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-${mobile ? '10' : '9'} pr-${mobile ? '10' : '9'} w-full ${mobile ? 'h-12' : ''}`}
            preventZoom={true}
          />
          {searchQuery && (
            <MobileButton
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={clearSearch}
            >
              <X size={mobile ? 18 : 16} />
            </MobileButton>
          )}
        </div>

        {/* View Toggle and Add Button Container */}
        <div
          className={`flex ${mobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}
        >
          {/* View Mode Tabs - Mobile optimized */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => handleViewModeChange(v as ViewMode)}
            defaultValue="grid"
            className={mobile ? 'w-full' : ''}
          >
            <TabsList className={mobile ? 'w-full grid grid-cols-3' : ''}>
              <TabsTrigger
                value="grid"
                className={`flex items-center gap-1.5 ${mobile ? 'flex-1' : ''}`}
              >
                <Grid size={mobile ? 16 : 14} />
                <span className={mobile ? 'text-sm' : 'hidden sm:inline'}>
                  Grid
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className={`flex items-center gap-1.5 ${mobile ? 'flex-1' : ''}`}
              >
                <List size={mobile ? 16 : 14} />
                <span className={mobile ? 'text-sm' : 'hidden sm:inline'}>
                  List
                </span>
              </TabsTrigger>
              {showMapView && (
                <TabsTrigger
                  value="map"
                  className={`flex items-center gap-1.5 ${mobile ? 'flex-1' : ''}`}
                >
                  <Map size={mobile ? 16 : 14} />
                  <span className={mobile ? 'text-sm' : 'hidden sm:inline'}>
                    Map
                  </span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {/* Add Plaques Button - Mobile optimized */}
          <div className={mobile ? 'w-full' : ''}>
            <AddPlaquesButton
              onAddPlaques={handleAddPlaques}
              isLoading={isLoading}
              className={`${mobile ? 'w-full h-12' : 'hidden sm:flex'}`}
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display - Mobile optimized */}
      {searchQuery && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
          <div className="flex items-center">
            <Badge
              className={`bg-blue-100 text-blue-700 border-none ${mobile ? 'text-sm px-3 py-1' : ''}`}
            >
              Search: {searchQuery}
            </Badge>
          </div>
          <MobileButton
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className={`${mobile ? 'h-8 px-3' : 'h-7 px-2'} text-xs text-blue-600 hover:text-blue-800`}
          >
            Clear
          </MobileButton>
        </div>
      )}

      {/* Filter Status - Mobile optimized */}
      {searchQuery && filteredPlaques.length !== plaques.length && (
        <div
          className={`${mobile ? 'text-base' : 'text-sm'} text-gray-500 px-1`}
        >
          Showing {filteredPlaques.length} of {plaques.length} plaques
        </div>
      )}

      {/* Mobile-specific profession filter (if needed) */}
      {mobile && professionStats.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Filter by Profession
          </h4>
          <div className="flex flex-wrap gap-2">
            {professionStats.slice(0, 5).map(({ profession, count }) => (
              <MobileButton
                key={profession}
                variant={
                  selectedProfessions.includes(profession)
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => {
                  triggerHapticFeedback('selection');
                  setSelectedProfessions((prev) =>
                    prev.includes(profession)
                      ? prev.filter((p) => p !== profession)
                      : [...prev, profession]
                  );
                }}
                className="text-xs"
              >
                {profession} ({count})
              </MobileButton>
            ))}
            {selectedProfessions.length > 0 && (
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setSelectedProfessions([]);
                }}
                className="text-xs text-red-600"
              >
                Clear
              </MobileButton>
            )}
          </div>
        </div>
      )}

      {/* Children (actual content) with mobile optimization */}
      <div
        className="min-h-0 flex-1"
        style={{
          marginBottom: mobile ? Math.max(safeArea.bottom, 20) : undefined,
        }}
      >
        {children}
      </div>

      {/* Mobile-only floating add button (alternative position) */}
      {mobile && (
        <div className="fixed bottom-4 right-4 z-50">
          <AddPlaquesButton
            onAddPlaques={handleAddPlaques}
            isLoading={isLoading}
            className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white p-0"
          />
        </div>
      )}

      {/* FIXED: Removed jsx prop from style tag - use regular CSS module or styled-components instead */}
    </div>
  );
};

export default CollectionFilterView;
