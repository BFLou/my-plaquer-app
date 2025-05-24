// src/pages/Discover.tsx - Fixed map view persistence and empty state issues
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Search, Filter, X, Map, Grid, List, Navigation, Badge,
  Route as RouteIcon, MapPin, Target, Crosshair
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
import '../styles/map-styles.css';

// Import filter components
import DiscoverFilterDialog from '../components/plaques/DiscoverFilterDialog';

export type ViewMode = 'grid' | 'list' | 'map';

const Discover = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mapRef = useRef(null);
  
  // State
  const [allPlaques, setAllPlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maintainMapView, setMaintainMapView] = useState(false);
  
  // Enhanced Route State
  const [routePoints, setRoutePoints] = useState([]);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeDistance, setRouteDistance] = useState(0);
  const [useImperial, setUseImperial] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const { isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  const { createRoute } = useRoutes();
  
  // Filter states
  const [selectedPostcodes, setSelectedPostcodes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedProfessions, setSelectedProfessions] = useState([]);
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Distance filter states
  const [activeLocation, setActiveLocation] = useState(null);
  const [distanceFilterActive, setDistanceFilterActive] = useState(false);
  const [maxDistance, setMaxDistance] = useState(1); // km
  const [hideOutsidePlaques, setHideOutsidePlaques] = useState(false);

  // Filter options
  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [professionOptions, setProfessionOptions] = useState([]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper function to calculate distance between two points
  const getDistanceFromActiveLocation = useCallback((plaque) => {
    if (!activeLocation || !plaque.latitude || !plaque.longitude) return Infinity;
    
    const lat = parseFloat(plaque.latitude);
    const lng = parseFloat(plaque.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return Infinity;
    
    return calculateDistance(activeLocation[0], activeLocation[1], lat, lng);
  }, [activeLocation]);

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

  // FIXED: Add this effect to handle map restoration when switching to map view
// FIXED: Enhanced map restoration when switching to map view
useEffect(() => {
  if (viewMode === 'map' && mapRef.current) {
    console.log('Discover: Switching to map view, checking restoration...', { 
      activeLocation, 
      distanceFilterActive, 
      hideOutsidePlaques,
      maxDistance
    });
    
    // Only restore if we have an active location and distance filtering is enabled
    if (activeLocation && distanceFilterActive) {
      // Give the map time to fully render, then restore
      const timer = setTimeout(() => {
        console.log('Discover: Attempting to restore distance circle...');
        
        if (mapRef.current && mapRef.current.restoreDistanceCircle) {
          mapRef.current.restoreDistanceCircle();
        } else {
          console.warn('Map ref or restoreDistanceCircle method not available');
        }
      }, 600); // Increased timeout to ensure map is fully loaded
      
      return () => clearTimeout(timer);
    } else {
      console.log('Discover: Not restoring - missing conditions', {
        hasActiveLocation: !!activeLocation,
        isDistanceFilterActive: distanceFilterActive
      });
    }
  }
}, [viewMode, activeLocation, distanceFilterActive, hideOutsidePlaques, maxDistance]);


// FIXED: Additional effect to handle distance circle restoration when filter state changes
useEffect(() => {
  if (viewMode === 'map' && mapRef.current && activeLocation && distanceFilterActive && hideOutsidePlaques) {
    console.log('Discover: Distance filter state changed, restoring circle...');
    
    const timer = setTimeout(() => {
      if (mapRef.current && mapRef.current.restoreDistanceCircle) {
        mapRef.current.restoreDistanceCircle();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }
}, [viewMode, activeLocation, distanceFilterActive, hideOutsidePlaques, maxDistance]);

  // Initialize state from URL params
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && (view === 'grid' || view === 'list' || view === 'map')) {
      setViewMode(view);
    }
    
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  // Load plaque data
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
  }, []);

  // Enhanced filter logic that includes distance filtering
  const filteredPlaques = useMemo(() => {
    let filtered = allPlaques.filter((plaque) => {
      // Standard filters
      const matchesSearch = !searchQuery.trim() || 
        (plaque.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.inscription?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.address?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.location?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPostcode = selectedPostcodes.length === 0 || 
        (plaque.postcode && selectedPostcodes.includes(plaque.postcode));
      
      const matchesColor = selectedColors.length === 0 || 
        (plaque.color && selectedColors.includes(plaque.color.toLowerCase()));
      
      const matchesProfession = selectedProfessions.length === 0 || 
        (plaque.profession && selectedProfessions.includes(plaque.profession));
      
      const matchesVisited = !onlyVisited || plaque.visited || isPlaqueVisited(plaque.id);
      const matchesFavorite = !onlyFavorites || isFavorite(plaque.id);

      return matchesSearch && 
             matchesPostcode && 
             matchesColor && 
             matchesProfession && 
             matchesVisited && 
             matchesFavorite;
    });

    // Apply distance filter if active
    if (distanceFilterActive && activeLocation && hideOutsidePlaques) {
      filtered = filtered.filter(plaque => {
        const distance = getDistanceFromActiveLocation(plaque);
        return distance <= maxDistance;
      });
    }

    return filtered;
  }, [
    allPlaques, 
    searchQuery, 
    selectedPostcodes, 
    selectedColors, 
    selectedProfessions, 
    onlyVisited, 
    onlyFavorites, 
    favorites, 
    isPlaqueVisited,
    isFavorite,
    distanceFilterActive,
    activeLocation,
    hideOutsidePlaques,
    maxDistance,
    getDistanceFromActiveLocation
  ]);

  // Calculate active filters count (including distance filter)
  const activeFiltersCount = 
    selectedPostcodes.length + 
    selectedColors.length + 
    selectedProfessions.length + 
    (onlyVisited ? 1 : 0) + 
    (onlyFavorites ? 1 : 0) +
    (distanceFilterActive && hideOutsidePlaques ? 1 : 0); // Include distance filter

  // Sort and paginate plaques
  const sortedAndPaginatedPlaques = useMemo(() => {
    const sorted = [...filteredPlaques].sort((a, b) => {
      if (sortOption === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sortOption === 'z-a') return (b.title || '').localeCompare(a.title || '');
      if (sortOption === 'distance' && distanceFilterActive && activeLocation) {
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
  }, [filteredPlaques, sortOption, currentPage, itemsPerPage, distanceFilterActive, activeLocation, getDistanceFromActiveLocation]);

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
    
    setMaintainMapView(true);
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

  // FIXED: Update the distance filter change handler
// FIXED: Update the distance filter change handler with debouncing
const handleDistanceFilterChange = useCallback((newDistance, hideOutside) => {
  console.log('Discover: Distance filter change:', { newDistance, hideOutside, activeLocation });
  
  setMaxDistance(newDistance);
  setHideOutsidePlaques(hideOutside);
  
  // Debounce map updates to prevent excessive re-rendering
  const updateMapFilter = () => {
    if (viewMode === 'map' && mapRef.current && mapRef.current.restoreDistanceCircle) {
      mapRef.current.restoreDistanceCircle();
    }
  };
  
  // Clear any existing timeout
  if (window.mapFilterTimeout) {
    clearTimeout(window.mapFilterTimeout);
  }
  
  // Set new timeout for map update
  window.mapFilterTimeout = setTimeout(updateMapFilter, 150);
  
  if (hideOutside && activeLocation) {
    const count = allPlaques.filter(plaque => {
      const distance = getDistanceFromActiveLocation(plaque);
      return distance <= newDistance;
    }).length;
    
    console.log(`Distance filter: showing ${count} of ${allPlaques.length} plaques within ${formatDistance(newDistance)}`);
  }
}, [activeLocation, allPlaques, getDistanceFromActiveLocation, formatDistance, viewMode]);

// FIXED: Update the location set handler with debouncing
const handleLocationSet = useCallback((location) => {
  console.log('Discover: Location set:', location);
  
  // Only update if location actually changed
  if (activeLocation && 
      activeLocation[0] === location[0] && 
      activeLocation[1] === location[1]) {
    return; // Location hasn't changed, skip update
  }
  
  setActiveLocation(location);
  setDistanceFilterActive(true);
  toast.success("Location set! Distance filter is now available.");
  
  // If we're switching back to map view, make sure it restores properly
  if (viewMode === 'map' && mapRef.current) {
    // Debounce the restoration
    if (window.locationSetTimeout) {
      clearTimeout(window.locationSetTimeout);
    }
    
    window.locationSetTimeout = setTimeout(() => {
      if (mapRef.current && mapRef.current.restoreDistanceCircle) {
        mapRef.current.restoreDistanceCircle();
      }
    }, 300);
  }
}, [viewMode, activeLocation]);

  // Handler functions
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleFavoriteToggle = (id) => {
    toggleFavorite(id);
  };

  const handlePlaqueClick = (plaque) => {
    setMaintainMapView(true);
    setSelectedPlaque(plaque);
  };

  const handleCloseDetail = () => {
    setSelectedPlaque(null);
  };

  const handleMarkVisited = async (id) => {
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
  };

  // Filter actions
  const handleOpenFilters = () => {
    setFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  // FIXED: Update the reset filters function to properly clear state
// FIXED: Update the reset filters function to properly clear state
const handleResetFilters = () => {
  setSelectedPostcodes([]);
  setSelectedColors([]);
  setSelectedProfessions([]);
  setOnlyVisited(false);
  setOnlyFavorites(false);
  // Reset distance filter
  setDistanceFilterActive(false);
  setHideOutsidePlaques(false);
  setActiveLocation(null);
  setCurrentPage(1);
  
  // Clear map state if we're in map view
  if (viewMode === 'map' && mapRef.current && mapRef.current.resetFilters) {
    mapRef.current.resetFilters();
  }
  
  // Clear any pending timeouts
  if (window.mapFilterTimeout) {
    clearTimeout(window.mapFilterTimeout);
  }
  if (window.locationSetTimeout) {
    clearTimeout(window.locationSetTimeout);
  }
  if (window.restoreCircleTimeout) {
    clearTimeout(window.restoreCircleTimeout);
  }
};

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Find nearby plaques for detail view
  const getNearbyPlaques = (currentPlaque) => {
    return allPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  };

  return (
    <PageContainer 
      activePage="discover"
      hasFooter={viewMode !== 'map'}
      simplifiedFooter={true}
    >
      {/* View Mode Selection Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[61px] z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Tabs 
              value={viewMode} 
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 pr-9 w-full"
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
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
      
      {/* Enhanced Active Filters Display - now includes distance filter */}
      {activeFiltersCount > 0 && (
        <div className="container mx-auto px-4 mt-3">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {/* Color filters */}
            {selectedColors.map(color => (
              <Badge key={color} variant="secondary" className="gap-1">
                {capitalizeWords(color)}
                <button
                  onClick={() => setSelectedColors(prev => prev.filter(c => c !== color))}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
            
            {/* Postcode filters */}
            {selectedPostcodes.map(postcode => (
              <Badge key={postcode} variant="secondary" className="gap-1">
                {postcode}
                <button
                  onClick={() => setSelectedPostcodes(prev => prev.filter(p => p !== postcode))}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
            
            {/* Profession filters */}
            {selectedProfessions.map(profession => (
              <Badge key={profession} variant="secondary" className="gap-1">
                {capitalizeWords(profession)}
                <button
                  onClick={() => setSelectedProfessions(prev => prev.filter(p => p !== profession))}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
            
            {/* Visited filter */}
            {onlyVisited && (
              <Badge variant="secondary" className="gap-1">
                Visited Only
                <button
                  onClick={() => setOnlyVisited(false)}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </Badge>
            )}
            
            {/* Favorites filter */}
            {onlyFavorites && (
              <Badge variant="secondary" className="gap-1">
                Favorites Only
                <button
                  onClick={() => setOnlyFavorites(false)}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </Badge>
            )}
            
            {/* FIXED: Distance filter with new icon */}
            {distanceFilterActive && hideOutsidePlaques && (
              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
                <Crosshair size={12} />
                Within {formatDistance(maxDistance)}
                <button
                  onClick={() => {
                    setHideOutsidePlaques(false);
                    setDistanceFilterActive(false);
                  }}
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
                    {hideOutsidePlaques ? `within ${formatDistance(maxDistance)}` : `• ${formatDistance(maxDistance)} range active`}
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
          
          {/* Mobile route toggle button */}
          {isMobile && (
            <Button
              variant={isRoutingMode ? "default" : "outline"}
              size="sm"
              onClick={handleToggleRoutingMode}
              className="shrink-0"
            >
              <RouteIcon size={16} className="mr-1" />
              {isRoutingMode ? 'Exit Route' : 'Plan Route'}
            </Button>
          )}
              
          {viewMode !== 'map' && (
            <div className="flex items-center gap-2">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="text-sm border rounded-md py-1 px-2"
              >
                <option value="newest">Newest</option>
                <option value="a-z">A to Z</option>
                <option value="z-a">Z to A</option>
                {distanceFilterActive && activeLocation && (
                  <option value="distance">Distance</option>
                )}
              </select>
            </div>
          )}
        </div>
        
        {loading ? (
          // Loading states
          viewMode === 'map' ? (
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
            {viewMode === 'map' && (
              <div className="relative">
                <div className="h-[650px]">
                  <PlaqueMap
                    ref={mapRef}
                    plaques={allPlaques} // FIXED: Use all plaques - let map handle filtering internally
                    onPlaqueClick={handlePlaqueClick}
                    favorites={favorites}
                    selectedPlaqueId={selectedPlaque?.id}
                    maintainView={maintainMapView}
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
                    // Pass distance filter props to map
                    onLocationSet={handleLocationSet}
                    onDistanceFilterChange={handleDistanceFilterChange}
                    maxDistance={maxDistance}
                    hideOutsidePlaques={hideOutsidePlaques}
                    activeLocation={activeLocation} // Make sure this is passed!
                  />
                </div>
              </div>
            )}

            {/* FIXED: Show empty state only for grid/list views, not map */}
            {(viewMode === 'grid' || viewMode === 'list') && filteredPlaques.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No plaques found"
                description={
                  distanceFilterActive && hideOutsidePlaques 
                    ? `No plaques found within ${formatDistance(maxDistance)} of your location. Try increasing the distance or adjusting your filters.`
                    : "Try adjusting your filters or search criteria"
                }
                actionLabel="Reset Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedAndPaginatedPlaques.map((plaque) => (
                      <PlaqueCard 
                        key={plaque.id}
                        plaque={plaque}
                        onClick={handlePlaqueClick}
                        onAddToRoute={isRoutingMode ? handleAddPlaqueToRoute : undefined}
                        variant="discover"
                        className="h-full"
                        showRouteButton={isRoutingMode}
                        // Show distance if distance filter is active
                        showDistance={distanceFilterActive && activeLocation}
                        distance={distanceFilterActive && activeLocation ? getDistanceFromActiveLocation(plaque) : undefined}
                        formatDistance={formatDistance}
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {sortedAndPaginatedPlaques.map((plaque) => (
                      <PlaqueListItem 
                        key={plaque.id}
                        plaque={plaque}
                        onClick={handlePlaqueClick}
                        onAddToRoute={isRoutingMode ? handleAddPlaqueToRoute : undefined}
                        variant="discover"
                        showRouteButton={isRoutingMode}
                        // Show distance if distance filter is active
                        showDistance={distanceFilterActive && activeLocation}
                        distance={distanceFilterActive && activeLocation ? getDistanceFromActiveLocation(plaque) : undefined}
                        formatDistance={formatDistance}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination for grid and list views */}
                {viewMode !== 'map' && totalPages > 1 && (
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Enhanced Filter Dialog */}
      <DiscoverFilterDialog
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        
        postcodes={postcodeOptions}
        selectedPostcodes={selectedPostcodes}
        onPostcodesChange={setSelectedPostcodes}
        
        colors={colorOptions}
        selectedColors={selectedColors}
        onColorsChange={setSelectedColors}
        
        professions={professionOptions}
        selectedProfessions={selectedProfessions}
        onProfessionsChange={setSelectedProfessions}
        
        onlyVisited={onlyVisited}
        onVisitedChange={setOnlyVisited}
        
        onlyFavorites={onlyFavorites}
        onFavoritesChange={setOnlyFavorites}
        
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Plaque Detail */}
      <PlaqueDetail
        plaque={selectedPlaque}
        isOpen={!!selectedPlaque}
        onClose={handleCloseDetail}
        isFavorite={selectedPlaque ? isFavorite(selectedPlaque.id) : false}
        isVisited={selectedPlaque ? (selectedPlaque.visited || isPlaqueVisited(selectedPlaque.id)) : false}
        onFavoriteToggle={handleFavoriteToggle}
        onMarkVisited={() => selectedPlaque && handleMarkVisited(selectedPlaque.id)}
        nearbyPlaques={selectedPlaque ? getNearbyPlaques(selectedPlaque) : []}
        onSelectNearbyPlaque={handlePlaqueClick}
        // Show distance in detail if filter is active
        showDistance={distanceFilterActive && activeLocation && selectedPlaque}
        distance={distanceFilterActive && activeLocation && selectedPlaque ? getDistanceFromActiveLocation(selectedPlaque) : undefined}
        formatDistance={formatDistance}
      />
    </PageContainer>
  );
};

export default Discover;