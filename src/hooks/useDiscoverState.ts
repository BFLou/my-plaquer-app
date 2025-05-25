// src/hooks/useDiscoverState.ts - Custom hook to manage Discover page state
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { capitalizeWords } from '@/utils/stringUtils';
import { adaptPlaquesData } from "@/utils/plaqueAdapter";
import plaqueData from '../data/plaque_data.json';
import { useUrlState } from '../components/maps/hooks/useUrlState';
import { useMapState } from '../components/maps/hooks/useMapState';
import { useVisitedPlaques } from './useVisitedPlaques';
import { useFavorites } from './useFavorites';
import { calculateDistance } from '../components/maps/utils/routeUtils';

export type ViewMode = 'grid' | 'list' | 'map';

const useDiscoverState = () => {
  // Basic state
  const [allPlaques, setAllPlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Route state
  const [routePoints, setRoutePoints] = useState([]);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [useImperial, setUseImperial] = useState(false);

  // Filter options
  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [professionOptions, setProfessionOptions] = useState([]);

  // External hooks
  const { urlState, setViewMode, setSearch, setFilters, resetFilters: resetUrlFilters } = useUrlState();
  const mapStateManager = useMapState();
  const { isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

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
      
      const adaptedData = adaptPlaquesData(plaqueData);
      setAllPlaques(adaptedData);
      
      // Generate filter options
      const postcodeCount = {};
      const colorCount = {};
      const professionCount = {};
      
      adaptedData.forEach(plaque => {
        // Postcodes
        if (plaque.postcode && plaque.postcode !== "Unknown") {
          postcodeCount[plaque.postcode] = (postcodeCount[plaque.postcode] || 0) + 1;
        }
        
        // Colors
        const color = plaque.color?.toLowerCase();
        if (color && color !== "unknown") {
          colorCount[color] = (colorCount[color] || 0) + 1;
        }
        
        // Professions
        if (plaque.profession && plaque.profession !== "Unknown") {
          professionCount[plaque.profession] = (professionCount[plaque.profession] || 0) + 1;
        }
      });
      
      // Set filter options
      setPostcodeOptions(
        Object.entries(postcodeCount)
          .map(([value, count]) => ({ label: value, value, count }))
          .sort((a, b) => b.count - a.count)
      );
      
      setColorOptions(
        Object.entries(colorCount)
          .map(([value, count]) => ({
            label: capitalizeWords(value),
            value,
            count
          }))
          .sort((a, b) => b.count - a.count)
      );
      
      setProfessionOptions(
        Object.entries(professionCount)
          .map(([value, count]) => ({
            label: capitalizeWords(value),
            value,
            count
          }))
          .sort((a, b) => b.count - a.count)
      );
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading plaque data:', error);
      setLoading(false);
      toast.error("Could not load the plaque data. Please try again later.");
    }
  }, []);

  // Distance filter state
  const activeLocation = mapStateManager.state.distanceFilter.location;
  const maxDistance = mapStateManager.state.distanceFilter.radius;
  const hideOutsidePlaques = mapStateManager.state.distanceFilter.visible;

  // Distance filter handlers
  const handleDistanceFilterChange = useCallback((newDistance, hideOutside) => {
    if (activeLocation) {
      mapStateManager.setDistanceFilter(activeLocation, newDistance, hideOutside);
    }
  }, [activeLocation, mapStateManager]);

  const handleLocationSet = useCallback((location) => {
    mapStateManager.setSearchLocation(location);
    toast.success("Location set! Distance filter is now available.");
  }, [mapStateManager]);

  // Filtered plaques
  const filteredPlaques = useMemo(() => {
    let filtered = allPlaques.filter((plaque) => {
      // Standard filters
      const matchesSearch = !urlState.search.trim() || 
        (plaque.title?.toLowerCase().includes(urlState.search.toLowerCase())) ||
        (plaque.inscription?.toLowerCase().includes(urlState.search.toLowerCase())) ||
        (plaque.address?.toLowerCase().includes(urlState.search.toLowerCase())) ||
        (plaque.location?.toLowerCase().includes(urlState.search.toLowerCase())) ||
        (plaque.description?.toLowerCase().includes(urlState.search.toLowerCase()));
      
      const matchesPostcode = urlState.postcodes.length === 0 || 
        (plaque.postcode && urlState.postcodes.includes(plaque.postcode));
      
      const matchesColor = urlState.colors.length === 0 || 
        (plaque.color && urlState.colors.includes(plaque.color.toLowerCase()));
      
      const matchesProfession = urlState.professions.length === 0 || 
        (plaque.profession && urlState.professions.includes(plaque.profession));
      
      const matchesVisited = !urlState.onlyVisited || plaque.visited || isPlaqueVisited(plaque.id);
      const matchesFavorite = !urlState.onlyFavorites || isFavorite(plaque.id);

      return matchesSearch && 
             matchesPostcode && 
             matchesColor && 
             matchesProfession && 
             matchesVisited && 
             matchesFavorite;
    });

    // Apply distance filter if active
    if (activeLocation && hideOutsidePlaques) {
      filtered = filtered.filter(plaque => {
        if (!plaque.latitude || !plaque.longitude) return false;
        
        const lat = parseFloat(plaque.latitude);
        const lng = parseFloat(plaque.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return false;
        
        const distance = calculateDistance(activeLocation[0], activeLocation[1], lat, lng);
        return distance <= maxDistance;
      });
    }

    return filtered;
  }, [
    allPlaques, 
    urlState,
    favorites, 
    isPlaqueVisited,
    isFavorite,
    activeLocation,
    hideOutsidePlaques,
    maxDistance
  ]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return urlState.postcodes.length + 
           urlState.colors.length + 
           urlState.professions.length + 
           (urlState.onlyVisited ? 1 : 0) + 
           (urlState.onlyFavorites ? 1 : 0) +
           (activeLocation && hideOutsidePlaques ? 1 : 0);
  }, [
    urlState.postcodes.length,
    urlState.colors.length,
    urlState.professions.length,
    urlState.onlyVisited,
    urlState.onlyFavorites,
    activeLocation,
    hideOutsidePlaques
  ]);

  // Event handlers
  const handlePlaqueClick = useCallback((plaque) => {
    setSelectedPlaque(plaque);
  }, []);

  const handleFavoriteToggle = useCallback((id) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const handleMarkVisited = useCallback(async (id) => {
    try {
      await markAsVisited(id, {
        visitedAt: new Date().toISOString(),
        notes: '',
      });
      
      setAllPlaques(prev => prev.map(p => 
        p.id === id ? { ...p, visited: true } : p
      ));
      
      toast.success("Marked as visited");
    } catch (error) {
      console.error("Error marking as visited:", error);
      toast.error("Failed to mark as visited");
    }
  }, [markAsVisited]);

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
      professionOptions
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
    isMobile
  };
};

export default useDiscoverState;