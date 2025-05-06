// src/components/maps/PlaqueMap.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MapContainer from './containers/MapContainer';
import MapControls from './controls/MapControls';
import RoutePanel from './controls/RoutePanel';
import FilterPanel from './controls/FilterPanel';
import LocationSearchPanel from './controls/LocationSearchPanel';
import AlertDialog from './dialogs/AlertDialog';
import useMapInitialization from './hooks/useMapInitialization';
import { useMapMarkers } from './hooks/useMapMarkers';
import useMapOperations from './hooks/useMapOperations';
import { calculateRouteDistance } from './utils/routeUtils';

// Improved PlaqueMap component with reliable routing functionality
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
  clearRoute = () => {}
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
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  
  // Initialize map
  const { 
    mapInstance,
    markersLayer,
    clusterGroup,
    routeMarkerGroup,
    routeLineRef,
    initializeMap 
  } = useMapInitialization();
  
  // Format distance based on unit preference
  const formatDistance = useCallback((distanceKm) => {
    if (useImperial) {
      // Convert to miles (1 km = 0.621371 miles)
      const miles = distanceKm * 0.621371;
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${distanceKm.toFixed(1)} km`;
    }
  }, [useImperial]);
  
  // Calculate walking time based on distance
  const calculateWalkingTime = useCallback((distanceKm) => {
    if (distanceKm <= 0) return "0 min";
    
    const minutes = Math.round(distanceKm * 12); // 12 minutes per km
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
  }, []);
  
  // Initialize markers and map operations
  const { 
    addMapMarkers,
    drawSimpleRoute,
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
    isRoutingMode, // Make sure this is included and passed correctly
    addPlaqueToRoute,
    removePlaqueFromRoute,
    routePoints,
    maintainView,
    formatDistance,
    calculateWalkingTime,
    isDrawingRoute,
    setIsDrawingRoute
  });
  
  // Map operations
  const {
    findUserLocation,
    resetMap
  } = useMapOperations({
    mapInstance,
    setIsLoadingLocation,
    setUserLocation
  });
  
  // Load Leaflet and initialize map
  useEffect(() => {
    if (mapContainerRef.current) {
      initializeMap(mapContainerRef.current, setMapLoaded);
    }
  }, [initializeMap]);
  
  // Update markers when dependencies change
  useEffect(() => {
    if (mapInstance && mapLoaded && !isDrawingRoute) {
      addMapMarkers();
    }
  }, [mapLoaded, plaques, favorites, selectedPlaqueId, isRoutingMode, routePoints, addMapMarkers, isDrawingRoute, mapInstance]);
  
  // Draw route when route points change
  useEffect(() => {
    if (!mapInstance || !mapLoaded || !isRoutingMode) return;
    
    if (routePoints.length >= 2) {
      // Don't try to draw a route if we're already drawing one
      if (!isDrawingRoute) {
        // Add a slight delay to prevent race conditions
        const timer = setTimeout(() => {
          drawSimpleRoute(routePoints);
        }, 100);
        return () => clearTimeout(timer);
      }
    } else if (routeLineRef.current) {
      // Clear route line if no points
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  }, [mapLoaded, routePoints, isRoutingMode, drawSimpleRoute, isDrawingRoute, mapInstance, routeLineRef]);
  
  // Handle unit preference change
  useEffect(() => {
    // Redraw route with new unit formatting
    if (routePoints.length >= 2 && routeLineRef.current && !isDrawingRoute) {
      const timer = setTimeout(() => {
        drawSimpleRoute(routePoints);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [useImperial, drawSimpleRoute, routePoints, isDrawingRoute, routeLineRef]);
  
  // Handle clearing route
  const handleClearRoute = useCallback(() => {
    if (!mapInstance) {
      console.log("Map not available for clearing route");
      return;
    }
    
    // Clear existing route line
    if (routeLineRef.current) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Reset route state in parent component
    clearRoute();
    
    // Close dialog if open
    setClearRouteDialog(false);
    
    // Refresh markers to reset their appearance
    setTimeout(() => {
      addMapMarkers();
    }, 50);
    
    toast.success("Route cleared");
  }, [clearRoute, addMapMarkers, mapInstance, routeLineRef]);
  
  // Fixed: Reliable plaque removal from route that doesn't cause flashing
  const handleRemovePlaqueFromRoute = useCallback((plaqueId) => {
    // Prevent removing if we're already in the middle of drawing a route
    if (isDrawingRoute) {
      toast.info("Please wait, route is being updated...");
      return;
    }
    
    setIsDrawingRoute(true); // Set flag to prevent re-renders during update

    
    
    // First, clear the existing route to prevent ghost lines
    if (routeLineRef.current && mapInstance) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const currentRoutePoints = [...routePoints];

      // Find the index of the plaque to remove
  const plaqueIndex = currentRoutePoints.findIndex(p => p.id === plaqueId);
  if (plaqueIndex === -1) {
    setIsDrawingRoute(false);
    return;
  }

  const newRoutePoints = [
    ...currentRoutePoints.slice(0, plaqueIndex),
    ...currentRoutePoints.slice(plaqueIndex + 1)
  ];
    
    // Update route points in the parent component
    removePlaqueFromRoute(plaqueId);
    
    // Reset the drawing flag after a delay
    setTimeout(() => {
      // Only redraw if we still have a valid route
      if (newRoutePoints.length >= 2) {
        drawSimpleRoute(newRoutePoints);
      }
      
      // Reset the drawing flag with a delay
      setTimeout(() => {
        setIsDrawingRoute(false);
      }, 300);
    }, 100);

  toast.info("Removed plaque from route");
}, [removePlaqueFromRoute, isDrawingRoute, mapInstance, routeLineRef, routePoints, drawSimpleRoute]);
  


  // Toggle routing mode
  const handleToggleRoutingMode = useCallback(() => {
    const newRoutingMode = !isRoutingMode;
    
    if (newRoutingMode) {
      setIsRoutingMode(true);
      setShowRoutePanel(true);
      toast.success("Route planning mode activated");
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

  // Expose methods to parent component via ref
  React.useImperativeHandle(ref, () => ({
    drawRouteLine: (pointsForRoute) => {
      return drawSimpleRoute(pointsForRoute);
    },
    
    clearRoute: () => {
      handleClearRoute();
    },
    
    findUserLocation: () => {
      findUserLocation();
    },
    
    fitToMarkers: () => {
      fitToMarkers(plaques);
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
      />
      
      {/* Route Builder Panel */}
      {isRoutingMode && showRoutePanel && (
        <RoutePanel 
          routePoints={routePoints}
          setShowRoutePanel={setShowRoutePanel}
          totalDistance={calculateRouteDistance(routePoints)}
          formatDistance={formatDistance}
          calculateWalkingTime={calculateWalkingTime}
          useImperial={useImperial}
          setUseImperial={setUseImperial}
          handleRemovePlaqueFromRoute={handleRemovePlaqueFromRoute}
          isDrawingRoute={isDrawingRoute}
          setClearRouteDialog={setClearRouteDialog}
          clearRoute={clearRoute}
          drawSimpleRoute={drawSimpleRoute}
          addPlaqueToRoute={addPlaqueToRoute}
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
        description="Are you sure you want to clear the current route? This action cannot be undone."
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