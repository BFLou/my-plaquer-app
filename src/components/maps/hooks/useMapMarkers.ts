// src/hooks/useMapMarkers.ts
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Plaque } from '@/types/plaque';

interface UseMapMarkersProps {
  mapInstance: any;
  markersLayer: any;
  clusterGroup: any;
  routeMarkerGroup: any;
  routeLineRef: any;
  plaques: Plaque[];
  favorites: number[];
  selectedPlaqueId: number | null;
  onPlaqueClick: (plaque: Plaque) => void;
  isRoutingMode: boolean;
  addPlaqueToRoute: (plaque: Plaque) => void;
  removePlaqueFromRoute: (plaqueId: number) => void;
  routePoints: Plaque[];
  maintainView: boolean;
  formatDistance: (distance: number) => string;
  isDrawingRoute: boolean;
}

export const useMapMarkers = ({
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
  formatDistance,
  isDrawingRoute
}: UseMapMarkersProps) => {
  // Store previous marker state to prevent unnecessary clearing
  const prevRouteRef = useRef<string>('');
  
  // Fit to bounds based on plaque markers
  const fitToMarkers = useCallback((plaquesToFit: Plaque[]) => {
    if (!mapInstance || !window.L) return;
    
    const validPlaques = plaquesToFit.filter(p => p.latitude && p.longitude);
    
    if (validPlaques.length > 0) {
      try {
        const latLngs = validPlaques.map(p => [
          parseFloat(p.latitude as unknown as string), 
          parseFloat(p.longitude as unknown as string)
        ]);
        
        const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
        
        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, { 
            padding: [50, 50],
            animate: true,
            duration: 0.75  // Smoother animation
          });
        }
      } catch (e) {
        console.warn("Non-critical error fitting to markers:", e);
        // Fallback to fixed view
        mapInstance.setView([51.505, -0.09], 13);
      }
    }
  }, [mapInstance]);
  
  // Add markers to the map
// In useMapMarkers.ts - in the addMapMarkers function
const addMapMarkers = useCallback(() => {
  if (!mapInstance || !window.L) {
    console.log("Map or Leaflet not available for adding markers");
    return;
  }
  
  // Add this debug log
  console.log(`Attempting to add ${plaques.length} markers to the map`);

  // Only clear layers if needed
  if (markersLayer) {
    markersLayer.clearLayers();
  }
  
  if (clusterGroup) {
    clusterGroup.clearLayers();
  }
  
  if (routeMarkerGroup) {
    routeMarkerGroup.clearLayers();
  }
  
  // Add markers for plaques
  plaques.forEach(plaque => {
    try {
      // Add more detailed validation and logging
      if (!plaque.latitude || !plaque.longitude) {
        console.warn(`Plaque ${plaque.id} missing coordinates`);
        return;
      }
      
      // Ensure latitude and longitude are numbers
      const lat = typeof plaque.latitude === 'string' ? 
        parseFloat(plaque.latitude) : plaque.latitude;
      const lng = typeof plaque.longitude === 'string' ? 
        parseFloat(plaque.longitude) : plaque.longitude;
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Plaque ${plaque.id} has invalid coordinates: lat=${plaque.latitude}, lng=${plaque.longitude}`);
        return;
      }
      
      // Log successful conversions
      console.log(`Creating marker for plaque ${plaque.id} at ${lat},${lng}`);
      
      // Continue with your existing marker creation code
      // ...
    } catch (error) {
      console.error(`Error creating marker for plaque ${plaque.id}:`, error);
    }
  });
  
  // Fit markers to map view
  if (plaques.length > 0 && !maintainView && !routePoints.length) {
    fitToMarkers(plaques);
  }
}, [
  mapInstance, 
  markersLayer, 
  clusterGroup, 
  routeMarkerGroup, 
  plaques, 
  favorites, 
  selectedPlaqueId, 
  maintainView, 
  isRoutingMode, 
  onPlaqueClick, 
  addPlaqueToRoute, 
  removePlaqueFromRoute, 
  isDrawingRoute,
  routePoints,
  fitToMarkers
]);
  
  return {
    addMapMarkers,
    fitToMarkers
  };
};

export default useMapMarkers;