import { useState, useEffect, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import { createPlaqueIcon } from '../utils/markerUtils';
import { createPlaquePopup } from '../utils/markerUtils';

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
  const lastViewStateRef = useRef<any>(null);
  
  // Initialize cluster group
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    
    const L = window.L;
    
    // Create cluster group if MarkerClusterGroup is available
    if (L.markerClusterGroup) {
      const clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 18,
        animate: true,
        iconCreateFunction: function(cluster: any) {
          return L.divIcon({
            html: `<div class="marker-cluster"><div>${cluster.getChildCount()}</div></div>`,
            className: 'custom-cluster',
            iconSize: L.point(40, 40)
          });
        }
      });
      
      mapInstance.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    }
  }, [mapInstance]);
  
  // Update markers when plaques change
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    
    const L = window.L;
    const clusterGroup = clusterGroupRef.current;
    
    // Clear existing markers
    if (clusterGroup) {
      clusterGroup.clearLayers();
    } else {
      markersMap.forEach(marker => marker.remove());
    }
    
    const newMarkersMap = new Map();
    
    // Add markers for plaques with valid coordinates
    plaques.forEach(plaque => {
      if (!plaque.latitude || !plaque.longitude) return;
      
      try {
        const lat = parseFloat(plaque.latitude as unknown as string);
        const lng = parseFloat(plaque.longitude as unknown as string);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Create marker
        const marker = L.marker([lat, lng], {
          icon: createPlaqueIcon(L, plaque, favorites.includes(plaque.id), plaque.id === selectedPlaqueId)
        });
        
        // Add popup with routing capability
        const popupContent = createPlaquePopup(
          plaque, 
          onPlaqueClick, 
          isRoutingMode, 
          isRoutingMode ? addPlaqueToRoute : null
        );
        
        marker.bindPopup(popupContent);
        
        // Store marker reference
        newMarkersMap.set(plaque.id, marker);
        
        // Add to cluster group or directly to map
        if (clusterGroup) {
          clusterGroup.addLayer(marker);
        } else {
          marker.addTo(mapInstance);
        }
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    setMarkersMap(newMarkersMap);
    
    // If we have markers and no previous view state, fit bounds
    if (newMarkersMap.size > 0 && !lastViewStateRef.current) {
      const bounds = L.latLngBounds(
        Array.from(newMarkersMap.values()).map(marker => marker.getLatLng())
      );
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Center on selected plaque if needed
    if (selectedPlaqueId && !maintainView) {
      const selectedPlaque = plaques.find(p => p.id === selectedPlaqueId);
      if (selectedPlaque?.latitude && selectedPlaque?.longitude) {
        const lat = parseFloat(selectedPlaque.latitude as unknown as string);
        const lng = parseFloat(selectedPlaque.longitude as unknown as string);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          mapInstance.panTo([lat, lng], { animate: true });
        }
      }
    }
  }, [mapInstance, plaques, favorites, selectedPlaqueId, isRoutingMode, onPlaqueClick, addPlaqueToRoute, maintainView]);
  
  return { markersMap };
}