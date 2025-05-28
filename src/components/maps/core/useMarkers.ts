// src/components/maps/core/useMarkers.ts - Updated with Minimalist Outline Cluster Icons
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
    
    // Create cluster group with Minimalist Outline styling
    const clusterGroup = L.markerClusterGroup({
      // Clustering options
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      
      // Performance options
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: 18,
      
      // UPDATED: Minimalist Outline cluster icon function
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 36;
        let fontSize = '12px';
        
        // Responsive sizing based on cluster count
        if (count < 6) {
          size = 36;
          fontSize = '12px';
        } else if (count < 21) {
          size = 44;
          fontSize = '14px';
        } else {
          size = 52;
          fontSize = '16px';
        }
        
        return L.divIcon({
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: white;
              color: #3b82f6;
              border: 3px solid #3b82f6;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: ${fontSize};
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              transition: all 0.2s ease;
              cursor: pointer;
            ">
              ${count}
            </div>
          `,
          className: 'minimalist-cluster-icon',
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });
      }
    });
    
    // Create markers
    const markers: L.Marker[] = [];
    const markersMap = new Map<number, L.Marker>();
    
    plaques.forEach(plaque => {
      try {
        // Skip plaques without coordinates
        if (!plaque.latitude || !plaque.longitude) return;
        
        const lat = parseFloat(plaque.latitude as string);
        const lng = parseFloat(plaque.longitude as string);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Create icon for this plaque
        const icon = createPlaqueIcon(L, plaque, false, false);
        const marker = L.marker([lat, lng], { 
          icon,
          bubblingMouseEvents: false,
          interactive: true,
          keyboard: false,
          zIndexOffset: 0
        });
        
        // Create popup content
        const popupContent = createPlaquePopup(
          plaque,
          options.onMarkerClick,
          options.routeMode,
          options.routeMode ? options.onMarkerClick : null
        );
        
        // Configure popup options
        const popupOptions = {
          closeButton: true,
          autoClose: true,
          className: 'plaque-popup-container',
          maxWidth: 300,
          minWidth: 200,
          offset: [0, -20],
          autoPanPadding: [50, 50],
          keepInView: true
        };
        
        // Bind popup to marker
        marker.bindPopup(popupContent, popupOptions);
        
        // Add click handler
        marker.on('click', function(e: any) {
          if (options.routeMode) {
            options.onMarkerClick(plaque);
            return false;
          }
          marker.openPopup();
        });
        
        // Store marker in map
        markersMap.set(plaque.id, marker);
        markers.push(marker);
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    // Add all markers to cluster group at once
    clusterGroup.addLayers(markers);
    
    // Add cluster group to map
    map.addLayer(clusterGroup);
    
    // Store references
    clusterGroupRef.current = clusterGroup;
    markersRef.current = markersMap;
    
    console.log(`Added ${markers.length} markers with minimalist outline clusters`);
    
  }, [map, plaques, options.onMarkerClick, options.routeMode]);
};