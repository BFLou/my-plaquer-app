// src/components/plaques/ImprovedPlaqueMap.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Plaque } from '@/types/plaque';
import MapControls from './map/MapControls';
import MapFilterPanel from './map/MapFilterPanel';
import RoutePanel from './map/RoutePanel';
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
import { useMapOperations } from './map/useMapOperations';

type PlaqueMapProps = {
  plaques: Plaque[];
  onPlaqueClick: (plaque: Plaque) => void;
  favorites?: number[];
  selectedPlaqueId?: number | null;
  maintainView?: boolean;
  className?: string;
};

const ImprovedPlaqueMap: React.FC<PlaqueMapProps> = ({
  plaques,
  onPlaqueClick,
  favorites = [],
  selectedPlaqueId,
  maintainView = false,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const handlePlaqueClickStable = useCallback((plaque: Plaque) => {
    onPlaqueClick(plaque);
  }, [onPlaqueClick]);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [showClearRouteDialog, setShowClearRouteDialog] = useState(false);
  
  // Filter state
  const [maxDistance, setMaxDistance] = useState<number>(2); // in km
  const [filteredPlaquesCount, setFilteredPlaquesCount] = useState<number>(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Initialize map and operations
  const { 
    mapInstance,
    userLocation,
    routePoints,
    addPlaqueToRoute,
    removePlaqueFromRoute,
    reorderRoutePoints,
    clearRoute,
    exportRoute,
    saveRoute,
    findUserLocation,
    applyDistanceFilter,
    resetFilters,
    drawDistanceCircle
  } = useMapOperations({
    mapContainerRef,
    plaques,
    favorites,
    selectedPlaqueId,
    maintainView,
    handlePlaqueClick: handlePlaqueClickStable,
    maxDistance,
    setIsLoadingLocation,
    setFilteredPlaquesCount,
    setShowFilters
  });

  // Toggle routing mode
  const toggleRoutingMode = () => {
    // If already in routing mode and has route points, confirm before exiting
    if (isRoutingMode && routePoints.length > 0) {
      setShowClearRouteDialog(true);
      return;
    }
    
    // If exiting routing mode, make sure to clear any routes
    if (isRoutingMode) {
      clearRoute();
    }
    
    // Toggle mode
    setIsRoutingMode(prev => !prev);
    
    // When entering routing mode, show toast with instructions
    if (!isRoutingMode) {
      toast.info("Route planning mode activated. Click 'Add to Route' in plaque popups to build your route.", {
        duration: 5000
      });
    }
  };

  // Update filter count when user location or max distance changes
  useEffect(() => {
    if (userLocation && mapInstance) {
      // Calculate filtered plaques based on current distance
      const filtered = plaques.filter(plaque => {
        if (!plaque.latitude || !plaque.longitude) return false;
        
        try {
          const lat = parseFloat(plaque.latitude as unknown as string);
          const lng = parseFloat(plaque.longitude as unknown as string);
          
          if (isNaN(lat) || isNaN(lng)) return false;
          
          // Calculate distance
          const R = 6371; // Earth radius in kilometers
          const dLat = (lat - userLocation[0]) * Math.PI / 180;
          const dLon = (lng - userLocation[1]) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          return distance <= maxDistance;
        } catch (error) {
          return false;
        }
      });
      
      setFilteredPlaquesCount(filtered.length);
      
      // Draw the distance circle on the map
      if (showFilters) {
        drawDistanceCircle(userLocation, maxDistance);
      }
    }
  }, [userLocation, maxDistance, showFilters, plaques, mapInstance, drawDistanceCircle]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      ></div>
      
      {/* Map controls */}
      <MapControls 
        isLoadingLocation={isLoadingLocation}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        isRoutingMode={isRoutingMode}
        toggleRoutingMode={toggleRoutingMode}
        findUserLocation={findUserLocation}
        hasUserLocation={!!userLocation}
      />
      
      {/* Filter panel */}
      {showFilters && userLocation && (
        <MapFilterPanel 
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
          onReorderPoints={reorderRoutePoints}
          onExportRoute={exportRoute}
          onSaveRoute={saveRoute}
          onClose={() => {
            if (routePoints.length > 0) {
              setShowClearRouteDialog(true);
            } else {
              setIsRoutingMode(false);
            }
          }}
          onShowClearDialog={() => setShowClearRouteDialog(true)}
        />
      )}
      
      {/* Confirmation dialog for clearing route */}
      <AlertDialog open={showClearRouteDialog} onOpenChange={setShowClearRouteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear this route? This action cannot be undone.
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
      
      {/* Map attribution - required for OSM */}
      <div className="absolute bottom-1 left-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-600">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default ImprovedPlaqueMap;