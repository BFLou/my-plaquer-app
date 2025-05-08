// src/components/maps/PlaqueMap.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Plaque } from '@/types/plaque';

// Components
import MapContainer from './containers/MapContainer';
import MapControls from './controls/MapControls';
import RoutePanel from './controls/RoutePanel';
import FilterPanel from './controls/FilterPanel';
import LocationSearchPanel from './controls/LocationSearchPanel';
import AlertDialog from './dialogs/AlertDialog';

// Hooks
import useMapInitialization from './hooks/useMapInitialization';
import useMapMarkers from './hooks/useMapMarkers';
import useMapOperations from './hooks/useMapOperations';
import useRouteManagement from './hooks/useRouteManagement';
import useMapEffects from './hooks/useMapEffects';

// Utils
import { calculateRouteDistance, calculateWalkingTime } from './utils/routeUtils';

// Interface for PlaqueMap props
interface PlaqueMapProps {
  plaques?: Plaque[];
  onPlaqueClick?: (plaque: Plaque) => void;
  favorites?: number[];
  selectedPlaqueId?: number | null;
  maintainView?: boolean;
  className?: string;
  isRoutingMode?: boolean;
  setIsRoutingMode?: (value: boolean) => void;
  routePoints?: Plaque[];
  addPlaqueToRoute?: (plaque: Plaque) => void;
  removePlaqueFromRoute?: (plaqueId: number) => void;
  clearRoute?: () => void;
}

// Improved PlaqueMap component with reliable routing functionality
const PlaqueMap = React.forwardRef<any, PlaqueMapProps>(({
  plaques = [],
  onPlaqueClick = () => {},
  favorites = [],
  selectedPlaqueId = null,
  maintainView = false,
  className = '',
  isRoutingMode: externalRoutingMode = false,
  setIsRoutingMode: setExternalRoutingMode = () => {},
  routePoints: externalRoutePoints = [],
  addPlaqueToRoute: externalAddPlaqueToRoute = () => {},
  removePlaqueFromRoute: externalRemovePlaqueFromRoute = () => {},
  clearRoute: externalClearRoute = () => {}
}, ref) => {
  // Use a ref for the map container to prevent re-initialization
  const mapContainerRef = useRef(null);
  
  // Map initialization state
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // State variables
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [useImperial, setUseImperial] = useState(false);
  const [clearRouteDialog, setClearRouteDialog] = useState(false);
  const [mapMode, setMapMode] = useState('streets');
  
  // Format distance based on unit preference
  const formatDistanceWithUnits = useCallback((distanceKm) => {
    if (useImperial) {
      // Convert to miles (1 km = 0.621371 miles)
      const miles = distanceKm * 0.621371;
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${distanceKm.toFixed(1)} km`;
    }
  }, [useImperial]);
  
  // Initialize map with proper error handling
  const { 
    mapLoaded,
    mapInstance,
    markersLayer,
    clusterGroup,
    routeMarkerGroup,
    routeLineRef,
    initializeMap,
    cleanup 
  } = useMapInitialization();
  
  // Initialize route management
  const {
    routePoints: internalRoutePoints,
    isDrawingRoute,
    isRoutingMode: internalRoutingMode,
    setIsRoutingMode: setInternalRoutingMode,
    addPointToRoute,
    removePointFromRoute,
    clearRoute: clearInternalRoute,
    drawWalkingRoute,
    optimizeRouteForWalking,
    calculateRouteDistance: calcRouteDistance
  } = useRouteManagement({
    mapInstance,
    routeMarkerGroup,
    routeLineRef,
    formatDistance: formatDistanceWithUnits,
    calculateWalkingTime: (distance) => calculateWalkingTime(distance)
  });
  
  // Use external route state if provided, otherwise use internal
  const routePoints = externalRoutePoints.length > 0 ? externalRoutePoints : internalRoutePoints;
  const isRoutingMode = externalRoutingMode !== undefined ? externalRoutingMode : internalRoutingMode;
  
  const setIsRoutingMode = useCallback((value) => {
    setInternalRoutingMode(value);
    setExternalRoutingMode(value);
  }, [setInternalRoutingMode, setExternalRoutingMode]);
  
  const addPlaqueToRoute = useCallback((plaque) => {
    if (externalAddPlaqueToRoute && externalRoutePoints.length > 0) {
      externalAddPlaqueToRoute(plaque);
    } else {
      addPointToRoute(plaque);
    }
  }, [externalAddPlaqueToRoute, addPointToRoute, externalRoutePoints]);
  
  const removePlaqueFromRoute = useCallback((plaqueId) => {
    if (externalRemovePlaqueFromRoute && externalRoutePoints.length > 0) {
      externalRemovePlaqueFromRoute(plaqueId);
    } else {
      removePointFromRoute(plaqueId);
    }
  }, [externalRemovePlaqueFromRoute, removePointFromRoute, externalRoutePoints]);
  
  const clearRoute = useCallback(() => {
    if (externalClearRoute && externalRoutePoints.length > 0) {
      externalClearRoute();
    } else {
      clearInternalRoute();
    }
  }, [externalClearRoute, clearInternalRoute, externalRoutePoints]);
  
  // Initialize map markers ONLY after map is loaded
  const { 
    addMapMarkers,
    fitToMarkers
  } = useMapMarkers({
    mapInstance,
    markersLayer,
    clusterGroup,
    routeMarkerGroup,
    routeLineRef,
    plaques,
    favorites,
    selectedPlaqueId,
    onPlaqueClick,
    isRoutingMode,
    addPlaqueToRoute,
    removePlaqueFromRoute,
    routePoints,
    maintainView,
    formatDistance: formatDistanceWithUnits,
    isDrawingRoute
  });
  
  // Map operations
  const {
    findUserLocation,
    resetMap,
    changeMapTheme
  } = useMapOperations({
    mapInstance,
    setIsLoadingLocation,
    setUserLocation
  });
  
  // Map effects
  const {
    enhancePopupAnimations
  } = useMapEffects(mapInstance);
  
  // Initialize map once and only once with improved error handling
  useEffect(() => {
    // Only initialize if we have a container ref and haven't initialized yet
    if (mapContainerRef.current && !mapInitialized) {
      let isMounted = true; // Track component mount state
      
      const initMap = async () => {
        try {
          // Wait for next tick to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 10));
          
          if (!isMounted) return; // Don't proceed if component unmounted
          
          // Initialize map with a callback to track success
          await initializeMap(mapContainerRef.current, (success) => {
            if (isMounted) {
              setMapInitialized(success);
            }
          });
        } catch (error) {
          console.error("Map initialization failed:", error);
          // Add a toast notification to inform the user
          toast.error("Map loading failed. Please try again.");
        }
      };
      
      // Start initialization
      initMap();
      
      // Cleanup function to track component unmounting
      return () => {
        isMounted = false;
        cleanup();
        setMapInitialized(false);
      };
    }
  }, [initializeMap, cleanup, mapInitialized]); // Depend only on these functions
  
  // Enhance popup animations when map is loaded
  useEffect(() => {
    if (mapLoaded && mapInstance) {
      enhancePopupAnimations();
    }
  }, [mapLoaded, mapInstance, enhancePopupAnimations]);

  // Debug logging - limit to reduce console spam
  useEffect(() => {
    console.log(`PlaqueMap rendering with ${plaques.length} plaques`);
    console.log('Map container ref:', mapContainerRef.current);
    
    // Log first plaque to inspect its structure if available
    if (plaques.length > 0) {
      console.log('Sample plaque data:', plaques[0]);
    }
  }, [plaques]);
  
  // Update markers when dependencies change with improved error handling
  useEffect(() => {
    // Only proceed if map is fully initialized and loaded
    if (mapInstance && mapLoaded && !isDrawingRoute) {
      // Use a reference to track if this effect is still relevant
      let effectActive = true;
      
      // Delay marker addition to ensure map is fully ready
      const timer = setTimeout(() => {
        // Check if effect is still relevant
        if (!effectActive) return;
        
        try {
          // Check if all required objects exist
          if (mapInstance && markersLayer) {
            addMapMarkers();
          }
        } catch (error) {
          console.error("Error adding markers:", error);
        }
      }, 300); // Longer delay for more stability
      
      // Cleanup function
      return () => {
        effectActive = false;
        clearTimeout(timer);
      };
    }
  }, [
    mapLoaded, 
    mapInstance, 
    markersLayer, 
    plaques, 
    favorites, 
    selectedPlaqueId, 
    isRoutingMode, 
    routePoints, 
    addMapMarkers, 
    isDrawingRoute
  ]);
  
  // Change map style when mapMode changes
  useEffect(() => {
    if (mapInstance && mapLoaded && mapMode) {
      changeMapTheme(mapMode);
    }
  }, [mapMode, mapInstance, mapLoaded, changeMapTheme]);
  
  // Draw route when route points change with improved error handling
  useEffect(() => {
    if (!mapInstance || !mapLoaded || !isRoutingMode) return;
    
    // Don't automatically draw routes when toggling routing mode
    // This prevents the map from zooming out when enabling route builder
    if (routePoints.length >= 2 && !isDrawingRoute) {
      // Create a reference to track if this effect is still relevant
      let effectActive = true;
      
      // Use a stable timeout to prevent race conditions
      const timer = setTimeout(() => {
        if (!effectActive) return;
        
        try {
          drawWalkingRoute(routePoints);
        } catch (error) {
          console.error("Error drawing route:", error);
        }
      }, 300);
      
      return () => {
        effectActive = false; 
        clearTimeout(timer);
      };
    } else if (routeLineRef.current && mapInstance) {
      // Clear route line if no points
      try {
        mapInstance.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      } catch (error) {
        console.warn("Error clearing route:", error);
      }
    }
  }, [routePoints, mapInstance, mapLoaded, isRoutingMode, isDrawingRoute, drawWalkingRoute, routeLineRef]);
  
  // Handle unit preference change
  useEffect(() => {
    // Redraw route with new unit formatting
    if (routePoints.length >= 2 && routeLineRef.current && !isDrawingRoute && mapInstance) {
      let effectActive = true;
      
      const timer = setTimeout(() => {
        if (!effectActive) return;
        
        try {
          drawWalkingRoute(routePoints);
        } catch (error) {
          console.error("Error redrawing route:", error);
        }
      }, 100);
      
      return () => {
        effectActive = false;
        clearTimeout(timer);
      };
    }
  }, [useImperial, drawWalkingRoute, routePoints, isDrawingRoute, routeLineRef, mapInstance]);
  
  // Toggle routing mode
  const handleToggleRoutingMode = useCallback(() => {
    const newRoutingMode = !isRoutingMode;
    
    if (newRoutingMode) {
      setIsRoutingMode(true);
      setShowRoutePanel(true);
      toast.success("Walking route planner activated");
      
      // Don't adjust the map view when entering routing mode
      // This fixes the "zooms out to beginning" issue
    } else {
      // If we have a route and exiting routing mode
      if (routePoints.length > 0) {
        setClearRouteDialog(true);
      } else {
        setIsRoutingMode(false);
        setShowRoutePanel(false);
        
        // Clear any route lines
        if (routeLineRef.current && mapInstance) {
          try {
            mapInstance.removeLayer(routeLineRef.current);
            routeLineRef.current = null;
          } catch (error) {
            console.warn("Error clearing route:", error);
          }
        }
      }
    }
  }, [isRoutingMode, routePoints.length, setIsRoutingMode, mapInstance, routeLineRef]);
  
  // Handle clearing route
  const handleClearRoute = useCallback(() => {
    clearRoute();
    setClearRouteDialog(false);
    
    // Exit routing mode if dialog was triggered by toggle
    if (!isRoutingMode) {
      setShowRoutePanel(false);
    }
  }, [clearRoute, isRoutingMode]);
  
  // Export route as GPX file
  const handleExportRoute = useCallback(() => {
    if (routePoints.length < 2) {
      toast.error("Add at least 2 stops to export a route");
      return;
    }
    
    try {
      // Create GPX format string
      let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Plaque Map">
  <metadata>
    <name>Walking Route</name>
    <desc>Walking route with ${routePoints.length} historic plaques</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <rte>
    <name>Historic Plaque Walking Tour</name>`;
      
      // Add route points
      routePoints.forEach((point, index) => {
        if (!point.latitude || !point.longitude) return;
        
        const lat = typeof point.latitude === 'string' ? 
          parseFloat(point.latitude) : point.latitude;
        const lng = typeof point.longitude === 'string' ? 
          parseFloat(point.longitude) : point.longitude;
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        gpxContent += `
    <rtept lat="${lat}" lon="${lng}">
      <name>${point.title || `Stop ${index + 1}`}</name>
      <desc>${point.description || ''}</desc>
    </rtept>`;
      });
      
      // Close GPX file
      gpxContent += `
  </rte>
</gpx>`;
      
      // Create blob and download
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'historic-plaques-route.gpx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Route exported as GPX file");
    } catch (error) {
      console.error("Error exporting route:", error);
      toast.error("Failed to export route");
    }
  }, [routePoints]);
  
  // Expose methods to parent component via ref
  React.useImperativeHandle(ref, () => ({
    drawRouteLine: (pointsForRoute) => {
      return drawWalkingRoute(pointsForRoute);
    },
    
    clearRoute: () => {
      handleClearRoute();
    },
    
    findUserLocation: () => {
      findUserLocation();
    },
    
    fitToMarkers: () => {
      fitToMarkers(plaques);
    },
    
    optimizeRoute: () => {
      optimizeRouteForWalking();
    }
  }));

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
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
      
      {/* Map controls with tooltips */}
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
        mapMode={mapMode}
        setMapMode={setMapMode}
      />
      
      {/* Route Builder Panel */}
      {isRoutingMode && showRoutePanel && (
        <RoutePanel 
          routePoints={routePoints}
          setShowRoutePanel={setShowRoutePanel}
          totalDistance={calcRouteDistance(routePoints)}
          formatDistance={formatDistanceWithUnits}
          calculateWalkingTime={calculateWalkingTime}
          useImperial={useImperial}
          setUseImperial={setUseImperial}
          handleRemovePlaqueFromRoute={removePlaqueFromRoute}
          isDrawingRoute={isDrawingRoute}
          setClearRouteDialog={setClearRouteDialog}
          clearRoute={clearRoute}
          optimizeRoute={optimizeRouteForWalking}
          exportRoute={handleExportRoute}
        />
      )}
      
      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          maxDistance={3}
          setMaxDistance={() => {}}
          filteredPlaquesCount={0}
          applyFilter={() => {}}
          closeFilters={() => setShowFilters(false)}
          resetFilters={() => {}}
          hasUserLocation={!!userLocation}
        />
      )}
      
      {/* Location Search Panel */}
      {showLocationSearch && (
        <LocationSearchPanel
          onSearch={() => {}}
          onClose={() => setShowLocationSearch(false)}
          isLoading={false}
        />
      )}

      {/* Clear Route Dialog */}
      <AlertDialog 
        open={clearRouteDialog} 
        onOpenChange={setClearRouteDialog}
        title="Clear Route"
        description="Are you sure you want to clear the current walking route? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Clear Route"
        confirmVariant="destructive"
        onConfirm={handleClearRoute}
      />
      
      {/* Map attribution */}
      <div className="absolute bottom-1 right-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
      </div>
    </div>
  );
});

export default PlaqueMap;