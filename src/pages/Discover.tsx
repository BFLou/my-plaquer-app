// src/pages/Discover.tsx - Enhanced with standardized visit functionality
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Pagination from '@/components/plaques/Pagination';
import DiscoverFilterDialog from '../components/plaques/DiscoverFilterDialog';
import DiscoverHeader from '../components/discover/DiscoverHeader';
import DiscoverFilters from '../components/discover/DiscoverFilters';
import { MapContainer } from '../components/maps/MapContainer';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useFavorites } from '@/hooks/useFavorites';
import { calculateDistance } from '../components/maps/utils/routeUtils';
import { useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { generatePlaqueUrl } from '@/utils/urlUtils';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

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
  const location = useLocation();
  
  // ENHANCED: Better URL state parsing with modal support
  const urlState = useMemo(() => {
    const state = {
      view: (searchParams.get('view') as ViewMode) || 'grid',
      search: searchParams.get('search') || '',
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
      postcodes: searchParams.get('postcodes')?.split(',').filter(Boolean) || [],
      professions: searchParams.get('professions')?.split(',').filter(Boolean) || [],
      onlyVisited: searchParams.get('visited') === 'true',
      onlyFavorites: searchParams.get('favorites') === 'true',
      // NEW: Modal plaque support
      modalPlaque: searchParams.get('plaque') ? parseInt(searchParams.get('plaque')!) : null,
    };
    
    console.log('URL State parsed:', state);
    return state;
  }, [searchParams]);

  // ENHANCED: URL state update function with modal support
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
      onlyVisited: 'visited',
      onlyFavorites: 'favorites',
      modalPlaque: 'plaque' // NEW: Modal plaque parameter
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

  // Basic state
  const [allPlaques, setAllPlaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaque, setSelectedPlaque] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // NEW: Standardized visit dialog state
  const [quickVisitPlaque, setQuickVisitPlaque] = useState(null);
  const [visitDate, setVisitDate] = useState(new Date());
  const [visitNotes, setVisitNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isProcessingVisit, setIsProcessingVisit] = useState(false);

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

  // NEW: Handle modal plaque from URL
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

  // NEW: Enhanced event handlers with modal URL state
  const handlePlaqueClick = useCallback((plaque) => {
    console.log('Plaque clicked in Discover:', plaque.title);
    // Update URL with modal plaque parameter for back button support
    updateUrlState({ modalPlaque: plaque.id });
  }, [updateUrlState]);

  // NEW: Enhanced modal close handler
  const handleCloseModal = useCallback(() => {
    console.log('Closing plaque modal');
    setSelectedPlaque(null);
    // Remove plaque parameter from URL
    updateUrlState({ modalPlaque: null });
  }, [updateUrlState]);

  const handleFavoriteToggle = useCallback((id) => {
    console.log('Toggle favorite for plaque:', id);
    toggleFavorite(id);
  }, [toggleFavorite]);

  // NEW: Standardized mark visited handler
  const handleMarkVisited = useCallback((id) => {
    console.log('Opening visit dialog for plaque:', id);
    const plaque = allPlaques.find(p => p.id === id);
    if (plaque && !isPlaqueVisited(id)) {
      setQuickVisitPlaque(plaque);
      setVisitDate(new Date()); // Reset to today
      setVisitNotes(''); // Clear notes
    }
  }, [allPlaques, isPlaqueVisited]);

  // NEW: Standardized visit submission handler
// In Discover.tsx - Replace the handleVisitSubmit function

const handleVisitSubmit = async () => {
  if (!quickVisitPlaque) return;
  
  setIsProcessingVisit(true);
  try {
    console.log('🎯 Discover submitting visit:', {
      plaqueId: quickVisitPlaque.id,
      selectedDate: visitDate,
      formatted: format(visitDate, 'PPP')
    });

    await markAsVisited(quickVisitPlaque.id, {
      visitedAt: visitDate.toISOString(),
      notes: visitNotes,
    });
    
    toast.success(`Marked "${quickVisitPlaque.title}" as visited on ${format(visitDate, 'PPP')}`);
    setQuickVisitPlaque(null); // Close dialog
    
    // FIXED: No need to call any callbacks - the hook updates state automatically
    
  } catch (error) {
    console.error("Error marking as visited:", error);
    toast.error("Failed to mark as visited");
  } finally {
    setIsProcessingVisit(false);
  }
};

  // Enhanced filter handlers with proper state updates
  const handleVisitedChange = useCallback((value: boolean) => {
    console.log('=== VISITED CHANGE ===');
    console.log('New visited value:', value);
    updateUrlState({ onlyVisited: value });
    setCurrentPage(1);
  }, [updateUrlState]);

  const handleFavoritesChange = useCallback((value: boolean) => {
    console.log('=== FAVORITES CHANGE ===');
    console.log('New favorites value:', value);
    updateUrlState({ onlyFavorites: value });
    setCurrentPage(1);
  }, [updateUrlState]);

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
      modalPlaque: null // Also clear modal
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

  // NEW: Handle nearby plaque selection in modal
  const handleSelectNearbyPlaque = useCallback((nearbyPlaque) => {
    console.log('Selecting nearby plaque:', nearbyPlaque.title);
    // Update URL to new plaque
    updateUrlState({ modalPlaque: nearbyPlaque.id });
  }, [updateUrlState]);

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
      // NEW: Always use modal navigation mode in discover
      navigationMode: 'modal' as const,
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
      
      {/* Enhanced Filter Dialog with proper toggle handlers */}
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
      

{/* Enhanced Plaque Detail Modal with URL state */}
{selectedPlaque && (
  <PlaqueDetail
    plaque={selectedPlaque}
    isOpen={!!selectedPlaque}
    onClose={handleCloseModal}
    isFavorite={isFavorite(selectedPlaque.id)}
    onFavoriteToggle={handleFavoriteToggle}
    // FIXED: Remove onMarkVisited prop to prevent callback loops
    // onMarkVisited={handleMarkVisited}  // Remove this line
    nearbyPlaques={getNearbyPlaques(selectedPlaque)}
    onSelectNearbyPlaque={handleSelectNearbyPlaque}
    isMapView={urlState.view === 'map'}
    distance={distanceFilter.enabled ? getDistanceFromActiveLocation(selectedPlaque) : undefined}
    formatDistance={formatDistance}
    showDistance={distanceFilter.enabled}
    generateShareUrl={generatePlaqueUrl}
    context="discover"
    currentPath={location.pathname}
  />
)}

      {/* NEW: Standardized Visit Dialog */}
      {quickVisitPlaque && (
        <Dialog open={!!quickVisitPlaque} onOpenChange={() => setQuickVisitPlaque(null)}>
          <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Mark "{quickVisitPlaque.title}" as Visited</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visit-date">Visit Date</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      id="visit-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(visitDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={visitDate}
                      onSelect={(date) => {
                        if (date) {
                          setVisitDate(date);
                          setShowCalendar(false);
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-notes">Notes (optional)</Label>
                <Textarea
                  id="visit-notes"
                  placeholder="Any thoughts about your visit?"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  rows={3}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setQuickVisitPlaque(null)}
                disabled={isProcessingVisit}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVisitSubmit}
                disabled={isProcessingVisit}
              >
                {isProcessingVisit ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    Saving...
                  </>
                ) : (
                  'Mark as Visited'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
};

export default Discover;