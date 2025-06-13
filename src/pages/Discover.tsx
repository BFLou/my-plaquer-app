// src/pages/Discover.tsx - COMPLETE FIXED VERSION with organisations and subjectTypes
import { useState, useEffect, useMemo, useCallback } from "react";
import { capitalizeWords } from '@/utils/stringUtils';
import { adaptPlaquesData } from "@/utils/plaqueAdapter";
import plaqueData from '../data/plaque_data.json';
import { PlaqueCard } from "@/components/plaques/PlaqueCard";
import { PlaqueListItem } from "@/components/plaques/PlaqueListItem";
import { PlaqueDetail } from "@/components/plaques/PlaqueDetail";
import { EmptyState } from "@/components/common/EmptyState";
import { MobileButton } from "@/components/ui/mobile-button";
import { MobileDialog } from "@/components/ui/mobile-dialog";
import { PageContainer } from '@/components';
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
import '../components/maps/features/UnifiedControlPanel.css';

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
      organisations: searchParams.get('organisations')?.split(',').filter(Boolean) || [],
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
      organisations: 'organisations',
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
  const [organisationOptions, setOrganisationOptions] = useState<FilterOption[]>([]);

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
    const organisationCount: Record<string, number> = {};
      
adaptedData.forEach(plaque => {
  // Postcode counting
  if (plaque.postcode && plaque.postcode !== "Unknown") {
    postcodeCount[plaque.postcode] = (postcodeCount[plaque.postcode] || 0) + 1;
  }
  
  // Color counting
  const color = plaque.color?.toLowerCase();
  if (color && color !== "unknown") {
    colorCount[color] = (colorCount[color] || 0) + 1;
  }
  
  // Profession counting
  if (plaque.profession && plaque.profession !== "Unknown") {
    professionCount[plaque.profession] = (professionCount[plaque.profession] || 0) + 1;
  }

 // Organisation counting - handle both array and string formats
      if ((plaque as any).organisations && 
          (plaque as any).organisations !== "Unknown" && 
          (plaque as any).organisations !== "[]" &&
          (plaque as any).organisations !== "") {
        
        const orgField = (plaque as any).organisations;
        
        try {
          // Try to parse as JSON array first
          const orgs = JSON.parse(orgField);
          if (Array.isArray(orgs) && orgs.length > 0) {
            orgs.forEach(org => {
              if (org && typeof org === 'string' && org.trim()) {
                const cleanOrg = org.trim();
                organisationCount[cleanOrg] = (organisationCount[cleanOrg] || 0) + 1;
              }
            });
          }
        } catch (e) {
          // If it's not valid JSON, treat as single organisation string
          if (typeof orgField === 'string' && orgField.trim() && orgField !== "[]") {
            const cleanOrg = orgField.trim();
            organisationCount[cleanOrg] = (organisationCount[cleanOrg] || 0) + 1;
          }
        }
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

       setOrganisationOptions(
      Object.entries(organisationCount)
        .map(([value, count]) => ({
          label: value, // Don't capitalize organisations as they may be proper names
          value,
          count
        }))
        .sort((a, b) => b.count - a.count)
    );
    
      console.log('Filter options generated:');
    console.log('Organisations:', Object.keys(organisationCount).length);
    console.log('Sample organisations:', Object.keys(organisationCount).slice(0, 5));
    
      
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
    professions: urlState.professions,
    organisations: urlState.organisations
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
    
    // Organisation filter - use correct field name and handle array format
    const matchesOrganisation = urlState.organisations.length === 0 || (() => {
      const orgField = (plaque as any).organisations;
      if (!orgField || orgField === "[]" || orgField === "Unknown" || orgField === "") return false;
      
      try {
        // Try to parse as JSON array
        const orgs = JSON.parse(orgField);
        if (Array.isArray(orgs)) {
          return orgs.some(org => 
            typeof org === 'string' && 
            urlState.organisations.includes(org.trim())
          );
        }
      } catch (e) {
        // If not valid JSON, treat as single organisation
        if (typeof orgField === 'string') {
          return urlState.organisations.includes(orgField.trim());
        }
      }
      return false;
    })();
    
    // Enhanced boolean filtering for visited and favorites
    const plaqueIsVisited = plaque.visited || isPlaqueVisited(plaque.id);
    const plaqueIsFavorite = isFavorite(plaque.id);
    
    const matchesVisited = !urlState.onlyVisited || plaqueIsVisited;
    const matchesFavorite = !urlState.onlyFavorites || plaqueIsFavorite;

    const result = matchesSearch && 
           matchesPostcode && 
           matchesColor && 
           matchesProfession && 
           matchesOrganisation &&
           matchesVisited && 
           matchesFavorite;

    // Debug individual plaque filtering
    if (urlState.organisations.length > 0) {
      console.log(`Plaque ${plaque.id} (${plaque.title}):`, {
        matchesOrganisation,
        orgField: (plaque as any).organisations,
        result
      });
    }

    return result;
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
           urlState.organisations.length +
           (urlState.onlyVisited ? 1 : 0) + 
           (urlState.onlyFavorites ? 1 : 0) +
           (distanceFilter.enabled ? 1 : 0);
  }, [
    urlState.postcodes.length,
    urlState.colors.length,
    urlState.professions.length,
    urlState.organisations.length,
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
      organisations: [],
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

  // Render content with proper layout hierarchy
  const renderContent = () => {
    if (loading) {
      return urlState.view === 'map' ? (
        <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 md:h-10 md:w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-sm md:text-base">Loading map...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 md:h-64 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (urlState.view === 'map') {
      return (
        <div className="w-full h-full">
          <MapContainer
            plaques={filteredPlaques}
            onPlaqueClick={handlePlaqueClick}
            className="w-full h-full"
            onDistanceFilterChange={handleDistanceFilterChange}
            distanceFilter={distanceFilter}
            isPlaqueVisited={isPlaqueVisited}
            isFavorite={isFavorite}
            onRouteAction={handlePendingRouteAction}
          />
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
      );
    }

    const commonProps = {
      showDistance: distanceFilter.enabled,
      formatDistance,
      navigationMode: 'modal' as const,
    };

    if (urlState.view === 'grid') {
      return (
        <>
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
            <div className="mb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  triggerHapticFeedback('light');
                  setCurrentPage(page);
                  
                  if (isMobile()) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              />
            </div>
          )}
        </>
      );
    }

    if (urlState.view === 'list') {
      return (
        <>
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
            <div className="mb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  triggerHapticFeedback('light');
                  setCurrentPage(page);
                  
                  if (isMobile()) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              />
            </div>
          )}
        </>
      );
    }
  };

  // Calculate proper layout heights based on view mode
  const getLayoutClasses = () => {
    if (urlState.view === 'map') {
      return {
        container: "flex flex-col h-screen overflow-hidden",
        content: "flex-1 min-h-0",
        scrollable: false
      };
    } else {
      return {
        container: "min-h-screen",
        content: "flex-1",
        scrollable: true
      };
    }
  };

  const layoutClasses = getLayoutClasses();

  return (
    <PageContainer 
      activePage="discover"
      simplifiedFooter={true}
      hideNavBar={false}
      hideMobileNav={false}
      paddingBottom="mobile-nav"
      className="discover-page-container"
    >
      <div className={`discover-content ${layoutClasses.container} ${isKeyboardOpen ? 'keyboard-open' : ''}`}>
        {/* Pending Action Handler */}
        <PendingActionHandler 
          onCollectionAction={handlePendingCollectionAction}
          onRouteAction={handlePendingRouteAction}
        />
        
{/* Header with compact spacing */}
<div className="flex-shrink-0 bg-white border-b border-gray-200 sticky top-0 z-30"> {/* Remove md:top-[61px] */}
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
  
          {/* Active filters display */}
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
    professionOptions,
    organisationOptions
  }}
  onApplyFilters={(filters) => updateUrlState(filters)}
  distanceFilter={distanceFilter}
  onClearDistanceFilter={handleClearDistanceFilter}
  allPlaques={allPlaques}
  totalPlaqueCount={allPlaques.length}
  filteredPlaqueCount={filteredPlaques.length}
  showSuggestions={false}
/>
        </div>
        
        {/* Main content area with proper scroll handling */}
        <div className={`${layoutClasses.content} relative`}>
          {urlState.view === 'map' ? (
            <div className="w-full h-full relative">
              {renderContent()}
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="container mx-auto px-4 py-3 md:py-4">
                {/* Results header */}
                <div className={`flex justify-between items-center mb-3 md:mb-4 ${isMobile() ? 'pr-20' : ''}`}>
                  <h2 className="text-sm md:text-base font-medium text-gray-600 flex-1 min-w-0">
                    {loading ? "Loading plaques..." : (
                      <>
                        <span className="block md:inline">
                          {filteredPlaques.length} {filteredPlaques.length === 1 ? 'Plaque' : 'Plaques'} found
                        </span>
                        {distanceFilter.enabled && distanceFilter.locationName && (
                          <span className="block md:inline ml-0 md:ml-2 text-green-600 text-xs md:text-sm mt-1 md:mt-0">
                            within {formatDistance(distanceFilter.radius)} of {distanceFilter.locationName}
                          </span>
                        )}
                      </>
                    )}
                  </h2>
                </div>
                
                <div className="pb-20 md:pb-8">
                  {renderContent()}
                </div>
              </div>
            </div>
          )}
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

          organisations={organisationOptions}
          selectedOrganisations={urlState.organisations}
          onOrganisationsChange={(values) => updateUrlState({ organisations: values })}
          
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
        
        {/* Plaque Detail Modal with URL state */}
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
      </div>
    </PageContainer>
  );
};

export default Discover;