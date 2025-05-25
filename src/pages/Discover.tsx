// src/pages/Discover.tsx - Complete simplified version
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from 'sonner';
import { capitalizeWords } from '@/utils/stringUtils';
import { adaptPlaquesData } from "@/utils/plaqueAdapter";
import plaqueData from '../data/plaque_data.json';
import { PageContainer } from "@/components";
import { PlaqueCard } from "@/components/plaques/PlaqueCard";
import { PlaqueListItem } from "@/components/plaques/PlaqueListItem";
import { PlaqueDetail } from "@/components/plaques/PlaqueDetail";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import Pagination from '@/components/plaques/Pagination';
import PlaqueMap from '../components/maps/PlaqueMap';
import CollapsibleRoutePanel from '../components/maps/controls/CollapsibleRoutePanel';
import DiscoverFilterDialog from '../components/plaques/DiscoverFilterDialog';

// Import hooks
import { useUrlState } from '../components/maps/hooks/useUrlState';
import { useMapState } from '../components/maps/hooks/useMapState';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { calculateDistance } from '../components/maps/utils/routeUtils';

// Import header component
import DiscoverHeader from '../components/discover/DiscoverHeader';
import '../styles/map-styles.css';

export type ViewMode = 'grid' | 'list' | 'map';

const Discover = () => {
  const mapRef = useRef(null);
  
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

  // Route management
  const handleAddPlaqueToRoute = useCallback((plaque) => {
    if (routePoints.some(p => p.id === plaque.id)) {
      toast.info(`"${plaque.title}" is already in your route.`);
      return;
    }
    
    setRoutePoints(prev => {
      const newRoute = [...prev, plaque];
      if (newRoute.length === 1) {
        toast.success(`Added "${plaque.title}" as your starting point.`);
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
  }, [isRoutingMode, handleClearRoute]);

  // Distance helper functions
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
      ? Math.round(distanceKm * 0.621371 * 20)
      : Math.round(distanceKm * 12);
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }, [useImperial]);

  // Paginated plaques
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredPlaques.length / itemsPerPage);
  const paginatedPlaques = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlaques.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlaques, currentPage, itemsPerPage]);

  // Get nearby plaques for detail view
  const getNearbyPlaques = useCallback((currentPlaque) => {
    return allPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  }, [allPlaques]);

  const renderContent = () => {
    if (loading) {
      return urlState.view === 'map' ? (
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
      );
    }

    if (urlState.view === 'map') {
      return (
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
              maxDistance={maxDistance}
              hideOutsidePlaques={hideOutsidePlaques}
            />
          </div>
          
          {/* Collapsible Route Panel */}
          {isRoutingMode && (
            <CollapsibleRoutePanel
              routePoints={routePoints}
              removePlaqueFromRoute={handleRemovePlaqueFromRoute}
              clearRoute={handleClearRoute}
              exportRoute={() => {}}
              useImperial={useImperial}
              setUseImperial={setUseImperial}
              onClose={() => setIsRoutingMode(false)}
              formatDistance={formatDistance}
              formatWalkingTime={formatWalkingTime}
              onSave={() => {}}
            />
          )}
        </div>
      );
    }

    if (filteredPlaques.length === 0) {
      return (
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
              <Button onClick={resetFilters} variant="outline">
                Clear Filters
              </Button>
            ) : urlState.search.trim() ? (
              <Button onClick={() => setSearch('')} variant="outline">
                Clear Search
              </Button>
            ) : null
          }
        />
      );
    }

    const commonProps = {
      showDistance: !!activeLocation,
      formatDistance,
      isInRoute: (plaque) => isRoutingMode && routePoints.some(p => p.id === plaque.id),
      onAddToRoute: isRoutingMode ? handleAddPlaqueToRoute : undefined,
      onRemoveFromRoute: isRoutingMode ? handleRemovePlaqueFromRoute : undefined,
      routeIndex: (plaque) => isRoutingMode ? routePoints.findIndex(p => p.id === plaque.id) + 1 : 0,
    };

    if (urlState.view === 'grid') {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPlaques.map((plaque) => (
              <PlaqueCard
                key={plaque.id}
                plaque={plaque}
                isFavorite={isFavorite(plaque.id)}
                onFavoriteToggle={handleFavoriteToggle}
                onPlaqueClick={handlePlaqueClick}
                isVisited={isPlaqueVisited(plaque.id)}
                onMarkVisited={handleMarkVisited}
                distance={activeLocation ? getDistanceFromActiveLocation(plaque) : 0}
                {...commonProps}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      );
    }

    if (urlState.view === 'list') {
      return (
        <>
          <div className="space-y-4">
            {paginatedPlaques.map((plaque) => (
              <PlaqueListItem
                key={plaque.id}
                plaque={plaque}
                isFavorite={isFavorite(plaque.id)}
                onFavoriteToggle={handleFavoriteToggle}
                onPlaqueClick={handlePlaqueClick}
                isVisited={isPlaqueVisited(plaque.id)}
                onMarkVisited={handleMarkVisited}
                distance={activeLocation ? getDistanceFromActiveLocation(plaque) : 0}
                {...commonProps}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      );
    }
  };

  return (
    <PageContainer 
      activePage="discover"
      hasFooter={urlState.view !== 'map'}
      simplifiedFooter={true}
    >
      {/* Header with view tabs and search */}
      <DiscoverHeader
        viewMode={urlState.view}
        onViewModeChange={setViewMode}
        searchValue={urlState.search}
        onSearchChange={setSearch}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={() => setFiltersOpen(true)}
      />
      
      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="container mx-auto px-4 mt-3">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {/* Color filters */}
            {urlState.colors.map(color => (
              <div key={color} className="inline-flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full border text-xs">
                {capitalizeWords(color)}
                <button
                  onClick={() => setFilters({ 
                    colors: urlState.colors.filter(c => c !== color) 
                  })}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Postcode filters */}
            {urlState.postcodes.map(postcode => (
              <div key={postcode} className="inline-flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full border text-xs">
                {postcode}
                <button
                  onClick={() => setFilters({ 
                    postcodes: urlState.postcodes.filter(p => p !== postcode) 
                  })}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Profession filters */}
            {urlState.professions.map(profession => (
              <div key={profession} className="inline-flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full border text-xs">
                {capitalizeWords(profession)}
                <button
                  onClick={() => setFilters({ 
                    professions: urlState.professions.filter(p => p !== profession) 
                  })}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Visited filter */}
            {urlState.onlyVisited && (
              <div className="inline-flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full border text-xs">
                Visited Only
                <button
                  onClick={() => setFilters({ onlyVisited: false })}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Favorites filter */}
            {urlState.onlyFavorites && (
              <div className="inline-flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full border text-xs">
                Favorites Only
                <button
                  onClick={() => setFilters({ onlyFavorites: false })}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Distance filter */}
            {activeLocation && hideOutsidePlaques && (
              <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200 text-xs">
                📍 Within {formatDistance(maxDistance)}
                <button
                  onClick={() => mapStateManager.clearDistanceFilter()}
                  className="ml-1 hover:bg-green-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Clear all button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-600 hover:text-gray-800 ml-auto"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
      
      {/* Status bar */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium text-gray-600">
            {loading ? "Loading plaques..." : (
              <>
                {filteredPlaques.length} {filteredPlaques.length === 1 ? 'Plaque' : 'Plaques'} found
                {activeLocation && (
                  <span className="ml-2 text-green-600">
                    {hideOutsidePlaques ? `within ${formatDistance(maxDistance)}` : `• ${formatDistance(maxDistance)} range active`}
                  </span>
                )}
                {isRoutingMode && routePoints.length > 0 && (
                  <span className="ml-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Route: {routePoints.length} stops
                    </span>
                  </span>
                )}
              </>
            )}
          </h2>
        </div>
        
        {/* Main Content */}
        {renderContent()}
      </div>
      
      {/* Filter Dialog */}
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
        onReset={resetFilters}
      />
      
      {/* Plaque Detail Modal */}
      {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque}
          isFavorite={isFavorite(selectedPlaque.id)}
          onFavoriteToggle={handleFavoriteToggle}
          onClose={() => setSelectedPlaque(null)}
          isVisited={isPlaqueVisited(selectedPlaque.id)}
          onMarkVisited={handleMarkVisited}
          nearbyPlaques={getNearbyPlaques(selectedPlaque)}
          onNearbyPlaqueClick={handlePlaqueClick}
          showDistance={!!activeLocation}
          distance={activeLocation ? getDistanceFromActiveLocation(selectedPlaque) : 0}
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