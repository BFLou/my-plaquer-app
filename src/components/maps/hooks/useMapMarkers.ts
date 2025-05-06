// src/components/maps/hooks/useMapMarkers.ts
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

export const useMapMarkers = ({
  mapInstance,
  markersLayer,
  clusterGroup,
  routeMarkerGroup,
  routeLineRef,
  plaques = [],
  favorites = [],
  selectedPlaqueId = null,
  onPlaqueClick = () => {},
  isRoutingMode = false,
  addPlaqueToRoute = () => {},
  removePlaqueFromRoute = () => {},
  routePoints = [],
  maintainView = false,
  formatDistance,
  calculateWalkingTime,
  isDrawingRoute,
  setIsDrawingRoute
}) => {
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
    
    console.log(`Adding ${plaques.length} markers to the map`);
    
    // Add markers for plaques
    plaques.forEach(plaque => {
      try {
        // Skip plaques without coordinates
        if (!plaque.latitude || !plaque.longitude) return;
        
        const lat = parseFloat(plaque.latitude);
        const lng = parseFloat(plaque.longitude);
        
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
                routeIndex === 0 ? 'Start point' : 
                routeIndex === routePoints.length - 1 ? 'End point' : 
                `Stop #${routeIndex + 1}`
              } in route</div>
              <div class="flex gap-2 mt-3">
                <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
                  View Details
                </button>
                <button class="remove-from-route py-1.5 px-3 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors">
                  Remove from Route
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
        const lat = parseFloat(selectedPlaque.latitude);
        const lng = parseFloat(selectedPlaque.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          mapInstance.setView([lat, lng], 15, { animate: true });
        }
      }
    } else if (plaques.length > 0 && !maintainView) {
      // Fit bounds to show all markers if no specific one is selected
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
  
  // Fit to bounds based on plaque markers
  const fitToMarkers = useCallback((plaquesToFit) => {
    if (!mapInstance || !window.L) return;
    
    const validPlaques = plaquesToFit.filter(p => p.latitude && p.longitude);
    
    if (validPlaques.length > 0) {
      try {
        const latLngs = validPlaques.map(p => [
          parseFloat(p.latitude), 
          parseFloat(p.longitude)
        ]);
        
        const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
        
        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.warn("Non-critical error fitting to markers:", e);
        // Fallback to fixed view
        mapInstance.setView([51.505, -0.09], 13);
      }
    }
  }, [mapInstance]);
  
  // Draw a simplified route line with fallback for API errors
  const drawSimpleRoute = useCallback((pointsForRoute) => {
    if (!mapInstance || !window.L || pointsForRoute.length < 2) {
      console.log("Cannot draw route: Map not loaded or insufficient points");
      return null;
    }
    
    // Set drawing state to prevent re-renders during operation
    setIsDrawingRoute(true);
    
    try {
      // Clear any existing route
      if (routeLineRef.current) {
        mapInstance.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Filter valid points
      const validPoints = pointsForRoute
        .filter(p => p.latitude && p.longitude)
        .map(p => [
          parseFloat(p.latitude),
          parseFloat(p.longitude)
        ])
        .filter(coords => !isNaN(coords[0]) && !isNaN(coords[1]));
      
      if (validPoints.length < 2) {
        console.warn("Not enough valid points to draw route");
        setIsDrawingRoute(false);
        return null;
      }
      
      // Create route group
      const routeGroup = window.L.featureGroup().addTo(mapInstance);
      
      // Draw line segments between consecutive points
      for (let i = 0; i < validPoints.length - 1; i++) {
        const startPoint = validPoints[i];
        const endPoint = validPoints[i + 1];
        
        // Draw route segment
        const routeSegment = window.L.polyline([startPoint, endPoint], {
          color: '#10b981', // green
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '10, 10',
          className: 'animated-dash'
        }).addTo(routeGroup);
        
        // Calculate segment distance
        const segmentDistance = calculateDistance(
          startPoint[0], 
          startPoint[1], 
          endPoint[0], 
          endPoint[1]
        );
        
        // Add distance label at midpoint
        const midPoint = [
          (startPoint[0] + endPoint[0]) / 2,
          (startPoint[1] + endPoint[1]) / 2
        ];
        
        window.L.marker(midPoint, {
          icon: window.L.divIcon({
            className: 'distance-label',
            html: `
              <div class="route-distance-label">
                ${formatDistance(segmentDistance)}
              </div>
            `,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
          })
        }).addTo(routeGroup);
      }
      
      // Fit to route bounds
      try {
        const bounds = window.L.latLngBounds(validPoints);
        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.warn("Non-critical error fitting to route bounds:", error);
      }
      
      // Add total distance summary
      const totalDistance = calculateRouteDistance(pointsForRoute);
      
      // Store reference and update state
      routeLineRef.current = routeGroup;
      
      // Refresh the markers to ensure route markers show up correctly
      setTimeout(() => {
        addMapMarkers();
        setIsDrawingRoute(false);
      }, 100);
      
      return { routeGroup, totalDistance };
    } catch (error) {
      console.error("Error drawing simple route:", error);
      setIsDrawingRoute(false);
      
      // Ensure we don't leave hanging references
      if (routeLineRef.current && mapInstance) {
        mapInstance.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Notify user of error
      toast.error("Couldn't draw the complete route. Using simplified view.");
      
      return null;
    }
  }, [calculateDistance, formatDistance, addMapMarkers, mapInstance, setIsDrawingRoute, routeLineRef]);
  
  // Calculate total route distance
  const calculateRouteDistance = (points) => {
    if (!points || points.length < 2) return 0;
    
    let totalDistance = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
      
      const startLat = parseFloat(start.latitude);
      const startLng = parseFloat(start.longitude);
      const endLat = parseFloat(end.latitude);
      const endLng = parseFloat(end.longitude);
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
      
      // Calculate direct distance (haversine formula)
      totalDistance += calculateDistance(startLat, startLng, endLat, endLng);
    }
    
    return totalDistance;
  };
  
  return {
    addMapMarkers,
    drawSimpleRoute,
    fitToMarkers,
    routeLineRef
  };
};