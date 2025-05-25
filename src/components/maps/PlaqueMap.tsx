// src/components/maps/PlaqueMap.tsx - FIXED: Ensure route planning button is available
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Search, Route as RouteIcon, X } from 'lucide-react';

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
 * Enhanced PlaqueMap Component with proper routing controls
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
  saveRoute = () => {},
  moveRoutePointUp = () => {},
  moveRoutePointDown = () => {},
  onReorderRoute = () => {},
  useImperial = false,
  setUseImperial = () => {},
  isMobile = false,
  // Distance filter integration props
  onLocationSet = () => {},
  onDistanceFilterChange = () => {},
  maxDistance = 1,
  hideOutsidePlaques = false,
  activeLocation = null
}, ref) => {
  // Refs
  const mapContainerRef = useRef(null);
  const restoreTimeoutRef = useRef(null);
  
  // Component state
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [filteredPlaquesCount, setFilteredPlaquesCount] = useState(0);
  const [toast, setToastMessage] = useState(null);
  const [activeBaseMap, setActiveBaseMap] = useState('street');
  
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
  
  // Use map operations hook for location search, filtering, etc.
  const {
    findUserLocation,
    setSearchLocation,
    applyDistanceFilter,
    resetFilters,
    drawRoute,
    searchPlaceByAddress,
    activeLocation: mapActiveLocation,
    locationType,
    filterPlaquesInRange,
    restoreDistanceCircle
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

  // Helper function to calculate distance
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Filter plaques for map display based on hideOutsidePlaques
  const displayPlaques = React.useMemo(() => {
    if (!hideOutsidePlaques || !activeLocation) {
      return plaques;
    }
    
    return plaques.filter(plaque => {
      if (!plaque.latitude || !plaque.longitude) return false;
      
      const lat = parseFloat(plaque.latitude);
      const lng = parseFloat(plaque.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      const distance = calculateDistance(activeLocation[0], activeLocation[1], lat, lng);
      return distance <= maxDistance;
    });
  }, [plaques, hideOutsidePlaques, activeLocation, maxDistance, calculateDistance]);
  
  // Use filtered plaques for map markers
  const { 
    markersMap,
    redrawMarkers
  } = useMapMarkers(
    mapInstance,
    displayPlaques,
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
    useRoadRouting: true,
    useImperial,
    API_KEY: ORS_API_KEY,
    onRouteChange: (newRoute) => {
      // This callback should update the parent component's route state
    }
  });
  
  // Improved sync and restore location state when map becomes visible
  useEffect(() => {
    console.log('PlaqueMap: Map visibility effect triggered', { 
      mapLoaded, 
      mapInstance: !!mapInstance, 
      activeLocation, 
      mapActiveLocation,
      hideOutsidePlaques 
    });
    
    if (!mapLoaded || !mapInstance || !window.L || !activeLocation) return;
    
    if (restoreTimeoutRef.current) {
      clearTimeout(restoreTimeoutRef.current);
    }
    
    restoreTimeoutRef.current = setTimeout(() => {
      console.log('PlaqueMap: Executing restoration...', { 
        activeLocation, 
        hideOutsidePlaques, 
        maxDistance 
      });
      
      try {
        if (!mapActiveLocation || 
            mapActiveLocation[0] !== activeLocation[0] || 
            mapActiveLocation[1] !== activeLocation[1]) {
          
          console.log('PlaqueMap: Restoring location marker...');
          
          const L = window.L;
          const searchMarker = L.marker(activeLocation, {
            icon: L.divIcon({
              className: 'search-location-marker',
              html: `
                <div style="
                  position: relative;
                  width: 36px;
                  height: 36px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <div style="
                    position: absolute;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background-color: rgba(239, 68, 68, 0.2);
                    animation: pulse 2s infinite;
                  "></div>
                  <div style="
                    width: 16px;
                    height: 16px;
                    background-color: #ef4444;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 1;
                  "></div>
                </div>
              `,
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            })
          });
          
          searchMarker.addTo(mapInstance);
        }
        
        if (hideOutsidePlaques && restoreDistanceCircle) {
          console.log('PlaqueMap: Restoring distance circle...');
          
          setTimeout(() => {
            restoreDistanceCircle();
          }, 200);
        }
        
      } catch (error) {
        console.error('PlaqueMap: Error during restoration:', error);
      }
    }, 500);
    
    return () => {
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, [mapLoaded, mapInstance, activeLocation, hideOutsidePlaques, maxDistance, restoreDistanceCircle]);

  // Update filteredPlaquesCount when displayPlaques changes
  useEffect(() => {
    setFilteredPlaquesCount(displayPlaques.length);
  }, [displayPlaques]);
  
  // Sync active location with parent component
  useEffect(() => {
    if (mapActiveLocation && mapActiveLocation !== activeLocation) {
      const syncTimeout = setTimeout(() => {
        onLocationSet(mapActiveLocation);
      }, 100);
      
      return () => clearTimeout(syncTimeout);
    }
  }, [mapActiveLocation, onLocationSet]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, []);

  // FIXED: Toggle routing mode with panel management
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
  
  // Enhanced reset filters function
  const handleResetFilters = useCallback(() => {
    resetFilters();
    onDistanceFilterChange(1, false);
  }, [resetFilters, onDistanceFilterChange]);
  
  // Handle location search with proper coordinate handling
  const handleLocationSearch = useCallback(async (searchQuery, coordinates) => {
    if (!searchQuery.trim()) return;
    
    setShowLocationSearch(false);
    showToast("Setting location...", "info");
    
    let success = false;
    
    if (coordinates) {
      try {
        setSearchLocation(coordinates, searchQuery);
        success = true;
        
        showToast("Location set! Distance filter is now available.", "success");
        
        setTimeout(() => {
          setShowFilters(true);
        }, 1500);
        
      } catch (error) {
        console.error('Error setting search location:', error);
        success = false;
      }
    } else {
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
  
  // Enhanced find user location
  const handleFindUserLocation = useCallback(() => {
    findUserLocation();
    setTimeout(() => {
      if (mapActiveLocation && locationType === 'user') {
        setShowFilters(true);
      }
    }, 2000);
  }, [findUserLocation, mapActiveLocation, locationType]);

  // Enhanced distance filter handling
  const handleDistanceFilterUpdate = useCallback((newDistance, hideOutside) => {
    console.log('Map: Distance filter update:', { newDistance, hideOutside });
    
    onDistanceFilterChange(newDistance, hideOutside);
    
    if (window.mapFilterUpdateTimeout) {
      clearTimeout(window.mapFilterUpdateTimeout);
    }
    
    window.mapFilterUpdateTimeout = setTimeout(() => {
      applyDistanceFilter();
    }, 200);
    
  }, [onDistanceFilterChange, applyDistanceFilter]);
  
  // Expose methods to the parent component via ref
  React.useImperativeHandle(ref, () => ({
    drawRouteLine: (points, useRoadRoutingParam = true, maintainView = false) => 
      drawWalkingRoute(points, useRoadRoutingParam, maintainView),
    clearRoute,
    findUserLocation,
    fitToMarkers: () => {
      if (mapInstance && displayPlaques.length > 0) {
        const bounds = getBoundsFromPlaques(displayPlaques);
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
    changeBaseMap,
    getActiveLocation: () => mapActiveLocation || activeLocation,
    isFilteringActive: () => hideOutsidePlaques,
    restoreDistanceCircle: () => {
      console.log('PlaqueMap: Manual restore via ref...', {
        activeLocation: mapActiveLocation || activeLocation,
        maxDistance,
        hideOutsidePlaques,
        mapInstance: !!mapInstance,
        mapLoaded
      });
      
      const locationToUse = mapActiveLocation || activeLocation;
      
      if (!locationToUse || !mapInstance || !mapLoaded) {
        console.warn('Cannot restore distance circle - missing requirements');
        return;
      }
      
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
      
      if (restoreDistanceCircle) {
        try {
          restoreDistanceCircle();
          console.log('PlaqueMap: Distance circle restored via ref');
        } catch (error) {
          console.error('Error restoring distance circle via ref:', error);
        }
      } else {
        console.warn('restoreDistanceCircle function not available');
      }
    },
    resetFilters: handleResetFilters
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

      {/* ADDED: Route Planning Button - Only show when not in routing mode */}
      {!isRoutingMode && (
        <div className="absolute top-4 left-4 z-[1000]">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleRoutingMode}
            className="shadow-lg flex items-center gap-2 px-4 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          >
            <RouteIcon size={16} />
            <span className="font-medium">Plan Route</span>
          </Button>
        </div>
      )}
      
      {/* Active location indicator - Only show when not in routing mode */}
      {(mapActiveLocation || activeLocation) && !isRoutingMode && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[999] bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
          {locationType === 'user' ? '📍 Current Location' : '🔍 Search Location'} • Filter Available
          {hideOutsidePlaques && (
            <span className="ml-2 bg-green-200 px-2 py-0.5 rounded">
              Showing {displayPlaques.length}/{plaques.length}
            </span>
          )}
        </div>
      )}
      
      {/* Map Controls - Updated to exclude route button */}
      <MapControls
        isLoadingLocation={isLoadingLocation}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        isRoutingMode={isRoutingMode}
        toggleRoutingMode={handleToggleRoutingMode}
        findUserLocation={handleFindUserLocation}
        hasUserLocation={!!(mapActiveLocation || activeLocation)}
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
          useRoadRouting={true}
          setUseRoadRouting={() => {}}
          onClose={() => setShowRoutePanel(false)}
          moveRoutePointUp={moveRoutePointUp}
          moveRoutePointDown={moveRoutePointDown}
          onReorder={onReorderRoute}
        />
      )}
      
      {/* Enhanced Filter Panel */}
      {showFilters && (mapActiveLocation || activeLocation) && (
        <FilterPanel
          maxDistance={maxDistance}
          setMaxDistance={(newDistance) => {
            handleDistanceFilterUpdate(newDistance, hideOutsidePlaques);
          }}
          filteredPlaquesCount={filteredPlaquesCount}
          applyFilter={applyDistanceFilter}
          closeFilters={() => setShowFilters(false)}
          resetFilters={handleResetFilters}
          hasUserLocation={!!(mapActiveLocation || activeLocation)}
          useImperial={useImperial}
          hideOutsidePlaques={hideOutsidePlaques}
          setHideOutsidePlaques={(hideOutside) => {
            handleDistanceFilterUpdate(maxDistance, hideOutside);
          }}
          totalPlaques={plaques.length}
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