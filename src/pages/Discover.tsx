// src/pages/Discover.tsx - SAFE INTEGRATION VERSION
import React, { useState, useEffect, useMemo, useCallback } from "react";
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

// Import the new UnifiedMap (with error boundary)
import UnifiedMap from '../components/maps/UnifiedMap';
import { MapErrorBoundary } from '../components/ErrorBoundary';

// Import header component
import DiscoverHeader from '../components/discover/DiscoverHeader';
import DiscoverFilterDialog from '../components/plaques/DiscoverFilterDialog';

// Import hooks - with safe error handling
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';

export type ViewMode = 'grid' | 'list' | 'map';

const Discover = () => {
  // Basic state
  const [allPlaques, setAllPlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // View and search state - with safe defaults
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    colors: [],
    postcodes: [],
    professions: [],
    onlyVisited: false,
    onlyFavorites: false
  });

  // Filter options
  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [professionOptions, setProfessionOptions] = useState([]);

  // External hooks with error handling
  const visitedHook = useVisitedPlaques();
  const favoritesHook = useFavorites();

  // Safe extraction of hook data
  const isPlaqueVisited = visitedHook?.isPlaqueVisited || (() => false);
  const markAsVisited = visitedHook?.markAsVisited || (() => Promise.resolve());
  const favorites = favoritesHook?.favorites || [];
  const isFavorite = favoritesHook?.isFavorite || (() => false);
  const toggleFavorite = favoritesHook?.toggleFavorite || (() => {});

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load plaque data with error handling
  useEffect(() => {
    try {
      setLoading(true);
      
      const adaptedData = adaptPlaquesData(plaqueData);
      setAllPlaques(adaptedData);
      
      // Generate filter options safely
      const postcodeCount = {};
      const colorCount = {};
      const professionCount = {};
      
      adaptedData.forEach(plaque => {
        try {
          // Postcodes
          if (plaque?.postcode && plaque.postcode !== "Unknown") {
            postcodeCount[plaque.postcode] = (postcodeCount[plaque.postcode] || 0) + 1;
          }
          
          // Colors
          const color = plaque?.color?.toLowerCase?.();
          if (color && color !== "unknown") {
            colorCount[color] = (colorCount[color] || 0) + 1;
          }
          
          // Professions
          if (plaque?.profession && plaque.profession !== "Unknown") {
            professionCount[plaque.profession] = (professionCount[plaque.profession] || 0) + 1;
          }
        } catch (err) {
          console.warn('Error processing plaque for filters:', plaque?.id, err);
        }
      });
      
      // Set filter options safely
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

  // Filtered plaques with safe filtering
  const filteredPlaques = useMemo(() => {
    try {
      return allPlaques.filter((plaque) => {
        if (!plaque) return false;
        
        // Search filter
        const matchesSearch = !searchValue.trim() || 
          (plaque.title?.toLowerCase?.()?.includes?.(searchValue.toLowerCase())) ||
          (plaque.inscription?.toLowerCase?.()?.includes?.(searchValue.toLowerCase())) ||
          (plaque.address?.toLowerCase?.()?.includes?.(searchValue.toLowerCase())) ||
          (plaque.location?.toLowerCase?.()?.includes?.(searchValue.toLowerCase())) ||
          (plaque.description?.toLowerCase?.()?.includes?.(searchValue.toLowerCase()));
        
        // Other filters
        const matchesPostcode = filters.postcodes.length === 0 || 
          (plaque.postcode && filters.postcodes.includes(plaque.postcode));
        
        const matchesColor = filters.colors.length === 0 || 
          (plaque.color && filters.colors.includes(plaque.color.toLowerCase()));
        
        const matchesProfession = filters.professions.length === 0 || 
          (plaque.profession && filters.professions.includes(plaque.profession));
        
        const matchesVisited = !filters.onlyVisited || plaque.visited || isPlaqueVisited(plaque.id);
        const matchesFavorite = !filters.onlyFavorites || isFavorite(plaque.id);

        return matchesSearch && 
               matchesPostcode && 
               matchesColor && 
               matchesProfession && 
               matchesVisited && 
               matchesFavorite;
      });
    } catch (error) {
      console.error('Error filtering plaques:', error);
      return allPlaques; // Return all plaques if filtering fails
    }
  }, [allPlaques, searchValue, filters, isPlaqueVisited, isFavorite]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return filters.postcodes.length + 
           filters.colors.length + 
           filters.professions.length + 
           (filters.onlyVisited ? 1 : 0) + 
           (filters.onlyFavorites ? 1 : 0);
  }, [filters]);

  // Event handlers
  const handlePlaqueClick = useCallback((plaque) => {
    if (plaque) {
      setSelectedPlaque(plaque);
    }
  }, []);

  const handleFavoriteToggle = useCallback((id) => {
    try {
      toggleFavorite(id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
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
    setFilters({
      colors: [],
      postcodes: [],
      professions: [],
      onlyVisited: false,
      onlyFavorites: false
    });
    setSearchValue('');
    setCurrentPage(1);
  }, []);

  // Handle filter changes safely
  const handleFilterChange = useCallback((newFilters) => {
    try {
      setFilters(prev => ({ ...prev, ...newFilters }));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error updating filters:', error);
    }
  }, []);

  // Get nearby plaques for details panel
  const getNearbyPlaques = useCallback((currentPlaque) => {
    try {
      if (!currentPlaque) return [];
      
      return allPlaques.filter(p => 
        p && p.id !== currentPlaque.id && 
        (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
      ).slice(0, 3);
    } catch (error) {
      console.error('Error getting nearby plaques:', error);
      return [];
    }
  }, [allPlaques]);

  // Paginated plaques for grid/list view
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredPlaques.length / itemsPerPage);
  const paginatedPlaques = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlaques.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlaques, currentPage, itemsPerPage]);

  const renderContent = () => {
    if (loading) {
      return viewMode === 'map' ? (
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

    if (viewMode === 'map') {
      return (
        <div className="relative">
          <div className="h-[650px]">
            <MapErrorBoundary>
              <UnifiedMap
                plaques={allPlaques}
                favorites={favorites}
                onFavoriteToggle={handleFavoriteToggle}
                onMarkVisited={handleMarkVisited}
                isPlaqueVisited={isPlaqueVisited}
                className="h-full w-full"
              />
            </MapErrorBoundary>
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
              : searchValue.trim()
              ? "Try different search terms or browse all plaques."
              : "No plaques are available at the moment."
          }
          actionButton={
            activeFiltersCount > 0 ? (
              <Button onClick={resetFilters} variant="outline">
                Clear Filters
              </Button>
            ) : searchValue.trim() ? (
              <Button onClick={() => setSearchValue('')} variant="outline">
                Clear Search
              </Button>
            ) : null
          }
        />
      );
    }

    const commonProps = {
      showDistance: false,
      formatDistance: (dist) => `${dist.toFixed(1)}km`,
    };

    if (viewMode === 'grid') {
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
                distance={0}
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

    if (viewMode === 'list') {
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
                distance={0}
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
      hasFooter={viewMode !== 'map'}
      simplifiedFooter={true}
    >
      {/* Header with view tabs and search */}
      <DiscoverHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={() => setFiltersOpen(true)}
      />
      
      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="container mx-auto px-4 mt-3">
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {/* Color filters */}
            {filters.colors.map(color => (
              <div key={color} className="inline-flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full border text-xs">
                {capitalizeWords(color)}
                <button
                  onClick={() => handleFilterChange({ 
                    colors: filters.colors.filter(c => c !== color) 
                  })}
                  className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Similar for other filter types... */}
            
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
              `${filteredPlaques.length} ${filteredPlaques.length === 1 ? 'Plaque' : 'Plaques'} found`
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
        selectedPostcodes={filters.postcodes}
        onPostcodesChange={(values) => handleFilterChange({ postcodes: values })}
        
        colors={colorOptions}
        selectedColors={filters.colors}
        onColorsChange={(values) => handleFilterChange({ colors: values })}
        
        professions={professionOptions}
        selectedProfessions={filters.professions}
        onProfessionsChange={(values) => handleFilterChange({ professions: values })}
        
        onlyVisited={filters.onlyVisited}
        onVisitedChange={(value) => handleFilterChange({ onlyVisited: value })}
        
        onlyFavorites={filters.onlyFavorites}
        onFavoritesChange={(value) => handleFilterChange({ onlyFavorites: value })}
        
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
          onSelectNearbyPlaque={handlePlaqueClick}
        />
      )}
    </PageContainer>
  );
};

export default Discover;