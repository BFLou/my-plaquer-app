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
  const mapContainerRef = useRef(null);
  
  // State variables
  const [mapLoaded, setMapLoaded] = useState(false);
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
  
  // Initialize map
  const { 
    mapLoaded: mapLibraryLoaded,
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
  
  // Initialize map markers
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
  
  // Load Leaflet and initialize map
  useEffect(() => {
    if (mapContainerRef.current) {
      const initMap = async () => {
        await initializeMap(mapContainerRef.current, setMapLoaded);
      };
      initMap();
    }
    
    return () => {
      // Cleanup map instance when component unmounts
      cleanup();
    };
  }, [initializeMap, cleanup]);
  
  // Enhance popup animations when map is loaded
  useEffect(() => {
    if (mapLoaded && mapInstance) {
      enhancePopupAnimations();
    }
  }, [mapLoaded, mapInstance, enhancePopupAnimations]);

  // Debug logging
  useEffect(() => {
    console.log(`PlaqueMap rendering with ${plaques.length} plaques`);
    console.log('Map container ref:', mapContainerRef.current);
    
    // Log first plaque to inspect its structure
    if (plaques.length > 0) {
      console.log('Sample plaque data:', plaques[0]);
    }
  }, [plaques]);
  
  // Update markers when dependencies change
  useEffect(() => {
    if (mapInstance && mapLoaded && !isDrawingRoute) {
      addMapMarkers();
    }
  }, [mapLoaded, plaques, favorites, selectedPlaqueId, isRoutingMode, routePoints, addMapMarkers, isDrawingRoute, mapInstance]);
  
  // Change map style when mapMode changes
  useEffect(() => {
    if (mapInstance && mapLoaded && mapMode) {
      changeMapTheme(mapMode);
    }
  }, [mapMode, mapInstance, mapLoaded, changeMapTheme]);
  
  // Draw route when route points change
  useEffect(() => {
    if (!mapInstance || !mapLoaded || !isRoutingMode) return;
    
    // Don't automatically draw routes when toggling routing mode
    // This prevents the map from zooming out when enabling route builder
    if (routePoints.length >= 2 && !isDrawingRoute) {
      // Use a stable timeout to prevent race conditions
      const timer = setTimeout(() => {
        drawWalkingRoute(routePoints);
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (routeLineRef.current) {
      // Clear route line if no points
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  }, [routePoints, mapInstance, mapLoaded, isRoutingMode, isDrawingRoute, drawWalkingRoute, routeLineRef]);
  
  // Handle unit preference change
  useEffect(() => {
    // Redraw route with new unit formatting
    if (routePoints.length >= 2 && routeLineRef.current && !isDrawingRoute) {
      const timer = setTimeout(() => {
        drawWalkingRoute(routePoints);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [useImperial, drawWalkingRoute, routePoints, isDrawingRoute, routeLineRef]);
  
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
          mapInstance.removeLayer(routeLineRef.current);
          routeLineRef.current = null;
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