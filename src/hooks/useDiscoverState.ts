// src/hooks/useDiscoverState.ts - Custom hook to manage Discover page state - FIXED
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { capitalizeWords } from '@/utils/stringUtils';
import { adaptPlaquesData } from '@/utils/plaqueAdapter';
import plaqueData from '../data/plaque_data.json';
import { useUrlState } from './useUrlState';
import { useMapState } from './useMapState';
import { useVisitedPlaques } from './useVisitedPlaques';
import { useFavorites } from './useFavorites';
import { calculateDistance } from '../components/maps/utils/routeUtils';
import { Plaque } from '@/types/plaque';

export type ViewMode = 'grid' | 'list' | 'map';

// Interface for filter options
interface FilterOption {
  label: string;
  value: string;
  count: number;
}

const useDiscoverState = () => {
  // Basic state with proper typing
  const [allPlaques, setAllPlaques] = useState<Plaque[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Route state with proper typing
  const [routePoints, setRoutePoints] = useState<Plaque[]>([]);
  const [isRoutingMode, setIsRoutingMode] = useState<boolean>(false);
  const [useImperial, setUseImperial] = useState<boolean>(false);

  // Filter options with proper typing
  const [postcodeOptions, setPostcodeOptions] = useState<FilterOption[]>([]);
  const [colorOptions, setColorOptions] = useState<FilterOption[]>([]);
  const [professionOptions, setProfessionOptions] = useState<FilterOption[]>(
    []
  );

  // External hooks
  const {
    urlState,
    setViewMode,
    setSearch,
    setFilters,
    resetFilters: resetUrlFilters,
  } = useUrlState();
  const mapStateManager = useMapState();
  const { isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load plaque data
  useEffect(() => {
    try {
      setLoading(true);

      // Cast plaqueData to proper type - handle both array and object cases
      const rawData = Array.isArray(plaqueData)
        ? (plaqueData as any[])
        : (Object.values(plaqueData) as any[]);

      const adaptedData: Plaque[] = adaptPlaquesData(rawData);
      setAllPlaques(adaptedData);

      // Generate filter options with proper typing
      const postcodeCount: Record<string, number> = {};
      const colorCount: Record<string, number> = {};
      const professionCount: Record<string, number> = {};

      adaptedData.forEach((plaque: Plaque) => {
        // Postcodes
        if (plaque.postcode && plaque.postcode !== 'Unknown') {
          postcodeCount[plaque.postcode] =
            (postcodeCount[plaque.postcode] || 0) + 1;
        }

        // Colors
        const color = plaque.color?.toLowerCase();
        if (color && color !== 'unknown') {
          colorCount[color] = (colorCount[color] || 0) + 1;
        }

        // Professions
        if (plaque.profession && plaque.profession !== 'Unknown') {
          professionCount[plaque.profession] =
            (professionCount[plaque.profession] || 0) + 1;
        }
      });

      // Set filter options with proper typing
      setPostcodeOptions(
        Object.entries(postcodeCount)
          .map(
            ([value, count]): FilterOption => ({ label: value, value, count })
          )
          .sort((a, b) => (b.count as number) - (a.count as number))
      );

      setColorOptions(
        Object.entries(colorCount)
          .map(
            ([value, count]): FilterOption => ({
              label: capitalizeWords(value),
              value,
              count: count as number,
            })
          )
          .sort((a, b) => (b.count as number) - (a.count as number))
      );

      setProfessionOptions(
        Object.entries(professionCount)
          .map(
            ([value, count]): FilterOption => ({
              label: capitalizeWords(value),
              value,
              count: count as number,
            })
          )
          .sort((a, b) => (b.count as number) - (a.count as number))
      );

      setLoading(false);
    } catch (error) {
      console.error('Error loading plaque data:', error);
      setLoading(false);
      toast.error('Could not load the plaque data. Please try again later.');
    }
  }, []);

  // Distance filter state
  const activeLocation = mapStateManager.state.distanceFilter.location;
  const maxDistance = mapStateManager.state.distanceFilter.radius;
  const hideOutsidePlaques = mapStateManager.state.distanceFilter.visible;

  // Distance filter handlers with proper typing
  const handleDistanceFilterChange = useCallback(
    (newDistance: number, hideOutside: boolean) => {
      if (activeLocation) {
        mapStateManager.setDistanceFilter(
          activeLocation,
          newDistance,
          hideOutside
        );
      }
    },
    [activeLocation, mapStateManager]
  );

  const handleLocationSet = useCallback(
    (location: [number, number]) => {
      mapStateManager.setSearchLocation(location);
      toast.success('Location set! Distance filter is now available.');
    },
    [mapStateManager]
  );

  // Filtered plaques
  const filteredPlaques = useMemo(() => {
    let filtered = allPlaques.filter((plaque: Plaque) => {
      // Standard filters
      const matchesSearch =
        !urlState.search.trim() ||
        plaque.title?.toLowerCase().includes(urlState.search.toLowerCase()) ||
        plaque.inscription
          ?.toLowerCase()
          .includes(urlState.search.toLowerCase()) ||
        plaque.address?.toLowerCase().includes(urlState.search.toLowerCase()) ||
        plaque.location
          ?.toLowerCase()
          .includes(urlState.search.toLowerCase()) ||
        plaque.description
          ?.toLowerCase()
          .includes(urlState.search.toLowerCase());

      const matchesPostcode =
        urlState.postcodes.length === 0 ||
        (plaque.postcode && urlState.postcodes.includes(plaque.postcode));

      const matchesColor =
        urlState.colors.length === 0 ||
        (plaque.color && urlState.colors.includes(plaque.color.toLowerCase()));

      const matchesProfession =
        urlState.professions.length === 0 ||
        (plaque.profession && urlState.professions.includes(plaque.profession));

      const matchesVisited =
        !urlState.onlyVisited || plaque.visited || isPlaqueVisited(plaque.id);
      const matchesFavorite = !urlState.onlyFavorites || isFavorite(plaque.id);

      return (
        matchesSearch &&
        matchesPostcode &&
        matchesColor &&
        matchesProfession &&
        matchesVisited &&
        matchesFavorite
      );
    });

    // Apply distance filter if active
    if (activeLocation && hideOutsidePlaques) {
      filtered = filtered.filter((plaque: Plaque) => {
        if (!plaque.latitude || !plaque.longitude) return false;

        const lat = parseFloat(String(plaque.latitude));
        const lng = parseFloat(String(plaque.longitude));

        if (isNaN(lat) || isNaN(lng)) return false;

        const distance = calculateDistance(
          activeLocation[0],
          activeLocation[1],
          lat,
          lng
        );
        return distance <= maxDistance;
      });
    }

    return filtered;
  }, [
    allPlaques,
    urlState,
    isPlaqueVisited,
    isFavorite,
    activeLocation,
    hideOutsidePlaques,
    maxDistance,
  ]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return (
      urlState.postcodes.length +
      urlState.colors.length +
      urlState.professions.length +
      (urlState.onlyVisited ? 1 : 0) +
      (urlState.onlyFavorites ? 1 : 0) +
      (activeLocation && hideOutsidePlaques ? 1 : 0)
    );
  }, [
    urlState.postcodes.length,
    urlState.colors.length,
    urlState.professions.length,
    urlState.onlyVisited,
    urlState.onlyFavorites,
    activeLocation,
    hideOutsidePlaques,
  ]);

  // Event handlers with proper typing
  const handlePlaqueClick = useCallback((plaque: Plaque) => {
    setSelectedPlaque(plaque);
  }, []);

  const handleFavoriteToggle = useCallback(
    (id: number) => {
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const handleMarkVisited = useCallback(
    async (id: number) => {
      try {
        await markAsVisited(id, {
          visitedAt: new Date().toISOString(),
          notes: '',
        });

        setAllPlaques((prev: Plaque[]) =>
          prev.map((p: Plaque) => (p.id === id ? { ...p, visited: true } : p))
        );

        toast.success('Marked as visited');
      } catch (error) {
        console.error('Error marking as visited:', error);
        toast.error('Failed to mark as visited');
      }
    },
    [markAsVisited]
  );

  const resetFilters = useCallback(() => {
    resetUrlFilters();
    mapStateManager.clearDistanceFilter();
    setCurrentPage(1);
  }, [resetUrlFilters, mapStateManager]);

  return {
    // Data state
    allPlaques,
    loading,

    // UI state
    viewMode: urlState.view,
    setViewMode,
    selectedPlaque,
    setSelectedPlaque,
    currentPage,
    setCurrentPage,

    // Filter state
    urlState,
    setSearch,
    setFilters,
    resetFilters,
    filtersOpen,
    setFiltersOpen,
    filterOptions: {
      postcodeOptions,
      colorOptions,
      professionOptions,
    },
    filteredPlaques,
    activeFiltersCount,

    // Route state
    routePoints,
    setRoutePoints,
    isRoutingMode,
    setIsRoutingMode,
    useImperial,
    setUseImperial,

    // Distance filter state
    activeLocation,
    maxDistance,
    hideOutsidePlaques,
    handleDistanceFilterChange,
    handleLocationSet,

    // Handlers
    handlePlaqueClick,
    handleFavoriteToggle,
    handleMarkVisited,
    isFavorite,
    isPlaqueVisited,
    isMobile,
  };
};

export default useDiscoverState;
