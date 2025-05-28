// src/components/maps/core/useMarkers.ts
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Plaque } from '@/types/plaque';
import { createPlaqueIcon, createPlaquePopup } from '../utils/markerUtils';

interface MarkerOptions {
  onMarkerClick: (plaque: Plaque) => void;
  routeMode: boolean;
}

export const useMarkers = (
  map: L.Map | null,
  plaques: Plaque[],
  options: MarkerOptions
) => {
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers and clusters
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    
    // Create cluster group with optimized settings
    const clusterGroup = L.markerClusterGroup({
      // Clustering options
      maxClusterRadius: 80, // Pixels - how close markers need to be to cluster
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      
      // Performance options
      chunkedLoading: true, // Process markers in chunks to avoid blocking
      chunkInterval: 200, // Time between processing chunks
      chunkDelay: 50, // Delay before processing chunks
      
      // Remove markers outside viewport for better performance
      removeOutsideVisibleBounds: true,
      
      // Animation options (disable for better performance if needed)
      animate: true,
      animateAddingMarkers: false, // Disable animation when adding many markers
      
      // Disable clustering at zoom level 18
      disableClusteringAtZoom: 18,
      
      // Custom cluster icon
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        let className = 'marker-cluster-small';
        
        if (count > 100) {
          size = 'large';
          className = 'marker-cluster-large';
        } else if (count > 50) {
          size = 'medium';
          className = 'marker-cluster-medium';
        }
        
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${className}`,
          iconSize: L.point(40, 40)
        });
      }
    });
    
    // Create markers
    const markers: L.Marker[] = [];
    const markersMap = new Map<number, L.Marker>();
    
    plaques.forEach(plaque => {
      if (!plaque.latitude || !plaque.longitude) return;
      
      const lat = parseFloat(plaque.latitude as string);
      const lng = parseFloat(plaque.longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      const icon = createPlaqueIcon(L, plaque, false, false);
      const marker = L.marker([lat, lng], { icon });
      
      // Create popup
      const popupContent = createPlaquePopup(
        plaque,
        options.onMarkerClick,
        options.routeMode,
        options.routeMode ? options.onMarkerClick : null
      );
      
      marker.bindPopup(popupContent);
      
      // Add click handler
      marker.on('click', () => {
        if (options.routeMode) {
          // In route mode, clicking adds to route instead of opening popup
          options.onMarkerClick(plaque);
          // Prevent popup from opening
          return false;
        }
      });
      
      markers.push(marker);
      markersMap.set(plaque.id, marker);
    });
    
    // Add all markers to cluster group at once (more efficient)
    clusterGroup.addLayers(markers);
    
    // Add cluster group to map
    map.addLayer(clusterGroup);
    
    // Store references
    clusterGroupRef.current = clusterGroup;
    markersRef.current = markersMap;
    
    // Log performance info
    console.log(`Added ${markers.length} markers to cluster group`);
    
  }, [map, plaques, options.onMarkerClick, options.routeMode]);
};