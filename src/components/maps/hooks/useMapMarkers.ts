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
  const fitToMarkers = useCallback((plaquesToFit: Plaque[] = []) => {
    if (!mapInstance || !window.L) return;
    
    const validPlaques = plaquesToFit.filter(p => 
      p.latitude && p.longitude && 
      !isNaN(parseFloat(String(p.latitude))) && 
      !isNaN(parseFloat(String(p.longitude)))
    );
    
    if (validPlaques.length > 0) {
      try {
        const latLngs = validPlaques.map(p => {
          const lat = typeof p.latitude === 'string' ? 
            parseFloat(p.latitude) : p.latitude;
          const lng = typeof p.longitude === 'string' ? 
            parseFloat(p.longitude) : p.longitude;
          return window.L.latLng(lat, lng);
        });
        
        const bounds = window.L.latLngBounds(latLngs);
        
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
    } else {
      // Default view if no valid plaques
      mapInstance.setView([51.505, -0.09], 13);
    }
  }, [mapInstance]);
  
  // Create a plaque marker
  const createPlaqueMarker = useCallback((plaque: Plaque) => {
    if (!window.L || !mapInstance) return null;
    
    try {
      // Ensure coordinates are valid numbers
      if (!plaque.latitude || !plaque.longitude) {
        return null;
      }
      
      const lat = typeof plaque.latitude === 'string' ? 
        parseFloat(plaque.latitude) : plaque.latitude;
      const lng = typeof plaque.longitude === 'string' ? 
        parseFloat(plaque.longitude) : plaque.longitude;
      
      if (isNaN(lat) || isNaN(lng)) {
        return null;
      }
      
      // Get plaque color for marker
      const colorMap: Record<string, string> = {
        'blue': '#3b82f6',
        'green': '#10b981',
        'brown': '#b45309',
        'black': '#1f2937',
        'grey': '#4b5563',
        'gray': '#4b5563'
      };
      
      const color = colorMap[(plaque.color?.toLowerCase() || 'blue')] || '#3b82f6';
      const isFavorite = favorites.includes(plaque.id);
      const isSelected = selectedPlaqueId === plaque.id;
      
      // Create custom icon HTML
      const iconHtml = `
        <div class="flex items-center justify-center ${isSelected ? 'scale-125' : ''}">
          <div class="bg-white rounded-full p-1 shadow-md ${isFavorite ? 'ring-2 ring-amber-500' : ''}">
            <div style="
              background-color: ${color}; 
              width: 24px; 
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            ">
              ${plaque.visited ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
              }
            </div>
          </div>
        </div>
      `;
      
      // Create marker with custom icon
      const icon = window.L.divIcon({
        className: `custom-marker ${isSelected ? 'selected-marker' : ''}`,
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      
      const marker = window.L.marker([lat, lng], { 
        icon: icon,
        riseOnHover: true,
        title: plaque.title || 'Plaque'
      });
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'plaque-popup p-2';
      
      // Create popup HTML with conditional routing button
      popupContent.innerHTML = `
        <div class="font-semibold text-sm mb-1">${plaque.title || 'Unnamed Plaque'}</div>
        <div class="text-xs text-gray-600 mb-2 truncate">${plaque.location || plaque.address || ''}</div>
        <div class="flex gap-2">
          <button class="view-details py-1 px-2 bg-blue-500 text-white text-xs rounded flex-grow hover:bg-blue-600 transition-colors">View Details</button>
          ${isRoutingMode ? `
            <button class="add-to-route py-1 px-2 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors">
              Add to Route
            </button>
          ` : ''}
        </div>
      `;
      
      // Create popup with specified options
      const popup = window.L.popup({
        closeButton: true,
        autoClose: true,
        className: 'plaque-popup-container',
        offset: [0, -14] // Adjust offset to position the popup better
      }).setContent(popupContent);
      
      // Bind popup to marker
      marker.bindPopup(popup);
      
      // Add click handlers after a small delay to ensure DOM is ready
      setTimeout(() => {
        // Add event listeners for popup buttons
        const detailButton = popupContent.querySelector('.view-details');
        if (detailButton) {
          detailButton.addEventListener('click', () => {
            if (onPlaqueClick) onPlaqueClick(plaque);
            marker.closePopup();
          });
        }
        
        const routeButton = popupContent.querySelector('.add-to-route');
        if (routeButton && addPlaqueToRoute) {
          routeButton.addEventListener('click', () => {
            addPlaqueToRoute(plaque);
            marker.closePopup();
          });
        }
      }, 10);
      
      // Add click handler for the marker itself
      marker.on('click', () => {
        // Only handle direct marker clicks when not in routing mode
        if (!isRoutingMode) {
          onPlaqueClick(plaque);
        }
        // For routing mode, let the popup buttons handle it
      });
      
      return marker;
    } catch (error) {
      console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      return null;
    }
  }, [mapInstance, favorites, selectedPlaqueId, onPlaqueClick, isRoutingMode, addPlaqueToRoute]);
  
  // Add route markers for the walking route
  const addRouteMarkers = useCallback(() => {
    if (!mapInstance || !window.L || !routeMarkerGroup) return;
    
    // Clear existing route markers
    routeMarkerGroup.clearLayers();
    
    // Add new route markers
    routePoints.forEach((point, index) => {
      try {
        if (!point.latitude || !point.longitude) return;
        
        const lat = typeof point.latitude === 'string' ? 
          parseFloat(point.latitude) : point.latitude;
        const lng = typeof point.longitude === 'string' ? 
          parseFloat(point.longitude) : point.longitude;
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Determine marker style based on position
        let markerLabel, markerColor, markerClass;
        
        if (index === 0) {
          markerLabel = 'S';
          markerColor = '#3b82f6'; // Blue for start
          markerClass = 'route-marker-start';
        } else if (index === routePoints.length - 1) {
          markerLabel = 'E';
          markerColor = '#ef4444'; // Red for end
          markerClass = 'route-marker-end';
        } else {
          markerLabel = (index + 1).toString();
          markerColor = '#10b981'; // Green for waypoints
          markerClass = 'route-marker-waypoint';
        }
        
        // Create route marker with diamond shape
        const routeMarker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            className: `route-marker ${markerClass}`,
            html: `
              <div class="route-marker-container">
                <div class="route-marker-diamond" style="background-color: ${markerColor};">
                  <div class="route-marker-content">${markerLabel}</div>
                </div>
                <div class="route-marker-label">${
                  index === 0 ? 'Start' : 
                    index === routePoints.length - 1 ? 'End' : 
                    `Stop ${index + 1}`
                }</div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          }),
          zIndexOffset: 1000,
          riseOnHover: true
        });
        
        // Create popup for route marker
        const popupContent = document.createElement('div');
        popupContent.className = 'route-popup p-2';
        
        // Create popup HTML
        popupContent.innerHTML = `
          <div class="font-semibold text-sm">${point.title || 'Stop ' + (index + 1)}</div>
          <div class="text-xs text-green-600 mt-1">
            • ${index === 0 ? 'Starting point' : 
                index === routePoints.length - 1 ? 'Final destination' : 
                `Stop #${index + 1}`
              } in walking route
          </div>
          <div class="flex gap-2 mt-2">
            <button class="view-details py-1 px-2 bg-blue-500 text-white text-xs rounded flex-grow hover:bg-blue-600 transition-colors">
              View Details
            </button>
            <button class="remove-from-route py-1 px-2 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors">
              Remove
            </button>
          </div>
        `;
        
        // Create and bind popup
        const popup = window.L.popup({
          closeButton: true,
          className: 'route-popup-container',
          offset: [0, -25]
        }).setContent(popupContent);
        
        routeMarker.bindPopup(popup);
        
        // Add click handlers
        setTimeout(() => {
          const detailButton = popupContent.querySelector('.view-details');
          if (detailButton) {
            detailButton.addEventListener('click', () => {
              if (onPlaqueClick) onPlaqueClick(point);
              routeMarker.closePopup();
            });
          }
          
          const removeButton = popupContent.querySelector('.remove-from-route');
          if (removeButton) {
            removeButton.addEventListener('click', () => {
              removePlaqueFromRoute(point.id);
              routeMarker.closePopup();
            });
          }
        }, 10);
        
        // Add marker to group
        routeMarker.addTo(routeMarkerGroup);
        
      } catch (error) {
        console.error(`Error creating route marker for point ${index}:`, error);
      }
    });
  }, [mapInstance, routeMarkerGroup, routePoints, onPlaqueClick, removePlaqueFromRoute]);
  
  // Add markers to the map
  const addMapMarkers = useCallback(() => {
    if (!mapInstance || !window.L) {
      console.log("Map or Leaflet not available for adding markers");
      return;
    }
    
    console.log(`Adding ${plaques.length} markers to the map`);
    
    try {
      // Clear existing layers if they exist
      if (markersLayer) {
        markersLayer.clearLayers();
      }
      
      if (clusterGroup) {
        clusterGroup.clearLayers();
      }
      
      // Create markers for all plaques
      plaques.forEach(plaque => {
        const marker = createPlaqueMarker(plaque);
        if (marker) {
          // Add to cluster group for better performance
          clusterGroup.addLayer(marker);
        }
      });
      
      // Add route markers if in routing mode
      if (isRoutingMode && routePoints.length > 0) {
        addRouteMarkers();
      }
      
      // Fit map to markers if not maintaining view and not in a route
      if (plaques.length > 0 && !maintainView && !routePoints.length) {
        fitToMarkers(plaques);
      }
    } catch (error) {
      console.error("Error adding map markers:", error);
      toast.error("Error displaying plaques on the map");
    }
  }, [
    mapInstance, 
    markersLayer, 
    clusterGroup, 
    plaques, 
    createPlaqueMarker, 
    isRoutingMode, 
    routePoints, 
    addRouteMarkers, 
    maintainView, 
    fitToMarkers
  ]);
  
  return {
    addMapMarkers,
    fitToMarkers,
    createPlaqueMarker,
    addRouteMarkers
  };
};

export default useMapMarkers;