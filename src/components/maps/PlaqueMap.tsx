// src/components/maps/PlaqueMap.tsx - Final version with proper location handling
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plaque } from '@/types/plaque';
import { Button } from "@/components/ui/button";
import { Search, MapPin, Layers } from 'lucide-react';

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
const ORS_API_KEY = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ORS_API_KEY) 
  ? process.env.REACT_APP_ORS_API_KEY 
  : '5b3ce3597851110001cf6248e79bd734efe449838ac44dccb5a5f551';

/**
 * PlaqueMap Component with proper location and filter handling
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
  const [toast, setToastMessage] = useState(null);
  const [activeBaseMap, setActiveBaseMap] = useState('street');
  const [maxDistance, setMaxDistance] = useState(1);
  
  // Initialize map using the custom hook
  const { 
    mapLoaded, 
    mapError, 
    mapInstance, 
    isScriptLoaded,
    setBaseMap
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
    calculateWalkingTime,
    clearRoute: clearRouteFromHook
  } = useRouteManagement({
    mapInstance,
    routePoints,
    useRoadRouting,
    useImperial,
    API_KEY: ORS_API_KEY,
    onRouteChange: (newRoute) => {
      // This callback should update the parent component's route state
    }
  });
  
  // Use map operations hook for location search, filtering, etc.
  const {
    findUserLocation,
    setSearchLocation,
    applyDistanceFilter,
    resetFilters,
    drawRoute,
    searchPlaceByAddress,
    activeLocation,
    locationType
  } = useMapOperations(
    mapInstance,
    plaques,
    maxDistance,
    setIsLoadingLocation,
    setFilteredPlaquesCount,
    routePoints,
    setUserLocation,
    useImperial
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
  
  // Handle location search with proper coordinate handling
  const handleLocationSearch = useCallback(async (searchQuery, coordinates) => {
    if (!searchQuery.trim()) return;
    
    setShowLocationSearch(false);
    showToast("Setting location...", "info");
    
    let success = false;
    
    if (coordinates) {
      // Direct coordinates from autocomplete selection
      try {
        setSearchLocation(coordinates, searchQuery);
        success = true;
        
        showToast("Location set! Distance filter is now available.", "success");
        
        // Show filter panel after a short delay
        setTimeout(() => {
          setShowFilters(true);
        }, 1500);
        
      } catch (error) {
        console.error('Error setting search location:', error);
        success = false;
      }
    } else {
      // Fallback to address search
      success = await searchPlaceByAddress(searchQuery);
      
      if (success) {
        showToast("Location found! Distance filter is now available.", "success");
        setTimeout(() => {
          setShowFilters(true);
        }, 1500);
      }
    }
    
    if (!success) {
      showToast("Couldn't find that location. Please try a different search.", "error");
    }
  }, [setSearchLocation, searchPlaceByAddress, setShowLocationSearch, setShowFilters]);

  // Custom zoom controls
  const zoomIn = useCallback(() => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom();
      mapInstance.setZoom(currentZoom + 1);
    }
  }, [mapInstance]);

  const zoomOut = useCallback(() => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom();
      mapInstance.setZoom(currentZoom - 1);
    }
  }, [mapInstance]);

  // Change base map
  const changeBaseMap = useCallback((mapType) => {
    setActiveBaseMap(mapType);
    if (setBaseMap && mapInstance) {
      setBaseMap(mapInstance, mapType);
    }
  }, [mapInstance, setBaseMap]);
  
  // Enhanced find user location with proper state management
  const handleFindUserLocation = useCallback(() => {
    findUserLocation();
    // Show filter panel after location is found
    setTimeout(() => {
      if (activeLocation && locationType === 'user') {
        setShowFilters(true);
      }
    }, 2000);
  }, [findUserLocation, activeLocation, locationType]);
  
  // Expose methods to the parent component via ref
  React.useImperativeHandle(ref, () => ({
    drawRouteLine: (points, useRoadRoutingParam = useRoadRouting, maintainView = false) => 
      drawWalkingRoute(points, useRoadRoutingParam, maintainView),
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
    },
    zoomIn,
    zoomOut,
    changeBaseMap
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
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
        <Button 
          variant="default" 
          size="sm" 
          className="h-10 shadow-lg flex items-center gap-2 px-4 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200"
          onClick={() => setShowLocationSearch(true)}
        >
          <Search size={16} />
          <span className="font-medium">Search location</span>
        </Button>
      </div>
      
      {/* Active location indicator */}
      {activeLocation && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[999] bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
          {locationType === 'user' ? '📍 Current Location' : '🔍 Search Location'} • Filter Available
        </div>
      )}
      
      {/* Map Controls */}
      <MapControls
        isLoadingLocation={isLoadingLocation}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        isRoutingMode={isRoutingMode}
        toggleRoutingMode={handleToggleRoutingMode}
        findUserLocation={handleFindUserLocation}
        hasUserLocation={!!activeLocation}
        routePointsCount={routePoints.length}
        resetMap={resetMap}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        activeBaseMap={activeBaseMap}
        changeBaseMap={changeBaseMap}
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
      
      {/* Filter Panel - Only shows when we have an active location */}
      {showFilters && activeLocation && (
        <FilterPanel
          maxDistance={maxDistance}
          setMaxDistance={setMaxDistance}
          filteredPlaquesCount={filteredPlaquesCount}
          applyFilter={applyDistanceFilter}
          closeFilters={() => setShowFilters(false)}
          resetFilters={resetFilters}
          hasUserLocation={!!activeLocation}
          useImperial={useImperial}
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
      <div className="absolute bottom-1 right-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
      </div>
      
      {/* Toast notifications */}
      {toast && (
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] px-4 py-2 rounded-lg shadow-lg text-sm font-medium max-w-xs text-center ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
});

PlaqueMap.displayName = 'PlaqueMap';

export default PlaqueMap;