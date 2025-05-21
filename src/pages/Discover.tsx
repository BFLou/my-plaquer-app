// src/pages/Discover.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Search, Filter, X, Map, Grid, List, Navigation,
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
import { useFavorites } from '@/hooks/useFavorites'; // Add this import
import '../styles/map-styles.css';

// Import our new filter components
import DiscoverFilterDialog from '../components/plaques/DiscoverFilterDialog';
import ActiveFiltersDisplay from '../components/plaques/ActiveFiltersDisplay';

// Define types
export type ViewMode = 'grid' | 'list' | 'map';
type FilterOption = {
  label: string;
  value: string;
  color?: string;
  count?: number;
};

const Discover = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mapRef = useRef(null);
  
  // State
  const [allPlaques, setAllPlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map'); // Default to map view
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  // Remove the favorites state
  // const [favorites, setFavorites] = useState([]);
  // Replace with the useFavorites hook
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maintainMapView, setMaintainMapView] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeDistance, setRouteDistance] = useState(0);
  const [useImperial, setUseImperial] = useState(false);
  const [useRoadRouting, setUseRoadRouting] = useState(true);

  // Pagination state (for list/grid views)
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

  // Filter options - will be populated dynamically from data
  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [professionOptions, setProfessionOptions] = useState([]);

  // Initialize state from URL params on first load
  useEffect(() => {
    const view = searchParams.get('view');
    if (view && (view === 'grid' || view === 'list' || view === 'map')) {
      setViewMode(view);
    }
    
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
    
    const postcodesParam = searchParams.get('postcodes');
    if (postcodesParam) {
      setSelectedPostcodes(postcodesParam.split(','));
    }
    
    const colorsParam = searchParams.get('colors');
    if (colorsParam) {
      setSelectedColors(colorsParam.split(','));
    }
    
    const professionsParam = searchParams.get('professions');
    if (professionsParam) {
      setSelectedProfessions(professionsParam.split(','));
    }
    
    const visited = searchParams.get('visited');
    if (visited === 'true') {
      setOnlyVisited(true);
    }
    
    const favs = searchParams.get('favorites');
    if (favs === 'true') {
      setOnlyFavorites(true);
    }
    
    const page = searchParams.get('page');
    if (page) {
      setCurrentPage(parseInt(page, 10));
    }
  }, []);

  // Load plaque data and generate filter options
  useEffect(() => {
    try {
      setLoading(true);
      
      // Use imported data
      const adaptedData = adaptPlaquesData(plaqueData);
      setAllPlaques(adaptedData);
      
      // Extract unique postcodes with counts
      const postcodeCount = {};
      adaptedData.forEach(plaque => {
        if (plaque.postcode && plaque.postcode !== "Unknown") {
          postcodeCount[plaque.postcode] = (postcodeCount[plaque.postcode] || 0) + 1;
        }
      });
      
      const postcodes = Object.entries(postcodeCount)
        .map(([value, count]) => ({
          label: value,
          value,
          count
        }))
        .sort((a, b) => b.count - a.count);
      
      setPostcodeOptions(postcodes);
      
      // Extract unique colors with counts
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
      
      // Extract unique professions with counts
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

  // Apply filters to get filtered plaques
  const filteredPlaques = useMemo(() => {
    return allPlaques.filter((plaque) => {
      // Match search query
      const matchesSearch = !searchQuery.trim() || 
        (plaque.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.inscription?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.address?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.location?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (plaque.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Match postcode (any selected, or all if none selected)
      const matchesPostcode = selectedPostcodes.length === 0 || 
        (plaque.postcode && selectedPostcodes.includes(plaque.postcode));
      
      // Match color (any selected, or all if none selected)
      const matchesColor = selectedColors.length === 0 || 
        (plaque.color && selectedColors.includes(plaque.color.toLowerCase()));
      
      // Match profession (any selected, or all if none selected)
      const matchesProfession = selectedProfessions.length === 0 || 
        (plaque.profession && selectedProfessions.includes(plaque.profession));
      
      // Match visited status - Use isPlaqueVisited hook
      const matchesVisited = !onlyVisited || plaque.visited || isPlaqueVisited(plaque.id);
      
      // Match favorite status - Now use isFavorite from the hook
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

  // Calculate total active filters
  const activeFiltersCount = 
    selectedPostcodes.length + 
    selectedColors.length + 
    selectedProfessions.length + 
    (onlyVisited ? 1 : 0) + 
    (onlyFavorites ? 1 : 0);

  // Sort and paginate plaques (for list/grid views)
  const sortedAndPaginatedPlaques = useMemo(() => {
    // Sort plaques
    const sorted = [...filteredPlaques].sort((a, b) => {
      if (sortOption === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sortOption === 'z-a') return (b.title || '').localeCompare(a.title || '');
      return b.id - a.id; // Default to newest
    });
    
    // Calculate total pages
    const total = Math.ceil(sorted.length / itemsPerPage);
    setTotalPages(total);
    
    // Adjust current page if needed
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
    
    // Get current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [filteredPlaques, sortOption, currentPage, itemsPerPage]);

  // Update URL when filters, sort, or page change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (viewMode !== 'list') { // Default view is list
      params.set('view', viewMode);
    }
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    if (selectedPostcodes.length > 0) {
      params.set('postcodes', selectedPostcodes.join(','));
    }
    
    if (selectedColors.length > 0) {
      params.set('colors', selectedColors.join(','));
    }
    
    if (selectedProfessions.length > 0) {
      params.set('professions', selectedProfessions.join(','));
    }
    
    if (onlyVisited) {
      params.set('visited', 'true');
    }
    
    if (onlyFavorites) {
      params.set('favorites', 'true');
    }
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [
    viewMode, 
    searchQuery, 
    selectedPostcodes, 
    selectedColors, 
    selectedProfessions, 
    onlyVisited, 
    onlyFavorites, 
    currentPage, 
    navigate, 
    location.pathname
  ]);

  // Handler functions
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Updated to use the hook's toggleFavorite
  const handleFavoriteToggle = (id) => {
    toggleFavorite(id);
    // No need for toast here as the hook handles it
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
      
      // Update local state for immediate UI feedback
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
    setCurrentPage(1); // Reset to first page when applying filters
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

  const handleRemovePostcode = (value) => {
    setSelectedPostcodes(prev => prev.filter(item => item !== value));
  };

  const handleRemoveColor = (value) => {
    setSelectedColors(prev => prev.filter(item => item !== value));
  };

  const handleRemoveProfession = (value) => {
    setSelectedProfessions(prev => prev.filter(item => item !== value));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Find nearby plaques for the detail view
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
      {/* View Mode Selection Tabs - Now prominently featured at the top */}
      <div className="bg-white border-b border-gray-200 sticky top-[61px] z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Left side: View Mode Tabs */}
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
            
            {/* Right side: Search and Filter */}
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
            
            onRemoveColor={handleRemoveColor}
            onRemovePostcode={handleRemovePostcode}
            onRemoveProfession={handleRemoveProfession}
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
              </>
            )}
          </h2>
          
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
          // Loading states for different view modes
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
                    addPlaqueToRoute={(plaque) => {
                      if (routePoints.some(p => p.id === plaque.id)) {
                        toast.info("This plaque is already in your route.");
                        return;
                      }
                      
                      setMaintainMapView(true);
                      setRoutePoints(prev => [...prev, plaque]);
                      
                      toast.success(`Added "${plaque.title}" to route (${routePoints.length + 1} stops)`);
                    }}
                    removePlaqueFromRoute={(plaqueId) => {
                      setRoutePoints(prev => prev.filter(p => p.id !== plaqueId));
                      toast.info("Removed plaque from route");
                    }}
                    clearRoute={() => {
                      setRoutePoints([]);
                    }}
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
        onAddToRoute={(plaque) => {
          if (routePoints.some(p => p.id === plaque.id)) {
            toast.info("This plaque is already in your route.");
            return;
          }
          
          setMaintainMapView(true);
          setRoutePoints(prev => [...prev, plaque]);
          toast.success(`Added "${plaque.title}" to route (${routePoints.length + 1} stops)`);
        }}
        variant="discover"
        className="h-full"
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
        onAddToRoute={(plaque) => {
          if (routePoints.some(p => p.id === plaque.id)) {
            toast.info("This plaque is already in your route.");
            return;
          }
          
          setMaintainMapView(true);
          setRoutePoints(prev => [...prev, plaque]);
          toast.success(`Added "${plaque.title}" to route (${routePoints.length + 1} stops)`);
        }}
        variant="discover"
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