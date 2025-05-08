// src/components/maps/hooks/useMapMarkers.ts
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
  
  // Initialize marker layers
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    
    // Create marker layer
    const markersLayer = window.L.layerGroup().addTo(mapInstance);
    markersLayerRef.current = markersLayer;
    
    // Create cluster group if available
    if (window.L.markerClusterGroup) {
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
      
      mapInstance.addLayer(clusters);
      clusterGroupRef.current = clusters;
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
        
        // Create marker
        const marker = window.L.marker([lat, lng], { icon });
        
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
          offset: [0, -20]
        };
        
        // Bind popup to marker
        marker.bindPopup(popupContent, popupOptions);
        
        // Add click handler
        marker.on('click', () => {
          marker.openPopup();
        });
        
        // Store marker in map
        newMarkersMap.set(plaque.id, marker);
        
        // Add marker to the appropriate layer
        if (clusterGroup) {
          clusterGroup.addLayer(marker);
        } else if (markersLayer) {
          markersLayer.addLayer(marker);
        }
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    // Update markers map
    setMarkersMap(newMarkersMap);
    
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
            mapInstance.fitBounds(bounds, { padding: [50, 50] });
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
      addMapMarkers();
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