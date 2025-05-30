// src/pages/Discover.tsx - FIXED: Plaque click handling
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
  
  const urlState = {
    view: (searchParams.get('view') as ViewMode) || 'grid',
    search: searchParams.get('search') || '',
    colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
    postcodes: searchParams.get('postcodes')?.split(',').filter(Boolean) || [],
    professions: searchParams.get('professions')?.split(',').filter(Boolean) || [],
    onlyVisited: searchParams.get('visited') === 'true',
    onlyFavorites: searchParams.get('favorites') === 'true',
  };

  const updateUrlState = (updates: Partial<typeof urlState>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries({ ...urlState, ...updates }).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          newParams.set(key, value.join(','));
        } else {
          newParams.delete(key);
        }
      } else if (value === true) {
        newParams.set(key, 'true');
      } else if (value === false || value === '') {
        newParams.delete(key);
      } else if (value) {
        newParams.set(key, value);
      }
    });
    
    setSearchParams(newParams, { replace: true });
  };

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
    }
  }, []);

  // Enhanced filtered plaques with distance filter
  const filteredPlaques = useMemo(() => {
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
      
      const matchesVisited = !urlState.onlyVisited || plaque.visited || isPlaqueVisited(plaque.id);
      const matchesFavorite = !urlState.onlyFavorites || isFavorite(plaque.id);

      return matchesSearch && 
             matchesPostcode && 
             matchesColor && 
             matchesProfession && 
             matchesVisited && 
             matchesFavorite;
    });

    // Apply distance filter for ALL views
    if (distanceFilter.enabled && distanceFilter.center) {
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
    }

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
    console.log('Plaque clicked:', plaque); // Debug log
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
    } catch (error) {
      console.error("Error marking as visited:", error);
    }
  }, [markAsVisited]);

  // Reset filters including distance filter
  const resetFilters = useCallback(() => {
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
  }, []);

  // Distance filter handlers
  const handleDistanceFilterChange = useCallback((newFilter: Partial<DistanceFilter>) => {
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
                onClick={handlePlaqueClick} // FIXED: Use onClick instead of onPlaqueClick
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
                onClick={handlePlaqueClick} // FIXED: Use onClick instead of onPlaqueClick
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
      
      {/* Filter Dialog */}
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
        onVisitedChange={(value) => updateUrlState({ onlyVisited: value })}
        
        onlyFavorites={urlState.onlyFavorites}
        onFavoritesChange={(value) => updateUrlState({ onlyFavorites: value })}
        
        onApply={() => setFiltersOpen(false)}
        onReset={resetFilters}
      />
      
      {/* FIXED: Plaque Detail Modal - Added debug logging */}
      {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque}
          isOpen={!!selectedPlaque}
          onClose={() => {
            console.log('Closing plaque detail'); // Debug log
            setSelectedPlaque(null);
          }}
          isFavorite={isFavorite(selectedPlaque.id)}
          onFavoriteToggle={handleFavoriteToggle}
          onMarkVisited={handleMarkVisited}
          nearbyPlaques={getNearbyPlaques(selectedPlaque)}
          onSelectNearbyPlaque={setSelectedPlaque}
          isMapView={urlState.view === 'map'}
        />
      )}
    </PageContainer>
  );
};

export default Discover;