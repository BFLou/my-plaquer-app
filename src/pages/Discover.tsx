// src/pages/Discover.tsx - COMPLETE FIXED VERSION
import { useState, useEffect, useMemo, useCallback } from "react";
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
import DiscoverFilterDialog from '../components/plaques/DiscoverFilterDialog';
import DiscoverHeader from '../components/discover/DiscoverHeader';
import DiscoverFilters from '../components/discover/DiscoverFilters';
import { MapContainer } from '../components/maps/MapContainer';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { calculateDistance } from '../components/maps/utils/routeUtils';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export type ViewMode = 'grid' | 'list' | 'map';

// Distance filter state interface
interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

const Discover = () => {
  // URL state management
  const [searchParams, setSearchParams] = useSearchParams();
  
  // FIXED: Better URL state parsing with fallbacks and debugging
  const urlState = useMemo(() => {
    const state = {
      view: (searchParams.get('view') as ViewMode) || 'grid',
      search: searchParams.get('search') || '',
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
      postcodes: searchParams.get('postcodes')?.split(',').filter(Boolean) || [],
      professions: searchParams.get('professions')?.split(',').filter(Boolean) || [],
      onlyVisited: searchParams.get('visited') === 'true',
      onlyFavorites: searchParams.get('favorites') === 'true',
    };
    
    console.log('URL State parsed:', state);
    return state;
  }, [searchParams]);

  // FIXED: Optimized URL state update function with correct parameter names
  const updateUrlState = useCallback((updates: Partial<typeof urlState>) => {
    const newParams = new URLSearchParams(searchParams);
    
    const newState = { ...urlState, ...updates };
    
    // Map internal state to URL parameters
    const urlMapping = {
      view: 'view',
      search: 'search', 
      colors: 'colors',
      postcodes: 'postcodes',
      professions: 'professions',
      onlyVisited: 'visited',      // Map onlyVisited to 'visited' URL param
      onlyFavorites: 'favorites'   // Map onlyFavorites to 'favorites' URL param
    };
    
    Object.entries(newState).forEach(([key, value]) => {
      const urlParam = urlMapping[key] || key;
      
      if (Array.isArray(value)) {
        if (value.length > 0) {
          newParams.set(urlParam, value.join(','));
        } else {
          newParams.delete(urlParam);
        }
      } else if (value === true) {
        newParams.set(urlParam, 'true');
      } else if (value === false || value === '') {
        newParams.delete(urlParam);
      } else if (value) {
        newParams.set(urlParam, value);
      }
    });
    
    console.log('Updating URL with params:', Object.fromEntries(newParams.entries()));
    setSearchParams(newParams, { replace: true });
  }, [searchParams, urlState, setSearchParams]);

  // Basic state
  const [allPlaques, setAllPlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Distance filter state - shared across all views
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>({
    enabled: false,
    center: null,
    radius: 1,
    locationName: null
  });

  // Filter options
  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [professionOptions, setProfessionOptions] = useState([]);

  // External hooks
  const { isPlaqueVisited, markAsVisited } = useVisitedPlaques();
  const { isFavorite, toggleFavorite } = useFavorites();

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
      });
      
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

  // FIXED: Enhanced filtered plaques with proper boolean filtering and debugging
  const filteredPlaques = useMemo(() => {
    console.log('=== FILTERING DEBUG ===');
    console.log('URL State:', {
      onlyVisited: urlState.onlyVisited,
      onlyFavorites: urlState.onlyFavorites,
      search: urlState.search,
      colors: urlState.colors,
      postcodes: urlState.postcodes,
      professions: urlState.professions
    });
    console.log('Total plaques before filtering:', allPlaques.length);

    // Track how many plaques pass each filter for debugging
    let debugCount = 0;

    let filtered = allPlaques.filter((plaque) => {
      // Standard filters
      const searchLower = urlState.search.toLowerCase();
      const matchesSearch = !urlState.search.trim() || 
        plaque.title?.toLowerCase().includes(searchLower) ||
        plaque.inscription?.toLowerCase().includes(searchLower) ||
        plaque.address?.toLowerCase().includes(searchLower) ||
        plaque.location?.toLowerCase().includes(searchLower) ||
        plaque.description?.toLowerCase().includes(searchLower);
      
      const matchesPostcode = urlState.postcodes.length === 0 || 
        (plaque.postcode && urlState.postcodes.includes(plaque.postcode));
      
      const matchesColor = urlState.colors.length === 0 || 
        (plaque.color && urlState.colors.includes(plaque.color.toLowerCase()));
      
      const matchesProfession = urlState.professions.length === 0 || 
        (plaque.profession && urlState.professions.includes(plaque.profession));
      
      // FIXED: Proper boolean filtering for visited and favorites with debugging
      const plaqueIsVisited = plaque.visited || isPlaqueVisited(plaque.id);
      const plaqueIsFavorite = isFavorite(plaque.id);
      
      const matchesVisited = !urlState.onlyVisited || plaqueIsVisited;
      const matchesFavorite = !urlState.onlyFavorites || plaqueIsFavorite;

      // Debug for the first few plaques when filters are active
      if ((urlState.onlyVisited || urlState.onlyFavorites) && debugCount < 3) {
        console.log(`Plaque ${plaque.id} (${plaque.title}):`, {
          plaqueIsVisited,
          plaqueIsFavorite,
          matchesVisited,
          matchesFavorite,
          onlyVisitedFilter: urlState.onlyVisited,
          onlyFavoritesFilter: urlState.onlyFavorites
        });
        debugCount++;
      }

      const passes = matchesSearch && 
             matchesPostcode && 
             matchesColor && 
             matchesProfession && 
             matchesVisited && 
             matchesFavorite;

      return passes;
    });

    console.log('After standard filters:', filtered.length);

    // Apply distance filter for ALL views
    if (distanceFilter.enabled && distanceFilter.center) {
      const beforeDistance = filtered.length;
      filtered = filtered.filter(plaque => {
        if (!plaque.latitude || !plaque.longitude) return false;
        
        const lat = parseFloat(plaque.latitude);
        const lng = parseFloat(plaque.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return false;
        
        const distance = calculateDistance(
          distanceFilter.center![0], 
          distanceFilter.center![1], 
          lat, 
          lng
        );
        return distance <= distanceFilter.radius;
      });
      console.log(`After distance filter: ${filtered.length} (was ${beforeDistance})`);
    }

    console.log(`Final filtered count: ${filtered.length}`);
    console.log('=== END FILTERING DEBUG ===');
    return filtered;
  }, [
    allPlaques, 
    urlState,
    isPlaqueVisited,
    isFavorite,
    distanceFilter.enabled,
    distanceFilter.center,
    distanceFilter.radius
  ]);

  // Active filters count including distance filter
  const activeFiltersCount = useMemo(() => {
    return urlState.postcodes.length + 
           urlState.colors.length + 
           urlState.professions.length + 
           (urlState.onlyVisited ? 1 : 0) + 
           (urlState.onlyFavorites ? 1 : 0) +
           (distanceFilter.enabled ? 1 : 0);
  }, [
    urlState.postcodes.length,
    urlState.colors.length,
    urlState.professions.length,
    urlState.onlyVisited,
    urlState.onlyFavorites,
    distanceFilter.enabled
  ]);

  // FIXED: Event handlers with proper debugging
  const handlePlaqueClick = useCallback((plaque) => {
    console.log('Plaque clicked in Discover:', plaque.title);
    setSelectedPlaque(plaque);
  }, []);

  const handleFavoriteToggle = useCallback((id) => {
    console.log('Toggle favorite for plaque:', id);
    toggleFavorite(id);
  }, [toggleFavorite]);

  const handleMarkVisited = useCallback(async (id) => {
    console.log('Mark visited for plaque:', id);
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

  // FIXED: Filter handlers with proper state updates and debugging
  const handleVisitedChange = useCallback((value: boolean) => {
    console.log('=== VISITED CHANGE ===');
    console.log('New visited value:', value);
    console.log('Current URL state before update:', urlState);
    updateUrlState({ onlyVisited: value });
    setCurrentPage(1);
    console.log('Updated visited filter to:', value);
  }, [updateUrlState, urlState]);

  const handleFavoritesChange = useCallback((value: boolean) => {
    console.log('=== FAVORITES CHANGE ===');
    console.log('New favorites value:', value);
    console.log('Current URL state before update:', urlState);
    updateUrlState({ onlyFavorites: value });
    setCurrentPage(1);
    console.log('Updated favorites filter to:', value);
  }, [updateUrlState, urlState]);

  // Reset filters including distance filter
  const resetFilters = useCallback(() => {
    console.log('Resetting all filters');
    updateUrlState({
      search: '',
      colors: [],
      postcodes: [],
      professions: [],
      onlyVisited: false,
      onlyFavorites: false,
    });
    setDistanceFilter({
      enabled: false,
      center: null,
      radius: 1,
      locationName: null
    });
    setCurrentPage(1);
  }, [updateUrlState]);

  // Distance filter handlers
  const handleDistanceFilterChange = useCallback((newFilter: Partial<DistanceFilter>) => {
    console.log('Distance filter changed:', newFilter);
    setDistanceFilter(prev => ({ ...prev, ...newFilter }));
    setCurrentPage(1);
  }, []);

  // Distance helper functions
  const getDistanceFromActiveLocation = useCallback((plaque) => {
    if (!distanceFilter.enabled || !distanceFilter.center || !plaque.latitude || !plaque.longitude) {
      return Infinity;
    }
    
    const lat = parseFloat(plaque.latitude);
    const lng = parseFloat(plaque.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return Infinity;
    
    return calculateDistance(distanceFilter.center[0], distanceFilter.center[1], lat, lng);
  }, [distanceFilter]);

  const formatDistance = useCallback((distanceKm) => {
    return `${distanceKm.toFixed(1)} km`;
  }, []);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredPlaques.length / itemsPerPage);
  const paginatedPlaques = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlaques.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlaques, currentPage]);

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
            <MapContainer
              plaques={filteredPlaques}
              onPlaqueClick={handlePlaqueClick}
              className="h-full w-full"
              onDistanceFilterChange={handleDistanceFilterChange}
              distanceFilter={distanceFilter}
              isPlaqueVisited={isPlaqueVisited}
              isFavorite={isFavorite}
            />
          </div>
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
              <Button onClick={() => updateUrlState({ search: '' })} variant="outline">
                Clear Search
              </Button>
            ) : null
          }
        />
      );
    }

    const commonProps = {
      showDistance: distanceFilter.enabled,
      formatDistance,
    };

    if (urlState.view === 'grid') {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPlaques.map((plaque) => (
              <PlaqueCard
                key={plaque.id}
                plaque={plaque}
                onClick={handlePlaqueClick}
                onFavoriteToggle={handleFavoriteToggle}
                onMarkVisited={handleMarkVisited}
                distance={distanceFilter.enabled ? getDistanceFromActiveLocation(plaque) : 0}
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
                onClick={handlePlaqueClick}
                onFavoriteToggle={handleFavoriteToggle}
                onMarkVisited={handleMarkVisited}
                distance={distanceFilter.enabled ? getDistanceFromActiveLocation(plaque) : 0}
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
        onViewModeChange={(view) => updateUrlState({ view })}
        searchValue={urlState.search}
        onSearchChange={(search) => updateUrlState({ search })}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={() => setFiltersOpen(true)}
      />
      
      {/* Active filters display with distance filter */}
      <DiscoverFilters
        urlState={urlState}
        activeFiltersCount={activeFiltersCount}
        activeLocation={distanceFilter.center}
        maxDistance={distanceFilter.radius}
        hideOutsidePlaques={distanceFilter.enabled}
        formatDistance={formatDistance}
        onRemoveFilter={(filters) => updateUrlState(filters)}
        onResetFilters={resetFilters}
        filtersOpen={filtersOpen}
        onCloseFilters={() => setFiltersOpen(false)}
        filterOptions={{
          postcodeOptions,
          colorOptions,
          professionOptions
        }}
        onApplyFilters={(filters) => updateUrlState(filters)}
        distanceFilter={distanceFilter}
        onClearDistanceFilter={() => setDistanceFilter({
          enabled: false,
          center: null,
          radius: 1,
          locationName: null
        })}
      />
      
      {/* Status bar */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium text-gray-600">
            {loading ? "Loading plaques..." : (
              <>
                {filteredPlaques.length} {filteredPlaques.length === 1 ? 'Plaque' : 'Plaques'} found
                {distanceFilter.enabled && distanceFilter.locationName && (
                  <span className="ml-2 text-green-600">
                    within {formatDistance(distanceFilter.radius)} of {distanceFilter.locationName}
                  </span>
                )}
              </>
            )}
          </h2>
        </div>
        
        {/* Main Content */}
        {renderContent()}
      </div>
      
      {/* FIXED: Filter Dialog with proper toggle handlers */}
      <DiscoverFilterDialog
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        
        postcodes={postcodeOptions}
        selectedPostcodes={urlState.postcodes}
        onPostcodesChange={(values) => updateUrlState({ postcodes: values })}
        
        colors={colorOptions}
        selectedColors={urlState.colors}
        onColorsChange={(values) => updateUrlState({ colors: values })}
        
        professions={professionOptions}
        selectedProfessions={urlState.professions}
        onProfessionsChange={(values) => updateUrlState({ professions: values })}
        
        onlyVisited={urlState.onlyVisited}
        onVisitedChange={handleVisitedChange}
        
        onlyFavorites={urlState.onlyFavorites}
        onFavoritesChange={handleFavoritesChange}
        
        onApply={() => setFiltersOpen(false)}
        onReset={resetFilters}
        
        // Pass additional props for toggle count calculations
        allPlaques={allPlaques}
        isPlaqueVisited={isPlaqueVisited}
        isFavorite={isFavorite}
        distanceFilter={distanceFilter}
      />
      
      {/* Plaque Detail Modal */}
      {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque}
          isOpen={!!selectedPlaque}
          onClose={() => {
            console.log('Closing plaque detail');
            setSelectedPlaque(null);
          }}
          isFavorite={isFavorite(selectedPlaque.id)}
          onFavoriteToggle={handleFavoriteToggle}
          onMarkVisited={handleMarkVisited}
          nearbyPlaques={getNearbyPlaques(selectedPlaque)}
          onSelectNearbyPlaque={setSelectedPlaque}
          isMapView={urlState.view === 'map'}
          distance={distanceFilter.enabled ? getDistanceFromActiveLocation(selectedPlaque) : undefined}
          formatDistance={formatDistance}
          showDistance={distanceFilter.enabled}
        />
      )}
    </PageContainer>
  );
};

export default Discover;