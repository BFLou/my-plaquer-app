// src/components/maps/hooks/useMapMarkers.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plaque } from '@/types/plaque';

export default function useMapMarkers(
  mapInstance: any,
  plaques: Plaque[],
  favorites: number[],
  selectedPlaqueId: number | null | undefined,
  isRoutingMode: boolean,
  onPlaqueClick: (plaque: Plaque) => void,
  addPlaqueToRoute: (plaque: Plaque) => void,
  maintainView: boolean = false
) {
  const [markersMap, setMarkersMap] = useState<Map<number, any>>(new Map());
  const clusterGroupRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const lastViewStateRef = useRef<any>(null);
  
  // Create and style popup content for a plaque
  const createPlaquePopup = useCallback((
    plaque: Plaque, 
    isFavorite: boolean,
    isRouting: boolean
  ) => {
    // Create DOM element for popup
    const popupContent = document.createElement('div');
    popupContent.className = 'plaque-popup p-3';
    
    // Truncate inscription if too long
    const inscription = plaque.inscription 
      ? plaque.inscription.length > 100 
        ? plaque.inscription.substring(0, 100) + '...' 
        : plaque.inscription
      : '';
    
    // Prepare color display (if available)
    const plaqueColor = plaque.color?.toLowerCase() || 'blue';
    const colorDisplay = `
      <div class="flex items-center gap-1 text-xs text-gray-500 mt-1">
        <div class="w-3 h-3 rounded-full" style="background-color: ${
          plaqueColor === 'blue' ? '#3b82f6' : 
          plaqueColor === 'green' ? '#10b981' : 
          plaqueColor === 'brown' ? '#b45309' : 
          plaqueColor === 'black' ? '#1f2937' : 
          plaqueColor === 'grey' || plaqueColor === 'gray' ? '#4b5563' : 
          '#3b82f6'
        }"></div>
        <span>${plaqueColor.charAt(0).toUpperCase() + plaqueColor.slice(1)} plaque</span>
      </div>
    `;
    
    // Create popup HTML with improved styling
    popupContent.innerHTML = `
      <div class="max-w-xs">
        <div class="font-medium text-sm">${plaque.title || 'Unnamed Plaque'}</div>
        <div class="text-xs text-gray-600 mt-1">${plaque.location || plaque.address || ''}</div>
        ${plaque.color ? colorDisplay : ''}
        ${plaque.erected ? `<div class="text-xs text-gray-500 mt-1">Erected: ${plaque.erected}</div>` : ''}
        ${plaque.visited ? `<div class="text-xs text-green-600 mt-1">✓ You've visited this plaque</div>` : ''}
        ${inscription ? `
          <div class="text-xs text-gray-600 mt-2 italic">${inscription}</div>
        ` : ''}
        <div class="flex gap-2 mt-3">
          <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
            View Details
          </button>
          ${isRouting ? `
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
          onPlaqueClick(plaque);
        });
      }
      
      const routeButton = popupContent.querySelector('.add-to-route');
      if (routeButton) {
        routeButton.addEventListener('click', () => {
          addPlaqueToRoute(plaque);
        });
      }
    }, 0);
    
    return popupContent;
  }, [onPlaqueClick, addPlaqueToRoute]);
  
  // Create a marker icon for a plaque
  const createPlaqueIcon = useCallback((
    L: any,
    plaque: Plaque,
    isFavorite: boolean,
    isSelected: boolean
  ) => {
    // Get plaque color with fallback to blue
    const plaqueColor = (plaque.color?.toLowerCase() || 'blue');
    
    // Color mapping for different plaque types
    const bgColor = {
      'blue': '#3b82f6',
      'green': '#10b981',
      'brown': '#b45309',
      'black': '#1f2937',
      'grey': '#4b5563',
      'gray': '#4b5563'
    }[plaqueColor] || '#3b82f6';
    
    // Determine size based on state
    let size = isSelected ? 42 : 36;
    
    // Create HTML for the marker
    const html = `
      <div class="plaque-marker ${isSelected ? 'plaque-marker-selected' : ''}">
        <div class="marker-container" style="${isSelected ? 'transform: scale(1.2);' : ''} transition: transform 0.2s ease;">
          <div style="
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: ${isFavorite ? '2px solid #f59e0b' : '2px solid white'};
            padding: 2px;
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
              ${plaque.visited 
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' 
                : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
              }
            </div>
          </div>
          ${isSelected ? `
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              background-color: rgba(59, 130, 246, 0.3);
              animation: pulse 1.5s infinite;
              z-index: -1;
            "></div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Add CSS animation for pulse effect
    if (!document.getElementById('plaque-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'plaque-marker-styles';
      style.innerHTML = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .plaque-marker {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .plaque-marker-selected {
          z-index: 1000 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return L.divIcon({
      className: 'custom-marker',
      html,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }, []);
  
  // Initialize cluster group 
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    
    const L = window.L;
    
    // Create markers layer group
    const markersLayer = L.layerGroup();
    markersLayer.addTo(mapInstance);
    markersLayerRef.current = markersLayer;
    
    // Create cluster group if MarkerClusterGroup is available
    if (L.markerClusterGroup) {
      const clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 18,
        animate: true,
        spiderfyDistanceMultiplier: 1.5,
        iconCreateFunction: function(cluster: any) {
          const count = cluster.getChildCount();
          let size;
          
          // Size based on count
          if (count < 5) size = 40;
          else if (count < 20) size = 44;
          else if (count < 50) size = 48;
          else size = 52;
          
          // Create custom icon for clusters
          return L.divIcon({
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
              ">
                <div style="
                  width: calc(100% - 4px);
                  height: calc(100% - 4px);
                  border-radius: 50%;
                  background-color: #3b82f6;
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14px;
                ">
                  ${count}
                </div>
              </div>
            `,
            className: 'custom-cluster',
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
          });
        }
      });
      
      // Add custom behavior to clusters
      clusterGroup.on('clusterclick', function(e: any) {
        // Get current zoom level
        const currentZoom = mapInstance.getZoom();
        const maxZoom = mapInstance.getMaxZoom();
        
        // If we're at max zoom or cluster is small, spiderfy instead of zooming
        if (currentZoom >= maxZoom - 1 || e.layer.getAllChildMarkers().length < 6) {
          e.layer.spiderfy();
          return false; // Prevent default zoom
        }
      });
      
      mapInstance.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    }
    
    return () => {
      // Cleanup
      if (markersLayerRef.current) {
        mapInstance.removeLayer(markersLayerRef.current);
      }
      
      if (clusterGroupRef.current) {
        mapInstance.removeLayer(clusterGroupRef.current);
      }
    };
  }, [mapInstance]);
  
  // Function to redraw all markers
  const redrawMarkers = useCallback(() => {
    if (!mapInstance || !window.L) return;
    
    // Create markers for all plaques
    const L = window.L;
    const cluster = clusterGroupRef.current;
    const markersLayer = markersLayerRef.current;
    
    // Clear existing markers
    if (cluster) {
      cluster.clearLayers();
    }
    
    if (markersLayer) {
      markersLayer.clearLayers();
    }
    
    const newMarkersMap = new Map();
    
    // Add markers for each plaque with valid coordinates
    plaques.forEach(plaque => {
      if (!plaque.latitude || !plaque.longitude) return;
      
      try {
        const lat = parseFloat(plaque.latitude as unknown as string);
        const lng = parseFloat(plaque.longitude as unknown as string);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Create marker with custom icon
        const marker = L.marker([lat, lng], {
          icon: createPlaqueIcon(
            L, 
            plaque, 
            favorites.includes(plaque.id), 
            plaque.id === selectedPlaqueId
          )
        });
        
        // Create popup content
        const popupContent = createPlaquePopup(
          plaque,
          favorites.includes(plaque.id),
          isRoutingMode
        );
        
        // Configure popup options
        const popupOptions = {
          closeButton: true,
          autoClose: true,
          className: 'plaque-popup-container',
          maxWidth: 300,
          minWidth: 200,
          offset: [0, -20]
        };
        
        // Bind popup
        marker.bindPopup(popupContent, popupOptions);
        
        // Add click handler
        marker.on('click', () => {
          // If in routing mode and popup is open, don't trigger the main click handler
          if (isRoutingMode && marker.isPopupOpen()) {
            return;
          }
          
          // Open popup
          marker.openPopup();
        });
        
        // Store marker reference
        newMarkersMap.set(plaque.id, marker);
        
        // Add to cluster or markers layer
        if (cluster) {
          cluster.addLayer(marker);
        } else if (markersLayer) {
          markersLayer.addLayer(marker);
        }
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    // Update markers map
    setMarkersMap(newMarkersMap);
    
    // If selection changed, update the view
    if (selectedPlaqueId && !maintainView) {
      const selectedMarker = newMarkersMap.get(selectedPlaqueId);
      if (selectedMarker) {
        // Save current view state
        lastViewStateRef.current = {
          center: mapInstance.getCenter(),
          zoom: mapInstance.getZoom()
        };
        
        // Pan to selected marker
        mapInstance.panTo(selectedMarker.getLatLng(), {
          animate: true,
          duration: 0.5
        });
      }
    }
  }, [
    mapInstance, 
    plaques, 
    favorites, 
    selectedPlaqueId, 
    isRoutingMode, 
    maintainView, 
    createPlaqueIcon,
    createPlaquePopup
  ]);
  
  // Update markers when data changes
  useEffect(() => {
    redrawMarkers();
  }, [
    mapInstance, 
    plaques, 
    favorites, 
    selectedPlaqueId, 
    isRoutingMode, 
    maintainView,
    redrawMarkers
  ]);
  
  return { 
    markersMap,
    redrawMarkers
  };
}