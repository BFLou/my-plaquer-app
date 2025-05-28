// src/pages/Discover.tsx
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

// Import the new simplified map
import { MapContainer } from '../components/maps/MapContainer';

// Import hooks
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { calculateDistance } from '../components/maps/utils/routeUtils';

// Simple URL state management
import { useSearchParams } from 'react-router-dom';

export type ViewMode = 'grid' | 'list' | 'map';

const Discover = () => {
  // URL state management (simplified)
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get values from URL
  const urlState = {
    view: (searchParams.get('view') as ViewMode) || 'grid',
    search: searchParams.get('search') || '',
    colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
    postcodes: searchParams.get('postcodes')?.split(',').filter(Boolean) || [],
    professions: searchParams.get('professions')?.split(',').filter(Boolean) || [],
    onlyVisited: searchParams.get('visited') === 'true',
    onlyFavorites: searchParams.get('favorites') === 'true',
  };

  // Update URL helpers
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

  // Filter options
  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [professionOptions, setProfessionOptions] = useState([]);

  // Distance filter state (simplified)
  const [activeLocation, setActiveLocation] = useState<[number, number] | null>(null);
  const [filterRadius, setFilterRadius] = useState(1);
  const [filterEnabled, setFilterEnabled] = useState(false);

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

  // Filtered plaques
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

    // Apply distance filter if active
    if (activeLocation && filterEnabled) {
      filtered = filtered.filter(plaque => {
        if (!plaque.latitude || !plaque.longitude) return false;
        
        const lat = parseFloat(plaque.latitude);
        const lng = parseFloat(plaque.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return false;
        
        const distance = calculateDistance(activeLocation[0], activeLocation[1], lat, lng);
        return distance <= filterRadius;
      });
    }

    return filtered;
  }, [
    allPlaques, 
    urlState,
    isPlaqueVisited,
    isFavorite,
    activeLocation,
    filterEnabled,
    filterRadius
  ]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return urlState.postcodes.length + 
           urlState.colors.length + 
           urlState.professions.length + 
           (urlState.onlyVisited ? 1 : 0) + 
           (urlState.onlyFavorites ? 1 : 0) +
           (activeLocation && filterEnabled ? 1 : 0);
  }, [
    urlState.postcodes.length,
    urlState.colors.length,
    urlState.professions.length,
    urlState.onlyVisited,
    urlState.onlyFavorites,
    activeLocation,
    filterEnabled
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
    } catch (error) {
      console.error("Error marking as visited:", error);
    }
  }, [markAsVisited]);

  const resetFilters = useCallback(() => {
    updateUrlState({
      search: '',
      colors: [],
      postcodes: [],
      professions: [],
      onlyVisited: false,
      onlyFavorites: false,
    });
    setActiveLocation(null);
    setFilterEnabled(false);
    setCurrentPage(1);
  }, []);

  // Distance helper functions
  const getDistanceFromActiveLocation = useCallback((plaque) => {
    if (!activeLocation || !plaque.latitude || !plaque.longitude) return Infinity;
    
    const lat = parseFloat(plaque.latitude);
    const lng = parseFloat(plaque.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return Infinity;
    
    return calculateDistance(activeLocation[0], activeLocation[1], lat, lng);
  }, [activeLocation]);

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
      showDistance: !!activeLocation,
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
        onViewModeChange={(view) => updateUrlState({ view })}
        searchValue={urlState.search}
        onSearchChange={(search) => updateUrlState({ search })}
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
                  onClick={() => updateUrlState({ 
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
                  onClick={() => updateUrlState({ 
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
                  onClick={() => updateUrlState({ 
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
                  onClick={() => updateUrlState({ onlyVisited: false })}
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
                  onClick={() => updateUrlState({ onlyFavorites: false })}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Distance filter */}
            {activeLocation && filterEnabled && (
              <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200 text-xs">
                📍 Within {formatDistance(filterRadius)}
                <button
                  onClick={() => {
                    setActiveLocation(null);
                    setFilterEnabled(false);
                  }}
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
                {activeLocation && filterEnabled && (
                  <span className="ml-2 text-green-600">
                    within {formatDistance(filterRadius)}
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
      
      {/* Plaque Detail Modal */}
        {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque}
          isOpen={!!selectedPlaque}
          onClose={() => setSelectedPlaque(null)}
          isFavorite={isFavorite(selectedPlaque.id)}
          onFavoriteToggle={handleFavoriteToggle}
          onMarkVisited={handleMarkVisited}
          nearbyPlaques={getNearbyPlaques(selectedPlaque)}
          onSelectNearbyPlaque={setSelectedPlaque}
          isMapView={urlState.view === 'map'} // NEW: Pass map view flag
        />
      )}
    </PageContainer>
  );
};

export default Discover;