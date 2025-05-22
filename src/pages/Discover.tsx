// src/pages/Discover.tsx - Enhanced route functionality
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Search, Filter, X, Map, Grid, List, Navigation, Badge,
  Route as RouteIcon, MapPin
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
import ActiveFiltersDisplay from '../components/plaques/ActiveFiltersDisplay';

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
  const [useRoadRouting, setUseRoadRouting] = useState(true);

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

  // Filter options
  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [professionOptions, setProfessionOptions] = useState([]);

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

 // src/pages/Discover.tsx - Enhanced route functionality (continued)

  const handleAddPlaqueToRoute = useCallback((plaque) => {
    // Check if plaque is already in route
    if (routePoints.some(p => p.id === plaque.id)) {
      toast.info(`"${plaque.title}" is already in your route.`);
      return;
    }
    
    // Add plaque to route
    setRoutePoints(prev => {
      const newRoute = [...prev, plaque];
      
      // Show appropriate message based on route length
      if (newRoute.length === 1) {
        toast.success(`Added "${plaque.title}" as your starting point.`);
      } else if (newRoute.length === 2) {
        toast.success(`Added "${plaque.title}" - you now have a route with ${newRoute.length} stops!`);
      } else {
        toast.success(`Added "${plaque.title}" (${newRoute.length} stops total)`);
      }
      
      return newRoute;
    });
    
    // Maintain map view when adding points
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

  const handleOptimizeRoute = useCallback(() => {
    if (routePoints.length < 3) {
      toast.info("Need at least 3 stops to optimize route");
      return;
    }
    
    // Simple nearest-neighbor optimization
    const start = routePoints[0];
    const end = routePoints[routePoints.length - 1];
    const middle = [...routePoints.slice(1, -1)];
    
    const optimized = [start];
    let current = start;
    
    while (middle.length > 0) {
      let bestIndex = 0;
      let bestDistance = Infinity;
      
      for (let i = 0; i < middle.length; i++) {
        const point = middle[i];
        if (!current.latitude || !current.longitude || !point.latitude || !point.longitude) continue;
        
        const distance = calculateDistance(
          parseFloat(current.latitude as string),
          parseFloat(current.longitude as string),
          parseFloat(point.latitude as string),
          parseFloat(point.longitude as string)
        );
        
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }
      
      const nearest = middle.splice(bestIndex, 1)[0];
      optimized.push(nearest);
      current = nearest;
    }
    
    optimized.push(end);
    setRoutePoints(optimized);
    toast.success("Route optimized for walking distance!");
  }, [routePoints]);

  const handleMoveRoutePointUp = useCallback((index) => {
    if (index <= 0) return;
    
    setRoutePoints(prev => {
      const newRoute = [...prev];
      [newRoute[index], newRoute[index - 1]] = [newRoute[index - 1], newRoute[index]];
      return newRoute;
    });
  }, []);

  const handleMoveRoutePointDown = useCallback((index) => {
    setRoutePoints(prev => {
      if (index >= prev.length - 1) return prev;
      
      const newRoute = [...prev];
      [newRoute[index], newRoute[index + 1]] = [newRoute[index + 1], newRoute[index]];
      return newRoute;
    });
  }, []);

  const handleExportRoute = useCallback(() => {
    if (routePoints.length < 2) {
      toast.error("Need at least 2 points to export");
      return;
    }
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const start = routePoints[i];
      const end = routePoints[i + 1];
      
      if (start.latitude && start.longitude && end.latitude && end.longitude) {
        const startLat = parseFloat(start.latitude as string);
        const startLng = parseFloat(start.longitude as string);
        const endLat = parseFloat(end.latitude as string);
        const endLng = parseFloat(end.longitude as string);
        
        if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
          totalDistance += calculateDistance(startLat, startLng, endLat, endLng);
        }
      }
    }
    
    const formatDistance = (km) => {
      if (useImperial) {
        const miles = km * 0.621371;
        return `${miles.toFixed(1)} mi`;
      }
      return `${km.toFixed(1)} km`;
    };
    
    const formatWalkingTime = (km) => {
      const minutes = useImperial 
        ? Math.round(km * 0.621371 * 20) // 20 minutes per mile
        : Math.round(km * 12); // 12 minutes per km
      
      if (minutes < 60) {
        return `${minutes} min`;
      }
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    };
    
    // Generate GPX content
    const waypoints = routePoints.map((point, index) => `
    <wpt lat="${point.latitude}" lon="${point.longitude}">
      <name>${point.title || `Stop ${index + 1}`}</name>
      <desc>${point.description || point.inscription || ''}</desc>
    </wpt>`).join('');
    
    const gpxContent = `<?xml version="1.0"?>
<gpx version="1.1" creator="Plaquer App">
  <metadata>
    <name>Walking Route</name>
    <desc>Route with ${routePoints.length} stops - ${formatDistance(totalDistance)} - ${formatWalkingTime(totalDistance)}</desc>
  </metadata>
  ${waypoints}
</gpx>`;
    
    // Download the file
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plaque-route-${Date.now()}.gpx`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Route exported as GPX file");
  }, [routePoints, useImperial]);

  const handleReorderRoute = useCallback((startIndex: number, endIndex: number) => {
  setRoutePoints(prev => {
    const newRoute = [...prev];
    const [removed] = newRoute.splice(startIndex, 1);
    newRoute.splice(endIndex, 0, removed);
    toast.success("Route reordered");
    return newRoute;
  });
}, []);


const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);



  const handleSaveRoute = useCallback(async (routeData) => {
    try {
      const savedRoute = await createRoute(
        routeData.name,
        routePoints,
        routeDistance,
        routeData.description,
        false // Private by default
      );
      
      if (savedRoute) {
        toast.success("Route saved successfully!");
        // Optionally navigate to the saved route
        // navigate(`/library/routes/${savedRoute.id}`);
      }
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route");
    }
  }, [routePoints, routeDistance, createRoute]);

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
    
    // ... other URL param initialization
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
      
      // Similar for colors and professions...
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

  // Apply filters
  const filteredPlaques = useMemo(() => {
    return allPlaques.filter((plaque) => {
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
    isFavorite
  ]);

  // Calculate active filters count
  const activeFiltersCount = 
    selectedPostcodes.length + 
    selectedColors.length + 
    selectedProfessions.length + 
    (onlyVisited ? 1 : 0) + 
    (onlyFavorites ? 1 : 0);

  // Sort and paginate plaques
  const sortedAndPaginatedPlaques = useMemo(() => {
    const sorted = [...filteredPlaques].sort((a, b) => {
      if (sortOption === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sortOption === 'z-a') return (b.title || '').localeCompare(a.title || '');
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
  }, [filteredPlaques, sortOption, currentPage, itemsPerPage]);

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

  const handleResetFilters = () => {
    setSelectedPostcodes([]);
    setSelectedColors([]);
    setSelectedProfessions([]);
    setOnlyVisited(false);
    setOnlyFavorites(false);
    setCurrentPage(1);
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
      
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="container mx-auto px-4 mt-3">
          <ActiveFiltersDisplay
            selectedColors={selectedColors}
            selectedPostcodes={selectedPostcodes}
            selectedProfessions={selectedProfessions}
            onlyVisited={onlyVisited}
            onlyFavorites={onlyFavorites}
            
            colorOptions={colorOptions}
            postcodeOptions={postcodeOptions}
            professionOptions={professionOptions}
            
            onRemoveColor={(value) => setSelectedColors(prev => prev.filter(item => item !== value))}
            onRemovePostcode={(value) => setSelectedPostcodes(prev => prev.filter(item => item !== value))}
            onRemoveProfession={(value) => setSelectedProfessions(prev => prev.filter(item => item !== value))}
            onRemoveVisited={() => setOnlyVisited(false)}
            onRemoveFavorite={() => setOnlyFavorites(false)}
            onClearAll={handleResetFilters}
          />
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
        {isRoutingMode && routePoints.length > 0 && (
          <span className="ml-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Route: {routePoints.length} stops • {formatDistance(totalDistance)} • {formatWalkingTime(totalDistance)}
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
        ) : filteredPlaques.length > 0 ? (
          <>
{viewMode === 'map' && (
  <div className="relative">
    <div className="h-[650px]">
      <PlaqueMap
        ref={mapRef}
        plaques={filteredPlaques}
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
        exportRoute={handleExportRoute}
        saveRoute={handleSaveRoute}
        moveRoutePointUp={handleMoveRoutePointUp}
        moveRoutePointDown={handleMoveRoutePointDown}
        onReorderRoute={handleReorderRoute}
        useImperial={useImperial}
        setUseImperial={setUseImperial}
        isMobile={isMobile}
      />
    </div>
  </div>
)}

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
        ) : (
          <EmptyState
            icon={MapPin}
            title="No plaques found"
            description="Try adjusting your filters or search criteria"
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        )}
      </div>

      {/* Filter Dialog */}
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
      />
    </PageContainer>
  );
};

export default Discover;