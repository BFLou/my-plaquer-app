// src/components/maps/PlaqueMap.tsx
import React, { useState, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import { Button } from "@/components/ui/button";
import { Search, MapPin } from 'lucide-react';

// Import sub-components
import MapContainer from './containers/MapContainer';
import MapControls from './controls/MapControls';
import RoutePanel from './controls/RoutePanel';
import FilterPanel from './controls/FilterPanel';
import LocationSearchPanel from './controls/LocationSearchPanel';

// Import hooks and utilities
import useMapInitialization from './hooks/useMapInitialization';
import useMapMarkers from './hooks/useMapMarkers';
import useMapOperations from './hooks/useMapOperations';
import useRouteManagement from './hooks/useRouteManagement';

// API key - use environment variable with fallback
const ORS_API_KEY = process.env.REACT_APP_ORS_API_KEY;

/**
 * PlaqueMap Component
 * A comprehensive map component for displaying plaques with routing functionality
 */
const PlaqueMap = React.forwardRef(({
  plaques = [],
  onPlaqueClick = () => {},
  favorites = [],
  selectedPlaqueId = null,
  maintainView = false,
  className = '',
  isRoutingMode = false,
  setIsRoutingMode = () => {},
  routePoints = [],
  addPlaqueToRoute = () => {},
  removePlaqueFromRoute = () => {},
  clearRoute = () => {},
  exportRoute = () => {},
  saveRoute = () => {}
}, ref) => {
  // Refs
  const mapContainerRef = useRef(null);
  
  // Component state
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [useImperial, setUseImperial] = useState(false);
  const [useRoadRouting, setUseRoadRouting] = useState(true);
  const [filteredPlaquesCount, setFilteredPlaquesCount] = useState(0);
  const [maxDistance, setMaxDistance] = useState(3.0);
  const [toast, setToastMessage] = useState(null);
  
  // Initialize map using the custom hook
  const { 
    mapLoaded, 
    mapError, 
    mapInstance, 
    isScriptLoaded 
  } = useMapInitialization(mapContainerRef);
  
  // Show toast messages
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Use map markers management hook
  const { 
    markersMap,
    redrawMarkers
  } = useMapMarkers(
    mapInstance,
    plaques,
    favorites,
    selectedPlaqueId,
    isRoutingMode,
    onPlaqueClick,
    addPlaqueToRoute,
    maintainView
  );
  
  // Use route management hook
  const {
    isDrawingRoute,
    drawWalkingRoute,
    optimizeRouteForWalking,
    calculateRouteDistance,
    formatDistance,
    calculateWalkingTime
  } = useRouteManagement({
    mapInstance,
    routePoints,
    useRoadRouting,
    useImperial,
    API_KEY: ORS_API_KEY,
    onRouteChange: (newRoute) => {
      // This would be handled by the parent component via the existing props
    }
  });
  
  // Use map operations hook for location search, filtering, etc.
  const {
    findUserLocation,
    applyDistanceFilter,
    resetFilters,
    drawRoute,
    searchPlaceByAddress
  } = useMapOperations(
    mapInstance,
    plaques,
    maxDistance,
    setIsLoadingLocation,
    setFilteredPlaquesCount,
    routePoints,
    setUserLocation
  );
  
  // Toggle routing mode
  const handleToggleRoutingMode = () => {
    const newRoutingMode = !isRoutingMode;
    setIsRoutingMode(newRoutingMode);
    
    if (newRoutingMode) {
      setShowRoutePanel(true);
      showToast("Route planning mode activated. Click on plaques to add them to your route.", "success");
    } else {
      clearRoute();
      setShowRoutePanel(false);
    }
  };
  
  // Reset map view
  const resetMap = () => {
    if (mapInstance) {
      mapInstance.setView([51.505, -0.09], 13);
    }
  };
  
  // Handle location search
  const handleLocationSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setShowLocationSearch(false);
    showToast("Searching for location...", "info");
    
    const success = await searchPlaceByAddress(searchQuery);
    if (!success) {
      showToast("Couldn't find that location. Please try a different search.", "error");
    }
  };
  
  // Expose methods to the parent component via ref
  React.useImperativeHandle(ref, () => ({
    drawRouteLine: (points) => drawWalkingRoute(points, useRoadRouting),
    clearRoute,
    findUserLocation,
    fitToMarkers: () => {
      if (mapInstance && plaques.length > 0) {
        const bounds = getBoundsFromPlaques(plaques);
        if (bounds) mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }
    },
    fitRoute: (points) => {
      if (mapInstance && points && points.length >= 2) {
        const bounds = getBoundsFromPlaques(points);
        if (bounds) mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }));
  
  // Helper to get bounds from plaque points
  const getBoundsFromPlaques = (plaquesArray) => {
    if (!mapInstance || !plaquesArray.length) return null;
    
    const validPlaques = plaquesArray.filter(p => p.latitude && p.longitude);
    if (!validPlaques.length) return null;
    
    const latLngs = validPlaques.map(p => [
      parseFloat(p.latitude), 
      parseFloat(p.longitude)
    ]);
    
    return window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <MapContainer
        ref={mapContainerRef}
        mapLoaded={mapLoaded}
        isDrawingRoute={isDrawingRoute}
        isRoutingMode={isRoutingMode}
      />
      
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
      
      {/* Map Controls */}
      <MapControls
        isLoadingLocation={isLoadingLocation}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        isRoutingMode={isRoutingMode}
        toggleRoutingMode={handleToggleRoutingMode}
        findUserLocation={findUserLocation}
        hasUserLocation={!!userLocation}
        routePointsCount={routePoints.length}
        resetMap={resetMap}
      />
      
      {/* Route Panel */}
      {isRoutingMode && showRoutePanel && (
        <RoutePanel 
          routePoints={routePoints}
          removePlaqueFromRoute={removePlaqueFromRoute}
          clearRoute={clearRoute}
          exportRoute={exportRoute}
          saveRoute={saveRoute}
          formatDistance={formatDistance}
          calculateWalkingTime={calculateWalkingTime}
          optimizeRoute={optimizeRouteForWalking}
          useImperial={useImperial}
          setUseImperial={setUseImperial}
          useRoadRouting={useRoadRouting}
          setUseRoadRouting={setUseRoadRouting}
          onClose={() => setShowRoutePanel(false)}
        />
      )}
      
      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          maxDistance={maxDistance}
          setMaxDistance={setMaxDistance}
          filteredPlaquesCount={filteredPlaquesCount}
          applyFilter={applyDistanceFilter}
          closeFilters={() => setShowFilters(false)}
          resetFilters={resetFilters}
          hasUserLocation={!!userLocation}
        />
      )}
      
      {/* Location Search Panel */}
      {showLocationSearch && (
        <LocationSearchPanel
          onSearch={handleLocationSearch}
          onClose={() => setShowLocationSearch(false)}
          isLoading={isLoadingLocation}
        />
      )}
      
      {/* Map attribution */}
      <div className="absolute bottom-1 right-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | <a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">OpenRouteService</a>
      </div>
      
      {/* Toast notifications */}
      {toast && (
        <div className={`map-toast ${toast.type}`}>
          <div className="text-sm">
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
});

export default PlaqueMap;