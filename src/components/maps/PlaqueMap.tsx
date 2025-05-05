import React, { useState, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import MapControls from './controls/MapControls';
import FilterPanel from './controls/FilterPanel';
import RoutePanel from './controls/RoutePanel';
import useMapInitialization from './hooks/useMapInitialization';
import useMapMarkers from './hooks/useMapMarkers';
import useMapOperations from './hooks/useMapOperations';
import { AlertDialog } from '@/components/ui/alert-dialog';

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
  const [maxDistance, setMaxDistance] = useState(2);
  const [filteredPlaquesCount, setFilteredPlaquesCount] = useState(0);
  const [showClearRouteDialog, setShowClearRouteDialog] = useState(false);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routePoints, setRoutePoints] = useState<Plaque[]>([]);

  // Initialize map
  const { mapInstance, mapLoaded } = useMapInitialization(mapContainerRef);
  
  // Setup map markers
  const { markersMap } = useMapMarkers(
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
    clearRoute
  } = useMapOperations(
    mapInstance,
    plaques,
    maxDistance,
    setIsLoadingLocation,
    setFilteredPlaquesCount,
    routePoints,
    setRoutePoints
  );

  // Add plaque to route
  function addPlaqueToRoute(plaque: Plaque) {
    // Check if plaque is already in route
    if (routePoints.some(p => p.id === plaque.id)) {
      // Already in route - show toast or notification
      return;
    }
    
    // Add to route points
    setRoutePoints(prevPoints => [...prevPoints, plaque]);
  }

  // Remove plaque from route
  function removePlaqueFromRoute(plaque: Plaque) {
    setRoutePoints(prevPoints => 
      prevPoints.filter(p => p.id !== plaque.id)
    );
  }

  // Toggle routing mode
  function toggleRoutingMode() {
    if (isRoutingMode && routePoints.length > 0) {
      setShowClearRouteDialog(true);
      return;
    }
    
    setIsRoutingMode(!isRoutingMode);
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map controls */}
      <MapControls 
        isLoadingLocation={isLoadingLocation}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        isRoutingMode={isRoutingMode}
        toggleRoutingMode={toggleRoutingMode}
        findUserLocation={findUserLocation}
        hasUserLocation={true}
      />
      
      {/* Filter panel */}
      {showFilters && (
        <FilterPanel 
          maxDistance={maxDistance}
          setMaxDistance={setMaxDistance}
          filteredPlaquesCount={filteredPlaquesCount}
          applyFilter={applyDistanceFilter}
          closeFilters={() => setShowFilters(false)}
          resetFilters={resetFilters}
        />
      )}
      
      {/* Route Panel */}
      {isRoutingMode && (
        <RoutePanel 
          routePoints={routePoints}
          onRemovePoint={removePlaqueFromRoute}
          onReorderPoints={(newPoints) => setRoutePoints(newPoints)}
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
        {/* AlertDialog contents... */}
      </AlertDialog>
    </div>
  );
};

export default PlaqueMap;