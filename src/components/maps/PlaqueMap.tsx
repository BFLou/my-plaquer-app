// src/components/maps/PlaqueMap.tsx

import React, { useState, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import  MapControls  from './controls/MapControls';
import FilterPanel from './controls/FilterPanel';
import RoutePanel from './controls/RoutePanel';
import useMapInitialization from './hooks/useMapInitialization';
import useMapMarkers from './hooks/useMapMarkers';
import useMapOperations from './hooks/useMapOperations';
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
  const [disableAutomaticZoom, setDisableAutomaticZoom] = useState(false);

  // Initialize map with disabled auto-zoom
  const { mapInstance } = useMapInitialization(
    mapContainerRef, 
    { 
      disableAutomaticZoom: true, // Add this option to prevent automatic zooming
      zoom: 12, // Set an initial zoom level
      center: [51.505, -0.09] // London coordinates
    }
  );
  
  // Setup map markers with fixed styling
  const {} = useMapMarkers(
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

  // Handler to prevent automatic zooming on selection
  const handleMapClick = () => {
    if (mapInstance) {
      // Disable automatic zooming behavior after a user click
      setDisableAutomaticZoom(true);
    }
  };

  // Add plaque to route
  function addPlaqueToRoute(plaque: Plaque) {
    // Check if plaque is already in route
    if (routePoints.some(p => p.id === plaque.id)) {
      // Already in route - we could show a notification here
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

  // Add event listener for map click
  React.useEffect(() => {
    if (mapInstance) {
      mapInstance.on('click', handleMapClick);
      
      return () => {
        mapInstance.off('click', handleMapClick);
      };
    }
  }, [mapInstance]);

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
              clearRoute();
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