// src/pages/Discover.tsx - Complete with mobile scrolling fixes
import { useState, useEffect, useMemo, useCallback } from "react";
import { capitalizeWords } from '@/utils/stringUtils';
import { adaptPlaquesData } from "@/utils/plaqueAdapter";
import plaqueData from '../data/plaque_data.json';
import { PageContainer } from "@/components";
import { PlaqueCard } from "@/components/plaques/PlaqueCard";
import { PlaqueListItem } from "@/components/plaques/PlaqueListItem";
import { PlaqueDetail } from "@/components/plaques/PlaqueDetail";
import { EmptyState } from "@/components/common/EmptyState";
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileDialog } from "@/components/ui/mobile-dialog";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { BottomActionBar } from "@/components/layout/BottomActionBar";
import Pagination from '@/components/plaques/Pagination';
import DiscoverFilterDialog from '../components/plaques/DiscoverFilterDialog';
import DiscoverHeader from '../components/discover/DiscoverHeader';
import DiscoverFilters from '../components/discover/DiscoverFilters';
import { MapContainer } from '../components/maps/MapContainer';
import PendingActionHandler from '@/components/auth/PendingActionHandler';
import AddToCollectionDialog from '@/components/plaques/AddToCollectionDialog';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import { calculateDistance } from '../components/maps/utils/routeUtils';
import { useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { generatePlaqueUrl } from '@/utils/urlUtils';
import { Filter, MapPin, Grid, List, Navigation, X } from 'lucide-react';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import type { Plaque } from '@/types/plaque';

export type ViewMode = 'grid' | 'list' | 'map';

interface FilterOption {
  label: string;
  value: string;
  count: number;
}

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
  const location = useLocation();
  
  // Hook for keyboard detection
  const { isKeyboardOpen } = useKeyboardDetection();
    
  // URL state parsing with modal support
  const urlState = useMemo(() => {
    const state = {
      view: (searchParams.get('view') as ViewMode) || (isMobile() ? 'list' : 'grid'),
      search: searchParams.get('search') || '',
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
      postcodes: searchParams.get('postcodes')?.split(',').filter(Boolean) || [],
      professions: searchParams.get('professions')?.split(',').filter(Boolean) || [],
      onlyVisited: searchParams.get('visited') === 'true',
      onlyFavorites: searchParams.get('favorites') === 'true',
      modalPlaque: searchParams.get('plaque') ? parseInt(searchParams.get('plaque')!) : null,
    };
    
    console.log('URL State parsed:', state);
    return state;
  }, [searchParams]);

  // URL state update function with mobile optimization
  const updateUrlState = useCallback((updates: Partial<typeof urlState>) => {
    const newParams = new URLSearchParams(searchParams);
    
    const newState = { ...urlState, ...updates };
    
    // Map internal state to URL parameters
    const urlMapping: Record<string, string> = {
      view: 'view',
      search: 'search', 
      colors: 'colors',
      postcodes: 'postcodes',
      professions: 'professions',
      onlyVisited: 'visited',
      onlyFavorites: 'favorites',
      modalPlaque: 'plaque'
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
      } else if (value === false || value === '' || value === null) {
        newParams.delete(urlParam);
      } else if (value) {
        newParams.set(urlParam, value.toString());
      }
    });
    
    console.log('Updating URL with params:', Object.fromEntries(newParams.entries()));
    setSearchParams(newParams, { replace: true });
  }, [searchParams, urlState, setSearchParams]);

  // Basic state with proper typing
  const [allPlaques, setAllPlaques] = useState<Plaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaque, setSelectedPlaque] = useState<Plaque | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Collection and route action state for pending actions
  const [pendingCollectionPlaque, setPendingCollectionPlaque] = useState<Plaque | null>(null);

  // Distance filter state - shared across all views
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>({
    enabled: false,
    center: null,
    radius: 1,
    locationName: null
  });

  // Filter options with proper typing
  const [postcodeOptions, setPostcodeOptions] = useState<FilterOption[]>([]);
  const [colorOptions, setColorOptions] = useState<FilterOption[]>([]);
  const [professionOptions, setProfessionOptions] = useState<FilterOption[]>([]);

  // External hooks
  const { isPlaqueVisited } = useVisitedPlaques();
  const { isFavorite } = useFavorites();

  // Handle pending route action
  const handlePendingRouteAction = useCallback((routeData: any) => {
    console.log('Handle pending route action:', routeData);
    toast.success('Route ready to save! Please use the Save Route button in the route panel.');
  }, []);

  // Handle pending collection action
  const handlePendingCollectionAction = useCallback((plaqueId: number) => {
    const plaque = allPlaques.find(p => p.id === plaqueId);
    if (plaque) {
      setPendingCollectionPlaque(plaque);
    }
  }, [allPlaques]);

  // Handle modal plaque from URL
  useEffect(() => {
    if (urlState.modalPlaque) {
      const plaque = allPlaques.find(p => p.id === urlState.modalPlaque);
      if (plaque) {
        console.log('Opening modal for plaque from URL:', plaque.title);
        setSelectedPlaque(plaque);
      }
    } else {
      setSelectedPlaque(null);
    }
  }, [urlState.modalPlaque, allPlaques]);

  // Load plaque data
  useEffect(() => {
    try {
      setLoading(true);
      
      const adaptedData = adaptPlaquesData(plaqueData as any);
      setAllPlaques(adaptedData);
      
      // Generate filter options
      const postcodeCount: Record<string, number> = {};
      const colorCount: Record<string, number> = {};
      const professionCount: Record<string, number> = {};
      
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

  // Enhanced filtered plaques with proper boolean filtering
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
      
      // Enhanced boolean filtering for visited and favorites
      const plaqueIsVisited = plaque.visited || isPlaqueVisited(plaque.id);
      const plaqueIsFavorite = isFavorite(plaque.id);
      
      const matchesVisited = !urlState.onlyVisited || plaqueIsVisited;
      const matchesFavorite = !urlState.onlyFavorites || plaqueIsFavorite;

      return matchesSearch && 
             matchesPostcode && 
             matchesColor && 
             matchesProfession && 
             matchesVisited && 
             matchesFavorite;
    });

    console.log('After standard filters:', filtered.length);

    // Apply distance filter for ALL views
    if (distanceFilter.enabled && distanceFilter.center) {
      const beforeDistance = filtered.length;
      filtered = filtered.filter(plaque => {
        if (!plaque.latitude || !plaque.longitude) return false;
        
        const lat = plaque.latitude;
        const lng = plaque.longitude;
        
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

  // Enhanced event handlers with modal URL state
  const handlePlaqueClick = useCallback((plaque: Plaque) => {
    console.log('Plaque clicked in Discover:', plaque.title);
    triggerHapticFeedback('selection');
    updateUrlState({ modalPlaque: plaque.id });
  }, [updateUrlState]);

  // Enhanced modal close handler
  const handleCloseModal = useCallback(() => {
    console.log('Closing plaque modal');
    setSelectedPlaque(null);
    updateUrlState({ modalPlaque: null });
  }, [updateUrlState]);

  // Enhanced filter handlers with proper state updates
  const handleVisitedChange = useCallback((value: boolean) => {
    console.log('=== VISITED CHANGE ===');
    console.log('New visited value:', value);
    triggerHapticFeedback('light');
    updateUrlState({ onlyVisited: value });
    setCurrentPage(1);
  }, [updateUrlState]);

  const handleFavoritesChange = useCallback((value: boolean) => {
    console.log('=== FAVORITES CHANGE ===');
    console.log('New favorites value:', value);
    triggerHapticFeedback('light');
    updateUrlState({ onlyFavorites: value });
    setCurrentPage(1);
  }, [updateUrlState]);

  // Reset filters including distance filter
  const resetFilters = useCallback(() => {
    console.log('Resetting all filters');
    triggerHapticFeedback('medium');
    updateUrlState({
      search: '',
      colors: [],
      postcodes: [],
      professions: [],
      onlyVisited: false,
      onlyFavorites: false,
      modalPlaque: null
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

  // Clear distance filter specifically
  const handleClearDistanceFilter = useCallback(() => {
    setDistanceFilter({
      enabled: false,
      center: null,
      radius: 1,
      locationName: null
    });
    setCurrentPage(1);
  }, []);

  // View mode handler with mobile optimization
  const handleViewModeChange = useCallback((view: ViewMode) => {
    triggerHapticFeedback('light');
    updateUrlState({ view });
    
    // Reset page when changing view modes
    setCurrentPage(1);
  }, [updateUrlState]);

  // Search handler with mobile optimization
  const handleSearchChange = useCallback((search: string) => {
    updateUrlState({ search });
    setCurrentPage(1);
  }, [updateUrlState]);

  // Distance helper functions
  const getDistanceFromActiveLocation = useCallback((plaque: Plaque) => {
    if (!distanceFilter.enabled || !distanceFilter.center || !plaque.latitude || !plaque.longitude) {
      return Infinity;
    }
    
    const lat = plaque.latitude;
    const lng = plaque.longitude;
    
    if (isNaN(lat) || isNaN(lng)) return Infinity;
    
    return calculateDistance(distanceFilter.center[0], distanceFilter.center[1], lat, lng);
  }, [distanceFilter]);

  const formatDistance = useCallback((distanceKm: number) => {
    return `${distanceKm.toFixed(1)} km`;
  }, []);

  // Mobile-optimized pagination
  const itemsPerPage = isMobile() ? (urlState.view === 'list' ? 8 : 6) : 12;
  const totalPages = Math.ceil(filteredPlaques.length / itemsPerPage);
  const paginatedPlaques = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlaques.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlaques, currentPage, itemsPerPage]);

  // Get nearby plaques for detail view
  const getNearbyPlaques = useCallback((currentPlaque: Plaque) => {
    return allPlaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  }, [allPlaques]);

  // Handle nearby plaque selection in modal
  const handleSelectNearbyPlaque = useCallback((nearbyPlaque: Plaque) => {
    console.log('Selecting nearby plaque:', nearbyPlaque.title);
    triggerHapticFeedback('selection');
    updateUrlState({ modalPlaque: nearbyPlaque.id });
  }, [updateUrlState]);

  // Mobile-specific handlers
  const handleQuickLocationAccess = () => {
    triggerHapticFeedback('medium');
    
    if (navigator.geolocation) {
      const loadingToast = toast.loading("Finding your location...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss(loadingToast);
          triggerHapticFeedback('success');
          const { latitude, longitude } = position.coords;
          
          setDistanceFilter({
            enabled: true,
            center: [latitude, longitude],
            radius: 2,
            locationName: 'Your Location'
          });
          
          // Switch to map view on mobile for better location experience
          if (isMobile()) {
            updateUrlState({ view: 'map' });
          }
          
          toast.success('Showing plaques near you');
        },
        () => {
          toast.dismiss(loadingToast);
          triggerHapticFeedback('error');
          toast.error("Could not determine your location. Please allow location access.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const renderContent = () => {
    if (loading) {
      return urlState.view === 'map' ? (
        <div className="h-[500px] md:h-[650px] bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 md:h-10 md:w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-sm md:text-base">Loading map...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 md:h-64 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (urlState.view === 'map') {
      return (
        <div className="relative">
          <div className="h-[500px] md:h-[650px]">
            <MapContainer
              plaques={filteredPlaques}
              onPlaqueClick={handlePlaqueClick}
              className="h-full w-full"
              onDistanceFilterChange={handleDistanceFilterChange}
              distanceFilter={distanceFilter}
              isPlaqueVisited={isPlaqueVisited}
              isFavorite={isFavorite}
              onRouteAction={handlePendingRouteAction}
            />
          </div>
        </div>
      );
    }

    if (filteredPlaques.length === 0) {
      return (
        <div className="pb-20">
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
                <MobileButton onClick={resetFilters} variant="outline" touchOptimized>
                  Clear Filters
                </MobileButton>
              ) : urlState.search.trim() ? (
                <MobileButton 
                  onClick={() => updateUrlState({ search: '' })} 
                  variant="outline"
                  touchOptimized
                >
                  Clear Search
                </MobileButton>
              ) : null
            }
          />
        </div>
      );
    }

    const commonProps = {
      showDistance: distanceFilter.enabled,
      formatDistance,
      navigationMode: 'modal' as const,
    };

    if (urlState.view === 'grid') {
      return (
        <div className="pb-20 md:pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {paginatedPlaques.map((plaque) => (
              <PlaqueCard
                key={plaque.id}
                plaque={plaque}
                onClick={handlePlaqueClick}
                distance={distanceFilter.enabled ? getDistanceFromActiveLocation(plaque) : 0}
                {...commonProps}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  triggerHapticFeedback('light');
                  setCurrentPage(page);
                  
                  // Scroll to top on mobile
                  if (isMobile()) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              />
            </div>
          )}
        </div>
      );
    }

    if (urlState.view === 'list') {
      return (
        <div className="pb-20 md:pb-8">
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            {paginatedPlaques.map((plaque) => (
              <PlaqueListItem
                key={plaque.id}
                plaque={plaque}
                onClick={handlePlaqueClick}
                distance={distanceFilter.enabled ? getDistanceFromActiveLocation(plaque) : 0}
                {...commonProps}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  triggerHapticFeedback('light');
                  setCurrentPage(page);
                  
                  // Scroll to top on mobile
                  if (isMobile()) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              />
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <PageContainer 
      activePage="discover"
      hasFooter={urlState.view !== 'map'}
      simplifiedFooter={true}
      paddingBottom="none"
      className={`discover-page ${isKeyboardOpen ? 'keyboard-open' : ''}`}
    >
      {/* Pending Action Handler */}
      <PendingActionHandler 
        onCollectionAction={handlePendingCollectionAction}
        onRouteAction={handlePendingRouteAction}
      />
      
      {/* Mobile-optimized Header with view tabs and search */}
      <DiscoverHeader
        viewMode={urlState.view}
        onViewModeChange={handleViewModeChange}
        searchValue={urlState.search}
        onSearchChange={handleSearchChange}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={() => {
          triggerHapticFeedback('light');
          setFiltersOpen(true);
        }}
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
        onClearDistanceFilter={handleClearDistanceFilter}
      />
      
      {/* FIXED: Main content container with proper mobile scrolling */}
      <div className="flex-1 min-h-0 overflow-y-auto mobile-scroll-container" style={{ height: 'calc(100vh - 140px)', paddingBottom: '80px' }}>
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h2 className="text-sm md:text-base font-medium text-gray-600">
              {loading ? "Loading plaques..." : (
                <>
                  {filteredPlaques.length} {filteredPlaques.length === 1 ? 'Plaque' : 'Plaques'} found
                  {distanceFilter.enabled && distanceFilter.locationName && (
                    <span className="ml-2 text-green-600 text-xs md:text-sm">
                      within {formatDistance(distanceFilter.radius)} of {distanceFilter.locationName}
                    </span>
                  )}
                </>
              )}
            </h2>
            
            {/* Mobile quick actions button */}
            {isMobile() && (
              <MobileButton
                variant="outline"
                size="sm"
                onClick={() => setShowQuickActions(true)}
                className="text-xs"
                touchOptimized
              >
                Quick Actions
              </MobileButton>
            )}
          </div>
          
          {/* Main Content */}
          {renderContent()}
        </div>
      </div>
      
      {/* Floating Action Button for location access */}
      {isMobile() && urlState.view !== 'map' && (
        <FloatingActionButton
          onClick={handleQuickLocationAccess}
          icon={<Navigation size={20} />}
          variant="default"
        />
      )}
      
      {/* Bottom Action Bar for mobile view switching */}
      {isMobile() && urlState.view === 'map' && (
        <BottomActionBar background="white">
          <MobileButton
            variant={'default'}
            onClick={() => handleViewModeChange('list')}
            className="flex-1"
            touchOptimized
          >
            <List size={16} className="mr-2" />
            List
          </MobileButton>
          <MobileButton
            variant={'default'}
            onClick={() => handleViewModeChange('grid')}
            className="flex-1"
            touchOptimized
          >
            <Grid size={16} className="mr-2" />
            Grid
          </MobileButton>
          <MobileButton
            onClick={handleQuickLocationAccess}
            variant="outline"
            className="flex-1"
            touchOptimized
          >
            <Navigation size={16} className="mr-2" />
            Near Me
          </MobileButton>
        </BottomActionBar>
      )}
      
      {/* Enhanced Filter Dialog with mobile optimization */}
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
        
        onApply={() => {
          triggerHapticFeedback('light');
          setFiltersOpen(false);
        }}
        onReset={resetFilters}
        
        allPlaques={allPlaques}
        isPlaqueVisited={isPlaqueVisited}
        isFavorite={isFavorite}
        distanceFilter={distanceFilter}
      />
      
      {/* Mobile Quick Actions Dialog */}
      <MobileDialog
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="Quick Actions"
        size="sm"
      >
        <div className="p-4 space-y-3">
          <MobileButton
            onClick={() => {
              setShowQuickActions(false);
              handleQuickLocationAccess();
            }}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <Navigation size={16} className="mr-3" />
            Find Plaques Near Me
          </MobileButton>
          
          <MobileButton
            onClick={() => {
              setShowQuickActions(false);
              setFiltersOpen(true);
            }}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <Filter size={16} className="mr-3" />
            Open Filters
          </MobileButton>
          
          <MobileButton
            onClick={() => {
              setShowQuickActions(false);
              resetFilters();
            }}
            className="w-full justify-start"
            variant="outline"
            touchOptimized
          >
            <X size={16} className="mr-3" />
            Clear All Filters
          </MobileButton>
          
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Switch View</p>
            <div className="grid grid-cols-3 gap-2">
              <MobileButton
                variant={urlState.view === 'list' ? 'default' : 'outline'}
                onClick={() => {
                  setShowQuickActions(false);
                  handleViewModeChange('list');
                }}
                size="sm"
                touchOptimized
              >
                <List size={14} />
              </MobileButton>
              <MobileButton
                variant={urlState.view === 'grid' ? 'default' : 'outline'}
                onClick={() => {
                  setShowQuickActions(false);
                  handleViewModeChange('grid');
                }}
                size="sm"
                touchOptimized
              >
                <Grid size={14} />
              </MobileButton>
              <MobileButton
                variant={urlState.view === 'map' ? 'default' : 'outline'}
                onClick={() => {
                  setShowQuickActions(false);
                  handleViewModeChange('map');
                }}
                size="sm"
                touchOptimized
              >
                <MapPin size={14} />
              </MobileButton>
            </div>
          </div>
        </div>
      </MobileDialog>
      
      {/* Enhanced Plaque Detail Modal with URL state */}
      {selectedPlaque && (
        <PlaqueDetail
          plaque={selectedPlaque}
          isOpen={!!selectedPlaque}
          onClose={handleCloseModal}
          isFavorite={isFavorite(selectedPlaque.id)}
          nearbyPlaques={getNearbyPlaques(selectedPlaque)}
          onSelectNearbyPlaque={handleSelectNearbyPlaque}
          isMapView={urlState.view === 'map'}
          distance={distanceFilter.enabled ? getDistanceFromActiveLocation(selectedPlaque) : undefined}
          formatDistance={formatDistance}
          showDistance={distanceFilter.enabled}
          generateShareUrl={generatePlaqueUrl}
          currentPath={location.pathname}
        />
      )}

      {/* Collection action dialog for pending actions */}
      {pendingCollectionPlaque && (
        <AddToCollectionDialog
          isOpen={!!pendingCollectionPlaque}
          onClose={() => setPendingCollectionPlaque(null)}
          plaque={pendingCollectionPlaque}
        />
      )}
    </PageContainer>
  );
};

export default Discover;