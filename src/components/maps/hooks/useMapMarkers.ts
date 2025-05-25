// src/components/maps/hooks/useMapMarkers.ts - Fixed version
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plaque } from '@/types/plaque';
import { createPlaqueIcon, createPlaquePopup } from '../utils/markerUtils';

/**
 * Custom hook for managing map markers
 * Handles marker creation, clustering, and updates
 */
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
  const userHasInteractedRef = useRef(false);
  const initialFitDoneRef = useRef(false);
  
  // Track user interactions
  useEffect(() => {
    if (!mapInstance) return;
    
    const handleUserInteraction = () => {
      userHasInteractedRef.current = true;
    };
    
    mapInstance.on('dragstart', handleUserInteraction);
    mapInstance.on('zoomstart', handleUserInteraction);
    
    return () => {
      mapInstance.off('dragstart', handleUserInteraction);
      mapInstance.off('zoomstart', handleUserInteraction);
    };
  }, [mapInstance]);
  
  // Initialize marker layers
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    
    // Cleanup old layers if they exist
    if (markersLayerRef.current) {
      mapInstance.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }
    
    if (clusterGroupRef.current) {
      mapInstance.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    
    // Create marker layer - this is a fallback if clustering isn't available
    const markersLayer = window.L.layerGroup();
    markersLayerRef.current = markersLayer;
    
    try {
      // Ensure the map is fully initialized before creating cluster group
      setTimeout(() => {
        // Create cluster group if available
        if (window.L.markerClusterGroup) {
          try {
            const clusters = window.L.markerClusterGroup({
              showCoverageOnHover: false,
              maxClusterRadius: 50,
              spiderfyOnMaxZoom: true,
              disableClusteringAtZoom: 18,
              animate: true,
              zoomToBoundsOnClick: true,
              iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                let size = 40;
                
                // Size based on count
                if (count < 5) size = 40;
                else if (count < 20) size = 44;
                else if (count < 50) size = 48;
                else size = 52;
                
                return window.L.divIcon({
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
            
            // Add cluster group to map
            mapInstance.addLayer(clusters);
            clusterGroupRef.current = clusters;
          } catch (e) {
            console.error("Error creating marker cluster group:", e);
            // Fall back to regular layer group
            mapInstance.addLayer(markersLayer);
          }
        } else {
          // Fall back to regular layer group if clustering not available
          mapInstance.addLayer(markersLayer);
        }
      }, 300); // Delay to ensure map is ready
    } catch (e) {
      console.error("Error setting up marker layers:", e);
      mapInstance.addLayer(markersLayer);
    }
    
    // Cleanup on unmount
    return () => {
      if (markersLayerRef.current) {
        mapInstance.removeLayer(markersLayerRef.current);
      }
      
      if (clusterGroupRef.current) {
        mapInstance.removeLayer(clusterGroupRef.current);
      }
    };
  }, [mapInstance]);
  
  // Add markers to the map
  const addMapMarkers = useCallback(() => {
    if (!mapInstance || !window.L) {
      console.log("Map or Leaflet not available for adding markers");
      return;
    }
    
    // Make sure map is fully initialized before adding markers
    if (!mapInstance._loaded) {
      console.log("Map not fully loaded yet, delaying marker addition");
      setTimeout(addMapMarkers, 500);
      return;
    }
    
    const markersLayer = markersLayerRef.current;
    const clusterGroup = clusterGroupRef.current;
    
    // Clear existing markers
    if (markersLayer) {
      markersLayer.clearLayers();
    }
    
    if (clusterGroup) {
      clusterGroup.clearLayers();
    }
    
    console.log(`Adding ${plaques.length} markers to the map`);
    
    // Create a new markers map
    const newMarkersMap = new Map();
    const validMarkers = [];
    
    // Add markers for plaques
    plaques.forEach(plaque => {
      try {
        // Skip plaques without coordinates
        if (!plaque.latitude || !plaque.longitude) return;
        
        const lat = parseFloat(plaque.latitude);
        const lng = parseFloat(plaque.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Check if plaque is in route
        const isFavorite = favorites.includes(plaque.id);
        const isSelected = plaque.id === selectedPlaqueId;
        
        // Create icon for this plaque
        const icon = createPlaqueIcon(window.L, plaque, isFavorite, isSelected);
        
        // Create marker with better event handling
        const marker = window.L.marker([lat, lng], { 
          icon,
          bubblingMouseEvents: false, // Prevents click events from bubbling to map
          interactive: true, // Ensure the marker can be clicked
          keyboard: false, // Disable keyboard navigation to improve mobile experience
          zIndexOffset: isSelected ? 1000 : 0 // Make selected markers appear on top
        });
        
        // Create popup content
        const popupContent = createPlaquePopup(
          plaque,
          onPlaqueClick,
          isRoutingMode,
          addPlaqueToRoute
        );
        
        // Configure popup options
        const popupOptions = {
          closeButton: true,
          autoClose: true,
          className: 'plaque-popup-container',
          maxWidth: 300,
          minWidth: 200,
          offset: [0, -20],
          autoPanPadding: [50, 50], // Make sure popup is fully visible
          // Ensure popups work in fullscreen mode
          keepInView: true // Keep popup in view when panning
        };
        
        // Bind popup to marker
        marker.bindPopup(popupContent, popupOptions);
        
        // Add click handler
        marker.on('click', function(e: any) {
          // Stop propagation to prevent map click
          if (e.originalEvent) {
            L.DomEvent.stopPropagation(e.originalEvent);
          }
          marker.openPopup();
        });
        
        // Store marker in map
        newMarkersMap.set(plaque.id, marker);
        validMarkers.push(marker);
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    // Update markers map
    setMarkersMap(newMarkersMap);
    
    // Add markers to the appropriate layer
    try {
      if (clusterGroup && validMarkers.length > 0) {
        validMarkers.forEach(marker => {
          clusterGroup.addLayer(marker);
        });
      } else if (markersLayer && validMarkers.length > 0) {
        validMarkers.forEach(marker => {
          markersLayer.addLayer(marker);
        });
      }
      
      // Force map to update
      mapInstance.invalidateSize();
    } catch (e) {
      console.error("Error adding markers to layers:", e);
    }
    
    // FIXED: Only auto-fit bounds on initial load or when explicitly requested
    if (selectedPlaqueId && !maintainView && !userHasInteractedRef.current) {
      const selectedPlaque = plaques.find(p => p.id === selectedPlaqueId);
      if (selectedPlaque && selectedPlaque.latitude && selectedPlaque.longitude) {
        const lat = parseFloat(selectedPlaque.latitude as unknown as string);
        const lng = parseFloat(selectedPlaque.longitude as unknown as string);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Use a timeout to allow map to render first
          setTimeout(() => {
            mapInstance.setView([lat, lng], 15, { animate: true });
          }, 100);
        }
      }
    } else if (plaques.length > 0 && !maintainView && !initialFitDoneRef.current && !userHasInteractedRef.current) {
      // Only fit all markers on very first load
      const validPlaques = plaques.filter(p => p.latitude && p.longitude);
      
      if (validPlaques.length > 0) {
        try {
          const latLngs = validPlaques.map(p => [
            parseFloat(p.latitude), 
            parseFloat(p.longitude)
          ]);
          
          // Create bounds from points
          const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
          
          if (bounds.isValid()) {
            // Use a timeout to allow map to render first
            setTimeout(() => {
              mapInstance.fitBounds(bounds, { padding: [50, 50] });
              initialFitDoneRef.current = true;
            }, 300);
          }
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      }
    }
  }, [
    mapInstance, 
    plaques, 
    favorites, 
    selectedPlaqueId, 
    maintainView, 
    isRoutingMode, 
    onPlaqueClick, 
    addPlaqueToRoute
  ]);
  
  // Update markers when plaques or selection changes
  useEffect(() => {
    if (mapInstance) {
      // Use a timeout to ensure map is fully initialized
      const markerTimeout = setTimeout(() => {
        addMapMarkers();
      }, 500);
      
      return () => clearTimeout(markerTimeout);
    }
  }, [
    mapInstance, 
    plaques, 
    favorites, 
    selectedPlaqueId, 
    maintainView, 
    isRoutingMode,
    addMapMarkers
  ]);
  
  return { 
    markersMap,
    redrawMarkers: addMapMarkers
  };
}