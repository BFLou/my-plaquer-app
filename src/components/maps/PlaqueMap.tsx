// src/components/maps/PlaqueMap.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Plaque } from '@/types/plaque';
import MapControls from './controls/MapControls';
import FilterPanel from './controls/FilterPanel';
import RoutePanel from './controls/RoutePanel';
import LocationSearchPanel from './controls/LocationSearchPanel';
import useMapInitialization from './hooks/useMapInitialization';
import useMapMarkers from './hooks/useMapMarkers';
import useMapOperations from './hooks/useMapOperations';
import { Search, MapPin, CornerUpLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

type PlaqueMapProps = {
  plaques: Plaque[];
  onPlaqueClick: (plaque: Plaque) => void;
  favorites?: number[];
  selectedPlaqueId?: number | null;
  maintainView?: boolean;
  className?: string;
};

const PlaqueMap: React.FC<PlaqueMapProps> = ({
  plaques,
  onPlaqueClick,
  favorites = [],
  selectedPlaqueId,
  maintainView = false,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [maxDistance, setMaxDistance] = useState(2);
  const [filteredPlaquesCount, setFilteredPlaquesCount] = useState(0);
  const [showClearRouteDialog, setShowClearRouteDialog] = useState(false);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routePoints, setRoutePoints] = useState<Plaque[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Initialize map with stable configuration
  const { mapInstance, mapLoaded } = useMapInitialization(
    mapContainerRef, 
    { 
      disableAutomaticZoom: true,
      zoom: 13,
      center: [51.505, -0.09], // London coordinates as default
      minZoom: 4,
      maxZoom: 18
    }
  );
  
  // Setup map markers
  const { redrawMarkers } = useMapMarkers(
    mapInstance, 
    plaques, 
    favorites, 
    selectedPlaqueId,
    isRoutingMode, 
    onPlaqueClick,
    addPlaqueToRoute,
    maintainView
  );
  
  // Setup map operations
  const { 
    findUserLocation,
    applyDistanceFilter,
    resetFilters,
    exportRoute,
    saveRoute,
    drawRoute,
    clearRoute,
    searchPlaceByAddress
  } = useMapOperations(
    mapInstance,
    plaques,
    maxDistance,
    setIsLoadingLocation,
    setFilteredPlaquesCount,
    routePoints,
    setRoutePoints,
    setUserLocation
  );

  // Add plaque to route
  function addPlaqueToRoute(plaque: Plaque) {
    // Check if plaque is already in route
    if (routePoints.some(p => p.id === plaque.id)) {
      toast.info("This plaque is already in your route");
      return;
    }
    
    // Add to route points
    setRoutePoints(prevPoints => {
      const newPoints = [...prevPoints, plaque];
      // Redraw route if we have at least 2 points
      if (newPoints.length >= 2 && mapInstance) {
        drawRoute(newPoints);
      }
      return newPoints;
    });
    
    toast.success(`Added "${plaque.title}" to route`);
  }

  // Remove plaque from route
  function removePlaqueFromRoute(plaque: Plaque) {
    setRoutePoints(prevPoints => {
      // Remove the plaque from route
      const newPoints = prevPoints.filter(p => p.id !== plaque.id);
      
      // Redraw route if we still have at least 2 points
      if (newPoints.length >= 2 && mapInstance) {
        drawRoute(newPoints);
      } else if (newPoints.length < 2 && mapInstance) {
        // Clear route line if less than 2 points
        clearRoute(false); // Don't clear route points array
      }
      
      return newPoints;
    });
    
    toast.info(`Removed "${plaque.title}" from route`);
  }

  // Toggle routing mode
  function toggleRoutingMode() {
    if (isRoutingMode && routePoints.length > 0) {
      setShowClearRouteDialog(true);
      return;
    }
    
    setIsRoutingMode(!isRoutingMode);
    
    if (!isRoutingMode) {
      toast.info("Route planning mode activated. Click on plaques to add them to your route.");
    }
  }
  
  // Handle location search
  const handleLocationSearch = async (address: string) => {
    setIsLoadingLocation(true);
    try {
      const result = await searchPlaceByAddress(address);
      if (result) {
        toast.success(`Location found: ${address}`);
        setShowLocationSearch(false);
      } else {
        toast.error("Could not find the location. Please try a different address.");
      }
    } catch (error) {
      toast.error("Error searching for location");
    } finally {
      setIsLoadingLocation(false);
    }
  };
  
  // Apply distance filter
  const handleApplyFilter = () => {
    if (userLocation) {
      applyDistanceFilter();
      setShowFilters(false);
      
      // Update active filters
      setActiveFilters(prev => {
        const newFilters = prev.filter(f => !f.includes("Distance:"));
        return [...newFilters, `Distance: ${maxDistance}km`];
      });
    } else {
      toast.error("Please find your location first before applying distance filters");
    }
  };
  
  // Reset distance filter
  const handleResetFilter = () => {
    resetFilters();
    setActiveFilters(prev => prev.filter(f => !f.includes("Distance:")));
    setShowFilters(false);
  };
  
  // Effect to redraw markers when isRoutingMode changes
  useEffect(() => {
    if (mapInstance && mapLoaded) {
      redrawMarkers();
    }
  }, [isRoutingMode, mapLoaded, redrawMarkers, mapInstance]);
  
  // Effect to mark map as initialized once loaded
  useEffect(() => {
    if (mapLoaded && !mapInitialized) {
      setMapInitialized(true);
    }
  }, [mapLoaded, mapInitialized]);
  
  // Effect to draw route when routePoints change
  useEffect(() => {
    if (mapInstance && routePoints.length >= 2 && isRoutingMode) {
      drawRoute(routePoints);
    }
  }, [mapInstance, routePoints, isRoutingMode, drawRoute]);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-md"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map overlay for loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-medium text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Active filters display */}
      {activeFilters.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-lg shadow-md px-3 py-2 max-w-xs">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-gray-500">Active filters:</div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={handleResetFilter}
              title="Reset filters"
            >
              <CornerUpLeft size={14} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {activeFilters.map((filter, i) => (
              <div key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                {filter}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Search location button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <Button 
          variant="default" 
          size="sm" 
          className="h-9 shadow-md flex items-center gap-2 px-4 bg-white text-gray-700 border-0 hover:bg-gray-50"
          onClick={() => setShowLocationSearch(true)}
        >
          <Search size={16} />
          <span>Search location</span>
          <MapPin size={16} className="text-gray-400" />
        </Button>
      </div>
      
      {/* Map controls */}
      <MapControls 
        isLoadingLocation={isLoadingLocation}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        isRoutingMode={isRoutingMode}
        toggleRoutingMode={toggleRoutingMode}
        findUserLocation={findUserLocation}
        hasUserLocation={!!userLocation}
        routePointsCount={routePoints.length}
      />
      
      {/* Filter panel */}
      {showFilters && (
        <FilterPanel 
          maxDistance={maxDistance}
          setMaxDistance={setMaxDistance}
          filteredPlaquesCount={filteredPlaquesCount}
          applyFilter={handleApplyFilter}
          closeFilters={() => setShowFilters(false)}
          resetFilters={handleResetFilter}
          hasUserLocation={!!userLocation}
        />
      )}
      
      {/* Location search panel */}
      {showLocationSearch && (
        <LocationSearchPanel
          onSearch={handleLocationSearch}
          onClose={() => setShowLocationSearch(false)}
          isLoading={isLoadingLocation}
        />
      )}
      
      {/* Route Panel */}
      {isRoutingMode && (
        <RoutePanel 
          routePoints={routePoints}
          onRemovePoint={removePlaqueFromRoute}
          onReorderPoints={(newPoints) => {
            setRoutePoints(newPoints);
            if (newPoints.length >= 2) {
              drawRoute(newPoints);
            }
          }}
          onExportRoute={exportRoute}
          onSaveRoute={saveRoute}
          onClose={() => {
            if (routePoints.length > 0) {
              setShowClearRouteDialog(true);
            } else {
              setIsRoutingMode(false);
            }
          }}
        />
      )}
      
      {/* Confirmation dialog for clearing route */}
      <AlertDialog 
        open={showClearRouteDialog} 
        onOpenChange={setShowClearRouteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear your current route? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              clearRoute(true);
              setIsRoutingMode(false);
              setShowClearRouteDialog(false);
            }}>
              Clear Route
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Map attribution */}
      <div className="absolute bottom-1 right-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default PlaqueMap;