// src/pages/Discover.tsx - FIXED: Complete render loop fixes
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Search, Filter, X, Map, Grid, List, Badge,
  Route as MapPin, Crosshair
} from 'lucide-react';
import { PageContainer } from "@/components";
import { PlaqueCard } from "@/components/plaques/PlaqueCard";
import { PlaqueListItem } from "@/components/plaques/PlaqueListItem";
import { PlaqueDetail } from "@/components/plaques/PlaqueDetail";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { capitalizeWords } from '@/utils/stringUtils';
import { adaptPlaquesData } from "@/utils/plaqueAdapter";
import plaqueData from '../data/plaque_data.json';
import Pagination from '@/components/plaques/Pagination';
import PlaqueMap from '../components/maps/PlaqueMap';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useRoutes } from '@/hooks/useRoutes';
import { useFavorites } from '@/hooks/useFavorites';
import { calculateDistance } from '../components/maps/utils/routeUtils';
import { useUrlState } from '../components/maps/hooks/useUrlState';
import { useMapState } from '../components/maps/hooks/useMapState';
import '../styles/map-styles.css';

// Import filter components
import DiscoverFilterDialog from '../components/plaques/DiscoverFilterDialog';

export type ViewMode = 'grid' | 'list' | 'map';

const Discover = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  
  // FIXED: Move useMapState hook to top level
  const mapStateManager = useMapState();
  
  // Use the URL state manager
  const { urlState, setViewMode, setSearch, setFilters, resetFilters: resetUrlFilters } = useUrlState();
  
  // State
  const [allPlaques, setAllPlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Enhanced Route State
  const [routePoints, setRoutePoints] = useState([]);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeDistance, setRouteDistance] = useState(0);
  const [useImperial, setUseImperial] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const { isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  const { createRoute } = useRoutes();
  
  // Filter options
  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [professionOptions, setProfessionOptions] = useState([]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // View mode change tracking
  const previousViewModeRef = useRef(urlState.view);
  const mapRestorationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // FIXED: Extract stable map state values at component level
  const distanceFilterActive = mapStateManager.state.distanceFilter.active;
  const distanceFilterVisible = mapStateManager.state.distanceFilter.visible;
  const distanceFilterRadius = mapStateManager.state.distanceFilter.radius;
  const distanceFilterLocation = mapStateManager.state.distanceFilter.location;

  // FIXED: Create stable refs for mapStateManager methods
  const mapStateRef = useRef();
  useEffect(() => {
    mapStateRef.current = {
      getActiveLocation: mapStateManager.getActiveLocation,
      setDistanceFilter: mapStateManager.setDistanceFilter,
      setSearchLocation: mapStateManager.setSearchLocation,
      clearDistanceFilter: mapStateManager.clearDistanceFilter,
      shouldRestoreDistanceCircle: mapStateManager.shouldRestoreDistanceCircle
    };
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // FIXED: Stable helper function with proper dependencies
  const getDistanceFromActiveLocation = useCallback((plaque) => {
    if (!distanceFilterLocation || !plaque.latitude || !plaque.longitude) return Infinity;
    
    const lat = parseFloat(plaque.latitude);
    const lng = parseFloat(plaque.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return Infinity;
    
    return calculateDistance(distanceFilterLocation[0], distanceFilterLocation[1], lat, lng);
  }, [distanceFilterLocation]);

  const formatDistance = useCallback((distanceKm) => {
    if (useImperial) {
      const miles = distanceKm * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }, [useImperial]);

  const formatWalkingTime = useCallback((distanceKm) => {
    if (distanceKm <= 0) return "0 min";
    
    const minutes = useImperial 
      ? Math.round(distanceKm * 0.621371 * 20) // 20 minutes per mile
      : Math.round(distanceKm * 12); // 12 minutes per km
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }, [useImperial]);

  const calculateRouteDistance = useCallback((points = routePoints) => {
    if (!points || points.length < 2) return 0;
    
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
      
      const startLat = parseFloat(start.latitude);
      const startLng = parseFloat(start.longitude);
      const endLat = parseFloat(end.latitude);
      const endLng = parseFloat(end.longitude);
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
      
      total += calculateDistance(startLat, startLng, endLat, endLng);
    }
    
    return total;
  }, [routePoints]);

  // Update route distance when route points change
  useEffect(() => {
    const distance = calculateRouteDistance(routePoints);
    setRouteDistance(distance);
  }, [routePoints, calculateRouteDistance]);

  // FIXED: View mode change effect with stable dependencies
  useEffect(() => {
    const currentView = urlState.view;
    const previousView = previousViewModeRef.current;
    
    if (currentView !== previousView) {
      console.log('View mode changed:', { from: previousView, to: currentView });
      
      // If switching from map view, preserve the current state
      if (previousView === 'map' && mapRef.current) {
        if (mapRef.current.preventNextZoom) {
          mapRef.current.preventNextZoom();
        }
      }
      
      // If switching to map view, schedule restoration
      if (currentView === 'map' && previousView !== 'map') {
        console.log('Switching to map view, scheduling restoration...');
        
        if (mapRestorationTimeoutRef.current) {
          clearTimeout(mapRestorationTimeoutRef.current);
        }
        
        mapRestorationTimeoutRef.current = setTimeout(() => {
          if (mapRef.current && distanceFilterActive && distanceFilterVisible) {
            console.log('Restoring distance circle after view switch...');
            
            const attemptRestoration = (attempts = 0) => {
              if (attempts >= 3) {
                console.warn('Max restoration attempts reached');
                return;
              }
              
              if (mapRef.current && mapRef.current.restoreDistanceCircle) {
                mapRef.current.restoreDistanceCircle();
                
                setTimeout(() => {
                  if (distanceFilterActive && 
                      distanceFilterVisible &&
                      mapRef.current && 
                      mapRef.current.restoreDistanceCircle) {
                    attemptRestoration(attempts + 1);
                  }
                }, 300);
              } else {
                setTimeout(() => attemptRestoration(attempts + 1), 200);
              }
            };
            
            attemptRestoration();
          }
        }, 800);
      }
      
      previousViewModeRef.current = currentView;
    }
  }, [urlState.view, distanceFilterActive, distanceFilterVisible]);

  // Cleanup restoration timeout
  useEffect(() => {
    return () => {
      if (mapRestorationTimeoutRef.current) {
        clearTimeout(mapRestorationTimeoutRef.current);
      }
    };
  }, []);

  // Load plaque data - FIXED: Only run once
  useEffect(() => {
    try {
      setLoading(true);
      
      const adaptedData = adaptPlaquesData(plaqueData);
      setAllPlaques(adaptedData);
      
      // Generate filter options
      const postcodeCount = {};
      adaptedData.forEach(plaque => {
        if (plaque.postcode && plaque.postcode !== "Unknown") {
          postcodeCount[plaque.postcode] = (postcodeCount[plaque.postcode] || 0) + 1;
        }
      });
      
      const postcodes = Object.entries(postcodeCount)
        .map(([value, count]) => ({ label: value, value, count }))
        .sort((a, b) => b.count - a.count);
      
      setPostcodeOptions(postcodes);
      
      // Colors
      const colorCount = {};
      adaptedData.forEach(plaque => {
        const color = plaque.color?.toLowerCase();
        if (color && color !== "unknown") {
          colorCount[color] = (colorCount[color] || 0) + 1;
        }
      });
      
      const colors = Object.entries(colorCount)
        .map(([value, count]) => ({
          label: capitalizeWords(value),
          value,
          count
        }))
        .sort((a, b) => b.count - a.count);
      
      setColorOptions(colors);
      
      // Professions
      const professionCount = {};
      adaptedData.forEach(plaque => {
        if (plaque.profession && plaque.profession !== "Unknown") {
          professionCount[plaque.profession] = (professionCount[plaque.profession] || 0) + 1;
        }
      });
      
      const professions = Object.entries(professionCount)
        .map(([value, count]) => ({
          label: capitalizeWords(value),
          value,
          count
        }))
        .sort((a, b) => b.count - a.count);
      
      setProfessionOptions(professions);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading plaque data:', error);
      setLoading(false);
      toast.error("Could not load the plaque data. Please try again later.");
    }
  }, []); // Empty dependency array

  // FIXED: Enhanced filter logic with stable dependencies
  const filteredPlaques = useMemo(() => {
    let filtered = allPlaques.filter((plaque) => {
      // Standard filters using URL state
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

    // Apply distance filter if active - FIXED: Use individual stable values
    if (distanceFilterActive && distanceFilterLocation && distanceFilterVisible) {
      filtered = filtered.filter(plaque => {
        const distance = getDistanceFromActiveLocation(plaque);
        return distance <= distanceFilterRadius;
      });
    }

    return filtered;
  }, [
    allPlaques, 
    urlState.search,
    urlState.postcodes,
    urlState.colors,
    urlState.professions,
    urlState.onlyVisited,
    urlState.onlyFavorites,
    favorites, 
    isPlaqueVisited,
    isFavorite,
    distanceFilterActive,
    distanceFilterLocation,
    distanceFilterVisible,
    distanceFilterRadius,
    getDistanceFromActiveLocation
  ]);

  // FIXED: Calculate active filters count with stable values
  const activeFiltersCount = useMemo(() => {
    return urlState.postcodes.length + 
           urlState.colors.length + 
           urlState.professions.length + 
           (urlState.onlyVisited ? 1 : 0) + 
           (urlState.onlyFavorites ? 1 : 0) +
           (distanceFilterActive && distanceFilterVisible ? 1 : 0);
  }, [
    urlState.postcodes.length,
    urlState.colors.length,
    urlState.professions.length,
    urlState.onlyVisited,
    urlState.onlyFavorites,
    distanceFilterActive,
    distanceFilterVisible
  ]);

  // Sort and paginate plaques - FIXED: Use stable dependencies
  const sortedAndPaginatedPlaques = useMemo(() => {
    const sortOption = 'newest';
    
    const sorted = [...filteredPlaques].sort((a, b) => {
      if (sortOption === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sortOption === 'z-a') return (b.title || '').localeCompare(a.title || '');
      if (sortOption === 'distance' && distanceFilterActive) {
        const distA = getDistanceFromActiveLocation(a);
        const distB = getDistanceFromActiveLocation(b);
        return distA - distB;
      }
      return b.id - a.id;
    });
    
    const total = Math.ceil(sorted.length / itemsPerPage);
    setTotalPages(total);
    
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [filteredPlaques, currentPage, itemsPerPage, distanceFilterActive, getDistanceFromActiveLocation]);

  // Enhanced route management functions
  const handleToggleRoutingMode = useCallback(() => {
    const newRoutingMode = !isRoutingMode;
    setIsRoutingMode(newRoutingMode);
    
    if (newRoutingMode) {
      toast.success("Route planning mode activated. Click on plaques to add them to your route.", {
        duration: 4000,
      });
    } else {
      handleClearRoute();
      toast.info("Route planning mode deactivated.");
    }
  }, [isRoutingMode]);

  const handleAddPlaqueToRoute = useCallback((plaque) => {
    if (routePoints.some(p => p.id === plaque.id)) {
      toast.info(`"${plaque.title}" is already in your route.`);
      return;
    }
    
    setRoutePoints(prev => {
      const newRoute = [...prev, plaque];
      
      if (newRoute.length === 1) {
        toast.success(`Added "${plaque.title}" as your starting point.`);
      } else if (newRoute.length === 2) {
        toast.success(`Added "${plaque.title}" - you now have a route with ${newRoute.length} stops!`);
      } else {
        toast.success(`Added "${plaque.title}" (${newRoute.length} stops total)`);
      }
      
      return newRoute;
    });
  }, [routePoints]);

  const handleRemovePlaqueFromRoute = useCallback((plaqueId) => {
    setRoutePoints(prev => {
      const newRoute = prev.filter(p => p.id !== plaqueId);
      const removedPlaque = prev.find(p => p.id === plaqueId);
      
      if (removedPlaque) {
        toast.info(`Removed "${removedPlaque.title}" from route`);
      }
      
      return newRoute;
    });
  }, []);

  const handleClearRoute = useCallback(() => {
    if (routePoints.length > 0) {
      setRoutePoints([]);
      toast.info(`Cleared route with ${routePoints.length} stops`);
    }
  }, [routePoints.length]);

  // FIXED: Distance filter handlers with stable references
  const handleDistanceFilterChange = useCallback((newDistance, hideOutside) => {
    console.log('Distance filter change:', { newDistance, hideOutside, distanceFilterLocation });
    
    if (distanceFilterLocation && mapStateRef.current) {
      mapStateRef.current.setDistanceFilter(distanceFilterLocation, newDistance, hideOutside);
      
      // Update map if it's currently visible
      if (urlState.view === 'map' && mapRef.current && mapRef.current.restoreDistanceCircle) {
        // Debounce map updates
        clearTimeout(window.mapFilterTimeout);
        window.mapFilterTimeout = setTimeout(() => {
          mapRef.current.restoreDistanceCircle();
        }, 150);
      }
    }
  }, [urlState.view, distanceFilterLocation]);

  const handleLocationSet = useCallback((location) => {
    console.log('Location set:', location);
    
    if (mapStateRef.current) {
      mapStateRef.current.setSearchLocation(location);
      toast.success("Location set! Distance filter is now available.");
    }
  }, []);

  // Handler functions - FIXED: Use useCallback for stability
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, [setViewMode]);

  const handleFavoriteToggle = useCallback((id) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const handlePlaqueClick = useCallback((plaque) => {
    setSelectedPlaque(plaque);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPlaque(null);
  }, []);

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

  // Filter actions - FIXED: Use useCallback
  const handleOpenFilters = useCallback(() => {
    setFiltersOpen(true);
  }, []);

  const handleApplyFilters = useCallback((filterData) => {
    setFilters({
      colors: filterData.selectedColors,
      postcodes: filterData.selectedPostcodes,
      professions: filterData.selectedProfessions,
      onlyVisited: filterData.onlyVisited,
      onlyFavorites: filterData.onlyFavorites,
    });
    setCurrentPage(1);
    setFiltersOpen(false);
  }, [setFilters]);

  // FIXED: Reset filters function with stable refs
  const handleResetFilters = useCallback(() => {
    resetUrlFilters();
    
    if (mapStateRef.current) {
      mapStateRef.current.clearDistanceFilter();
    }
    
    if (urlState.view === 'map' && mapRef.current && mapRef.current.resetFilters) {
      mapRef.current.resetFilters();
    }
    
    setCurrentPage(1);
  }, [resetUrlFilters, urlState.view]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Find nearby plaques for detail view - FIXED: Use useCallback
  const getNearbyPlaques = useCallback((currentPlaque) => {
    return allPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  }, [allPlaques]);

  // FIXED: Stable activeLocation value
  const activeLocation = useMemo(() => {
    return distanceFilterLocation;
  }, [distanceFilterLocation]);

  return (
    <PageContainer 
      activePage="discover"
      hasFooter={urlState.view !== 'map'}
      simplifiedFooter={true}
    >
      {/* View Mode Selection Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[61px] z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Tabs 
              value={urlState.view} 
              onValueChange={handleViewModeChange}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="map" className="flex-1 sm:flex-initial">
                  <Map size={16} className="mr-2" /> Map View
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex-1 sm:flex-initial">
                  <Grid size={16} className="mr-2" /> Grid View
                </TabsTrigger>
                <TabsTrigger value="list" className="flex-1 sm:flex-initial">
                  <List size={16} className="mr-2" /> List View
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search plaques..."
                  value={urlState.search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 pr-9 w-full"
                />
                {urlState.search && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearch('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <Button 
                variant={activeFiltersCount > 0 ? "default" : "outline"}
                size="sm" 
                className="shrink-0 gap-1"
                onClick={handleOpenFilters}
              >
                <Filter size={16} /> 
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 h-5 min-w-5 rounded-full bg-white text-blue-600 text-xs flex items-center justify-center px-1">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="container mx-auto px-4 mt-3">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {/* Color filters */}
            {urlState.colors.map(color => (
              <Badge key={color} variant="secondary" className="gap-1">
                {capitalizeWords(color)}
                <button
                  onClick={() => setFilters({ 
                    colors: urlState.colors.filter(c => c !== color) 
                  })}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
            
            {/* Distance filter */}
            {distanceFilterActive && distanceFilterVisible && (
              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
                <Crosshair size={12} />
                Within {formatDistance(distanceFilterRadius)}
                <button
                  onClick={() => mapStateRef.current?.clearDistanceFilter()}
                  className="ml-1 hover:bg-green-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </Badge>
            )}
            
            {/* Clear all button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 flex-grow relative">
        {/* Status bar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium text-gray-600">
            {loading ? "Loading plaques..." : (
              <>
                {filteredPlaques.length} {filteredPlaques.length === 1 ? 'Plaque' : 'Plaques'} found
                {distanceFilterActive && activeLocation && (
                  <span className="ml-2 text-green-600">
                    {distanceFilterVisible ? `within ${formatDistance(distanceFilterRadius)}` : `• ${formatDistance(distanceFilterRadius)} range active`}
                  </span>
                )}
                {isRoutingMode && routePoints.length > 0 && (
                  <span className="ml-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Route: {routePoints.length} stops • {formatDistance(routeDistance)} • {formatWalkingTime(routeDistance)}
                    </Badge>
                  </span>
                )}
              </>
            )}
          </h2>
        </div>
        
        {loading ? (
          // Loading states
          urlState.view === 'map' ? (
            <div className="h-[650px] bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          )
        ) : (
          <>
            {urlState.view === 'map' && (
              <div className="relative">
                <div className="h-[650px]">
                  <PlaqueMap
                    ref={mapRef}
                    plaques={allPlaques}
                    onPlaqueClick={handlePlaqueClick}
                    favorites={favorites}
                    selectedPlaqueId={selectedPlaque?.id}
                    maintainView={true}
                    className="h-full w-full"
                    isRoutingMode={isRoutingMode}
                    setIsRoutingMode={setIsRoutingMode}
                    routePoints={routePoints}
                    addPlaqueToRoute={handleAddPlaqueToRoute}
removePlaqueFromRoute={handleRemovePlaqueFromRoute}
                   clearRoute={handleClearRoute}
                   exportRoute={() => {}}
                   saveRoute={() => {}}
                   moveRoutePointUp={() => {}}
                   moveRoutePointDown={() => {}}
                   onReorderRoute={() => {}}
                   useImperial={useImperial}
                   setUseImperial={setUseImperial}
                   isMobile={isMobile}
                   onDistanceFilterChange={handleDistanceFilterChange}
                   onLocationSet={handleLocationSet}
                   activeLocation={activeLocation}
                   distanceFilterActive={distanceFilterActive}
                   hideOutsidePlaques={distanceFilterVisible}
                   maxDistance={distanceFilterRadius}
                   filteredPlaques={filteredPlaques}
                 />
               </div>
               
               {/* Map overlay controls */}
               <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                 {/* Route Planning Button */}
                 <Button
                   variant={isRoutingMode ? "default" : "outline"}
                   size="sm"
                   onClick={handleToggleRoutingMode}
                   className={`shadow-lg ${isRoutingMode ? 'bg-green-600 hover:bg-green-700' : ''}`}
                 >
                   <MapPin size={16} className="mr-1" />
                   {isRoutingMode ? 'Exit Route' : 'Plan Route'}
                 </Button>
                 
                 {/* Route Controls */}
                 {isRoutingMode && routePoints.length > 0 && (
                   <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
                     <div className="flex justify-between items-center mb-2">
                       <span className="font-medium text-sm">Route ({routePoints.length} stops)</span>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={handleClearRoute}
                         className="h-6 w-6 p-0"
                       >
                         <X size={12} />
                       </Button>
                     </div>
                     <div className="text-xs text-gray-600 mb-2">
                       Distance: {formatDistance(routeDistance)}<br/>
                       Walking time: {formatWalkingTime(routeDistance)}
                     </div>
                     {routePoints.length >= 2 && (
                       <Button
                         size="sm"
                         className="w-full text-xs"
                         onClick={async () => {
                           try {
                             const routeData = {
                               name: `Route - ${new Date().toLocaleDateString()}`,
                               plaques: routePoints.map(p => p.id),
                               distance: routeDistance,
                               created: new Date().toISOString()
                             };
                             
                             await createRoute(routeData);
                             toast.success("Route saved successfully!");
                             navigate('/routes');
                           } catch (error) {
                             toast.error("Failed to save route");
                             console.error("Error saving route:", error);
                           }
                         }}
                       >
                         Save Route
                       </Button>
                     )}
                   </div>
                 )}
               </div>
             </div>
           )}
           
           {urlState.view === 'grid' && (
             <>
               {filteredPlaques.length === 0 ? (
                 <EmptyState
                   title="No plaques found"
                   description={
                     activeFiltersCount > 0 
                       ? "Try adjusting your filters to see more results."
                       : urlState.search.trim()
                       ? "Try different search terms or browse all plaques."
                       : "No plaques are available at the moment."
                   }
                   actionButton={
                     activeFiltersCount > 0 ? (
                       <Button variant="outline" onClick={handleResetFilters}>
                         Clear Filters
                       </Button>
                     ) : urlState.search.trim() ? (
                       <Button variant="outline" onClick={() => setSearch('')}>
                         Clear Search
                       </Button>
                     ) : null
                   }
                 />
               ) : (
                 <>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {sortedAndPaginatedPlaques.map((plaque) => (
                       <PlaqueCard
                         key={plaque.id}
                         plaque={plaque}
                         isFavorite={isFavorite(plaque.id)}
                         onFavoriteToggle={handleFavoriteToggle}
                         onPlaqueClick={handlePlaqueClick}
                         isVisited={isPlaqueVisited(plaque.id)}
                         onMarkVisited={handleMarkVisited}
                         showDistance={distanceFilterActive && activeLocation}
                         distance={distanceFilterActive && activeLocation ? getDistanceFromActiveLocation(plaque) : 0}
                         formatDistance={formatDistance}
                         isInRoute={isRoutingMode && routePoints.some(p => p.id === plaque.id)}
                         onAddToRoute={isRoutingMode ? () => handleAddPlaqueToRoute(plaque) : undefined}
                         onRemoveFromRoute={isRoutingMode ? () => handleRemovePlaqueFromRoute(plaque.id) : undefined}
                         routeIndex={isRoutingMode ? routePoints.findIndex(p => p.id === plaque.id) + 1 : 0}
                       />
                     ))}
                   </div>
                   
                   {totalPages > 1 && (
                     <div className="mt-8">
                       <Pagination
                         currentPage={currentPage}
                         totalPages={totalPages}
                         onPageChange={handlePageChange}
                       />
                     </div>
                   )}
                 </>
               )}
             </>
           )}
           
           {urlState.view === 'list' && (
             <>
               {filteredPlaques.length === 0 ? (
                 <EmptyState
                   title="No plaques found"
                   description={
                     activeFiltersCount > 0 
                       ? "Try adjusting your filters to see more results."
                       : urlState.search.trim()
                       ? "Try different search terms or browse all plaques."
                       : "No plaques are available at the moment."
                   }
                   actionButton={
                     activeFiltersCount > 0 ? (
                       <Button variant="outline" onClick={handleResetFilters}>
                         Clear Filters
                       </Button>
                     ) : urlState.search.trim() ? (
                       <Button variant="outline" onClick={() => setSearch('')}>
                         Clear Search
                       </Button>
                     ) : null
                   }
                 />
               ) : (
                 <>
                   <div className="space-y-4">
                     {sortedAndPaginatedPlaques.map((plaque) => (
                       <PlaqueListItem
                         key={plaque.id}
                         plaque={plaque}
                         isFavorite={isFavorite(plaque.id)}
                         onFavoriteToggle={handleFavoriteToggle}
                         onPlaqueClick={handlePlaqueClick}
                         isVisited={isPlaqueVisited(plaque.id)}
                         onMarkVisited={handleMarkVisited}
                         showDistance={distanceFilterActive && activeLocation}
                         distance={distanceFilterActive && activeLocation ? getDistanceFromActiveLocation(plaque) : 0}
                         formatDistance={formatDistance}
                         isInRoute={isRoutingMode && routePoints.some(p => p.id === plaque.id)}
                         onAddToRoute={isRoutingMode ? () => handleAddPlaqueToRoute(plaque) : undefined}
                         onRemoveFromRoute={isRoutingMode ? () => handleRemovePlaqueFromRoute(plaque.id) : undefined}
                         routeIndex={isRoutingMode ? routePoints.findIndex(p => p.id === plaque.id) + 1 : 0}
                       />
                     ))}
                   </div>
                   
                   {totalPages > 1 && (
                     <div className="mt-8">
                       <Pagination
                         currentPage={currentPage}
                         totalPages={totalPages}
                         onPageChange={handlePageChange}
                       />
                     </div>
                   )}
                 </>
               )}
             </>
           )}
         </>
       )}
     </div>
     
{/* Filter Dialog - FIXED: Match prop names exactly */}
<DiscoverFilterDialog
  isOpen={filtersOpen}
  onClose={() => setFiltersOpen(false)}
  
  postcodes={postcodeOptions}
  selectedPostcodes={urlState.postcodes}
  onPostcodesChange={(values) => setFilters({ postcodes: values })}
  
  colors={colorOptions}
  selectedColors={urlState.colors}
  onColorsChange={(values) => setFilters({ colors: values })}
  
  professions={professionOptions}
  selectedProfessions={urlState.professions}
  onProfessionsChange={(values) => setFilters({ professions: values })}
  
  onlyVisited={urlState.onlyVisited}
  onVisitedChange={(value) => setFilters({ onlyVisited: value })}
  
  onlyFavorites={urlState.onlyFavorites}
  onFavoritesChange={(value) => setFilters({ onlyFavorites: value })}
  
  onApply={() => setFiltersOpen(false)}
  onReset={handleResetFilters}
/>
     
     {/* Plaque Detail Modal */}
     {selectedPlaque && (
       <PlaqueDetail
         plaque={selectedPlaque}
         isFavorite={isFavorite(selectedPlaque.id)}
         onFavoriteToggle={handleFavoriteToggle}
         onClose={handleCloseDetail}
         isVisited={isPlaqueVisited(selectedPlaque.id)}
         onMarkVisited={handleMarkVisited}
         nearbyPlaques={getNearbyPlaques(selectedPlaque)}
         onNearbyPlaqueClick={handlePlaqueClick}
         showDistance={distanceFilterActive && activeLocation}
         distance={distanceFilterActive && activeLocation ? getDistanceFromActiveLocation(selectedPlaque) : 0}
         formatDistance={formatDistance}
         formatWalkingTime={formatWalkingTime}
         isInRoute={isRoutingMode && routePoints.some(p => p.id === selectedPlaque.id)}
         onAddToRoute={isRoutingMode ? () => handleAddPlaqueToRoute(selectedPlaque) : undefined}
         onRemoveFromRoute={isRoutingMode ? () => handleRemovePlaqueFromRoute(selectedPlaque.id) : undefined}
         routeIndex={isRoutingMode ? routePoints.findIndex(p => p.id === selectedPlaque.id) + 1 : 0}
       />
     )}
   </PageContainer>
 );
};

export default Discover;