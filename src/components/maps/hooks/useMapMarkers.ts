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
  const addMapMarkers = useCallback(() => {
    if (!mapInstance || !window.L) {
      console.log("Map or Leaflet not available for adding markers");
      return;
    }
    
    // Don't add markers if we're in the middle of drawing a route
    if (isDrawingRoute) {
      return;
    }
    
    // We'll use a smarter clearing approach to prevent flashing
    // Check if route points are the same as last time
    const routePointIds = routePoints.map(p => p.id).join(',');
    const routePointsChanged = routePointIds !== prevRouteRef.current;
    prevRouteRef.current = routePointIds;
    
    // Only clear layers if the route has actually changed
    if (routePointsChanged) {
      // Clear existing markers
      if (markersLayer) {
        markersLayer.clearLayers();
      }
      
      if (clusterGroup) {
        clusterGroup.clearLayers();
      }
      
      if (routeMarkerGroup) {
        routeMarkerGroup.clearLayers();
      }
    } else if (!selectedPlaqueId) {
      // If nothing significant changed, skip full redraw
      return;
    }
    
    console.log(`Adding ${plaques.length} markers to the map`);
    
    // Add markers for plaques
    plaques.forEach(plaque => {
      try {
        // Skip plaques without coordinates
        if (!plaque.latitude || !plaque.longitude) return;
        
        const lat = parseFloat(plaque.latitude as unknown as string);
        const lng = parseFloat(plaque.longitude as unknown as string);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Get plaque color
        const plaqueColor = (plaque.color?.toLowerCase() || 'blue');
        const bgColor = {
          'blue': '#3b82f6',
          'green': '#10b981',
          'brown': '#b45309',
          'black': '#1f2937',
          'grey': '#4b5563',
          'gray': '#4b5563'
        }[plaqueColor] || '#3b82f6';
        
        // Check if plaque is in the route
        const routeIndex = routePoints ? routePoints.findIndex(p => p.id === plaque.id) : -1;
        const isInRoute = routeIndex !== -1;
        
        // Create marker with custom icon
        const isFavorite = favorites.includes(plaque.id);
        const isSelected = plaque.id === selectedPlaqueId;
        
        if (isInRoute) {
          // ROUTE MARKERS - Diamond shaped with numbers/letters
          let markerLabel, markerColor, markerClass;
          
          if (routeIndex === 0) {
            markerLabel = 'S';
            markerColor = '#3b82f6'; // Blue for start
            markerClass = 'route-marker-start';
          } else if (routeIndex === routePoints.length - 1) {
            markerLabel = 'E';
            markerColor = '#ef4444'; // Red for end
            markerClass = 'route-marker-end';
          } else {
            markerLabel = (routeIndex + 1).toString();
            markerColor = '#10b981'; // Green for waypoints
            markerClass = 'route-marker-waypoint';
          }
          
          // Create diamond-shaped route marker
          const icon = window.L.divIcon({
            className: `route-marker ${markerClass}`,
            html: `
              <div class="route-marker-container">
                <div class="route-marker-diamond" style="background-color: ${markerColor};">
                  <div class="route-marker-content">${markerLabel}</div>
                </div>
                <div class="route-marker-label">${
                  routeIndex === 0 ? 'Start' : 
                    routeIndex === routePoints.length - 1 ? 'End' : 
                    `Stop ${routeIndex + 1}`
                }</div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          
          const marker = window.L.marker([lat, lng], { 
            icon,
            zIndexOffset: 1000 // Ensure route markers are on top
          });
          
          // Create popup
          const popupContent = document.createElement('div');
          popupContent.className = 'plaque-popup';
          popupContent.innerHTML = `
            <div class="max-w-xs">
              <div class="font-medium text-sm">${plaque.title || 'Unnamed Plaque'}</div>
              <div class="text-xs text-green-600 mt-1">• ${
                routeIndex === 0 ? 'Starting point' : 
                routeIndex === routePoints.length - 1 ? 'Final destination' : 
                `Stop #${routeIndex + 1}`
              } in walking route</div>
              <div class="flex gap-2 mt-3">
                <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
                  View Details
                </button>
                <button class="remove-from-route py-1.5 px-3 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          `;
          
          // Add event listeners
          setTimeout(() => {
            const detailButton = popupContent.querySelector('.view-details');
            if (detailButton) {
              detailButton.addEventListener('click', () => {
                marker.closePopup();
                setTimeout(() => {
                  onPlaqueClick(plaque);
                }, 50);
              });
            }
            
            const removeButton = popupContent.querySelector('.remove-from-route');
            if (removeButton) {
              removeButton.addEventListener('click', () => {
                marker.closePopup();
                removePlaqueFromRoute(plaque.id);
              });
            }
          }, 0);
          
          // Configure popup
          const popupOptions = {
            closeButton: true,
            autoClose: true,
            className: 'plaque-popup-container',
            maxWidth: 300,
            minWidth: 200,
            offset: [0, -20]
          };
          
          marker.bindPopup(popupContent, popupOptions);
          
          // Add click handler
          marker.on('click', () => {
            marker.openPopup();
          });
          
          // Add to route marker layer (no clustering)
          if (routeMarkerGroup) {
            routeMarkerGroup.addLayer(marker);
          } else if (markersLayer) {
            markersLayer.addLayer(marker);
          }
        } else {
          // REGULAR PLAQUE MARKERS - Circle with icon
          const size = isSelected ? 42 : 36;
          const markerContent = plaque.visited ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
          
          // Create regular circular marker
          const icon = window.L.divIcon({
            className: 'custom-marker',
            html: `
              <div class="plaque-marker ${isSelected ? 'plaque-marker-selected' : ''}" style="${isSelected ? 'transform: scale(1.2);' : ''}">
                <div class="plaque-marker-circle" style="
                  width: ${size}px;
                  height: ${size}px;
                  background-color: white;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  border: ${isFavorite ? '2px solid #f59e0b' : '2px solid white'};
                  padding: 2px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <div style="
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background-color: ${bgColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                  ">
                    ${markerContent}
                  </div>
                </div>
              </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
          });
          
          const marker = window.L.marker([lat, lng], { 
            icon,
            zIndexOffset: isSelected ? 900 : 0
          });
          
          // Create popup
          const popupContent = document.createElement('div');
          popupContent.className = 'plaque-popup';
          popupContent.innerHTML = `
          <div class="max-w-xs">
            <div class="font-medium text-sm">${plaque.title || 'Unnamed Plaque'}</div>
            <div class="text-xs text-gray-600 mt-1">${plaque.location || plaque.address || ''}</div>
            ${plaque.color ? `
              <div class="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <div class="w-3 h-3 rounded-full" style="background-color: ${bgColor}"></div>
                <span>${plaqueColor.charAt(0).toUpperCase() + plaqueColor.slice(1)} plaque</span>
              </div>
            ` : ''}
            ${plaque.erected ? `<div class="text-xs text-gray-500 mt-1">Erected: ${plaque.erected}</div>` : ''}
            ${plaque.visited ? `<div class="text-xs text-green-600 mt-1">✓ You've visited this plaque</div>` : ''}
            <div class="flex gap-2 mt-3">
              <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
                View Details
              </button>
              ${isRoutingMode ? `
                <button class="add-to-route py-1.5 px-3 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors">
                  Add to Route
                </button>
              ` : ''}
            </div>
          </div>
        `;
          
          // Add event listeners
          setTimeout(() => {
            const detailButton = popupContent.querySelector('.view-details');
            if (detailButton) {
              detailButton.addEventListener('click', () => {
                marker.closePopup();
                setTimeout(() => {
                  onPlaqueClick(plaque);
                }, 50);
              });
            }
            
            // Add route button click handler if in routing mode
            const addRouteButton = popupContent.querySelector('.add-to-route');
            if (addRouteButton) {
              addRouteButton.addEventListener('click', () => {
                // Check if plaque is already in route
                const isAlreadyInRoute = routePoints && routePoints.some(p => p.id === plaque.id);
                if (isAlreadyInRoute) {
                  toast.info("This plaque is already in your route");
                  return;
                }
                
                // Add to route
                addPlaqueToRoute(plaque);
                marker.closePopup();
              });
            }
          }, 0);
          
          // Configure popup
          const popupOptions = {
            closeButton: true,
            autoClose: true,
            className: 'plaque-popup-container',
            maxWidth: 300,
            minWidth: 200,
            offset: [0, -20]
          };
          
          marker.bindPopup(popupContent, popupOptions);
          
          // Add click handler
          marker.on('click', () => {
            marker.openPopup();
          });
          
          // Add to cluster group or marker layer
          if (clusterGroup) {
            clusterGroup.addLayer(marker);
          } else if (markersLayer) {
            markersLayer.addLayer(marker);
          }
        }
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    // Focus on selected plaque or fit all markers
    if (selectedPlaqueId && !maintainView) {
      const selectedPlaque = plaques.find(p => p.id === selectedPlaqueId);
      if (selectedPlaque && selectedPlaque.latitude && selectedPlaque.longitude) {
        const lat = parseFloat(selectedPlaque.latitude as unknown as string);
        const lng = parseFloat(selectedPlaque.longitude as unknown as string);
        if (!isNaN(lat) && !isNaN(lng)) {
          mapInstance.setView([lat, lng], 15, { animate: true });
        }
      }
    } else if (plaques.length > 0 && !maintainView && !routePoints.length) {
      // Only fit all markers if we're not in a route
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