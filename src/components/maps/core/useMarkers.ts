// src/components/maps/core/useMarkers.ts - FIXED TypeScript Issues + Route Mode Enhancement
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Plaque } from '@/types/plaque';
import { createPlaqueIcon, createPlaquePopup } from '../utils/markerUtils';
import { triggerHapticFeedback, isMobile } from '@/utils/mobileUtils';

interface MarkerOptions {
  onMarkerClick: (plaque: Plaque) => void;
  onAddToRoute?: (plaque: Plaque) => void;
  routeMode: boolean;
}

const useMarkers = (
  map: L.Map | null,
  plaques: Plaque[],
  options: MarkerOptions
) => {
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const mobile = isMobile();
  
  useEffect(() => {
    console.log('🗺️ useMarkers: Starting with', plaques.length, 'plaques, route mode:', options.routeMode);
    
    if (!map) {
      console.log('🗺️ useMarkers: No map available');
      return;
    }
    
    // Clear existing markers and clusters
    markersRef.current.forEach(marker => {
      try {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });
    markersRef.current.clear();
    
    if (clusterGroupRef.current) {
      try {
        if (map.hasLayer(clusterGroupRef.current)) {
          map.removeLayer(clusterGroupRef.current);
        }
      } catch (error) {
        console.warn('Error removing cluster group:', error);
      }
      clusterGroupRef.current = null;
    }
    
    // Create cluster group with enhanced styling for route mode
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: options.routeMode ? 60 : 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: !options.routeMode,
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: options.routeMode ? 15 : 18,
      
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 36;
        let fontSize = '12px';
        let color = options.routeMode ? '#10b981' : '#3b82f6';
        
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
              color: ${color};
              border: 3px solid ${color};
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(${options.routeMode ? '16, 185, 129' : '59, 130, 246'}, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: ${fontSize};
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              transition: all 0.2s ease;
              cursor: pointer;
              ${options.routeMode ? 'animation: route-pulse 2s infinite;' : ''}
            ">
              ${count}
            </div>
            ${options.routeMode ? `
              <div style="
                position: absolute;
                top: -2px;
                right: -2px;
                width: 12px;
                height: 12px;
                background: #059669;
                border: 2px solid white;
                border-radius: 50%;
                font-size: 8px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
              ">+</div>
            ` : ''}
          `,
          className: `route-cluster-icon ${options.routeMode ? 'route-mode-active' : ''}`,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });
      }
    });
    
    // Create markers with enhanced route mode behavior
    const markers: L.Marker[] = [];
    const markersMap = new Map<number, L.Marker>();
    let successfulMarkers = 0;
    
    plaques.forEach(plaque => {
      try {
        if (!plaque.latitude || !plaque.longitude) {
          console.debug(`🗺️ useMarkers: Skipping plaque ${plaque.id} - missing coordinates`);
          return;
        }
        
        // Proper type conversion for coordinates
        const lat = typeof plaque.latitude === 'string' 
          ? parseFloat(plaque.latitude) 
          : plaque.latitude as number;
        const lng = typeof plaque.longitude === 'string' 
          ? parseFloat(plaque.longitude) 
          : plaque.longitude as number;
        
        if (isNaN(lat) || isNaN(lng)) {
          console.debug(`🗺️ useMarkers: Skipping plaque ${plaque.id} - invalid coordinates: ${lat}, ${lng}`);
          return;
        }
        
        // Validate coordinates are in reasonable range for London
        if (lat < 51.2 || lat > 51.7 || lng < -0.5 || lng > 0.3) {
          console.debug(`🗺️ useMarkers: Skipping plaque ${plaque.id} - coordinates outside London area: ${lat}, ${lng}`);
          return;
        }
        
        // Create icon with route mode styling
        const icon = createPlaqueIcon(L, plaque, false, false);
        
        // FIXED: Use proper L.MarkerOptions interface
        const markerOptions: L.MarkerOptions = {
          icon,
          bubblingMouseEvents: false,
          interactive: true,
          keyboard: false,
          zIndexOffset: options.routeMode ? 100 : 0
        };
        
        const marker = L.marker([lat, lng], markerOptions);
        
        // Add custom class to marker element after creation for route mode styling
        if (options.routeMode) {
          marker.on('add', function(this: L.Marker) {
            const element = this.getElement();
            if (element) {
              element.classList.add('route-mode-marker');
              // Apply route mode styling
              const iconDiv = element.querySelector('div > div') as HTMLElement;
              if (iconDiv) {
                iconDiv.style.backgroundColor = '#10b981';
                iconDiv.style.border = '3px solid #059669';
                iconDiv.style.animation = 'route-pulse 2s infinite';
                iconDiv.style.width = '40px';
                iconDiv.style.height = '40px';
                // Update icon to plus sign for route mode
                iconDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>';
              }
            }
          });
        }
        
        // Enhanced click behavior based on mode
        marker.on('click', function(e: L.LeafletMouseEvent) {
          console.log('🗺️ useMarkers: Marker clicked, route mode:', options.routeMode);
          e.originalEvent?.stopPropagation();
          
          if (mobile) {
            triggerHapticFeedback(options.routeMode ? 'success' : 'selection');
          }
          
          if (options.routeMode && options.onAddToRoute) {
            // In route mode, add to route directly
            options.onAddToRoute(plaque);
          
            
            // Don't open popup in route mode
            return;
          }
          
          // Normal mode - open popup
          const popupContent = createPlaquePopup(
            plaque,
            options.onMarkerClick,
            options.routeMode,
            options.onAddToRoute || null
          );
          
          const popupOptions: L.PopupOptions = {
            closeButton: true,
            autoClose: true,
            className: 'plaque-popup-container high-z-popup',
            maxWidth: 300,
            minWidth: 200,
            offset: [0, -20] as L.PointTuple,
            autoPanPadding: [50, 50] as L.PointTuple,
            keepInView: true
          };
          
          marker.bindPopup(popupContent, popupOptions);
          
          // Ensure popup gets the highest z-index when opened
          setTimeout(() => {
            const popupElement = marker.getPopup()?.getElement();
            if (popupElement) {
              popupElement.style.zIndex = '10001';
              const container = popupElement.closest('.leaflet-popup');
              if (container) {
                (container as HTMLElement).style.zIndex = '10001';
              }
            }
          }, 50);
          
          marker.openPopup();
        });
        
        // Enhanced hover effects for route mode
        marker.on('mouseover', function(this: L.Marker) {
          const element = this.getElement();
          if (element) {
            element.classList.add('marker-hover');
            if (options.routeMode) {
              element.style.transform = 'scale(1.1)';
              element.style.filter = 'brightness(1.2)';
            }
          }
        });
        
        marker.on('mouseout', function(this: L.Marker) {
          const element = this.getElement();
          if (element) {
            element.classList.remove('marker-hover');
            if (options.routeMode) {
              element.style.transform = 'scale(1)';
              element.style.filter = 'brightness(1)';
            }
          }
        });
        
        markersMap.set(plaque.id, marker);
        markers.push(marker);
        successfulMarkers++;
        
      } catch (error) {
        console.error(`🗺️ useMarkers: Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    console.log(`🗺️ useMarkers: Successfully created ${successfulMarkers} markers out of ${plaques.length} plaques`);
    
    // Add markers to cluster group
    if (markers.length > 0) {
      try {
        clusterGroup.addLayers(markers);
        
        // Enhanced cluster click behavior for route mode
        if (options.routeMode) {
          clusterGroup.on('clusterclick', function(event: any) {
            const cluster = event.layer;
            const childMarkers = cluster.getAllChildMarkers();
            
            // In route mode, don't auto-zoom, just show a tooltip
            if (childMarkers.length <= 5) {
              // For small clusters, add all to route
              childMarkers.forEach((childMarker: any) => {
                const plaqueData = plaques.find(p => {
                  const markerLatLng = childMarker.getLatLng();
                  const pLat = typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude;
                  const pLng = typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude;
                  
                  // FIXED: Null check for coordinates
                  if (!pLat || !pLng) return false;
                  
                  return Math.abs(markerLatLng.lat - pLat) < 0.0001 && Math.abs(markerLatLng.lng - pLng) < 0.0001;
                });
                
                if (plaqueData && options.onAddToRoute) {
                  options.onAddToRoute(plaqueData);
                }
              });
              
              if (mobile) {
                triggerHapticFeedback('success');
              }
            } else {
              // For larger clusters, zoom in a bit
              const bounds = cluster.getBounds();
              map.fitBounds(bounds, {
                padding: [20, 20],
                maxZoom: 16,
                animate: true,
                duration: 0.5
              });
            }
          });
        }
        
        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup;
        markersRef.current = markersMap;
        
        console.log(`🗺️ useMarkers: Added ${markers.length} markers to map with route mode: ${options.routeMode}`);
      } catch (error) {
        console.error('🗺️ useMarkers: Error adding markers to map:', error);
      }
    } else {
      console.warn('🗺️ useMarkers: No valid markers created');
    }
    
    // Cleanup function
    return () => {
      console.log('🗺️ useMarkers: Cleaning up markers');
      markersRef.current.forEach(marker => {
        try {
          if (map && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        } catch (error) {
          console.warn('Error cleaning up marker:', error);
        }
      });
      markersRef.current.clear();
      
      if (clusterGroupRef.current && map && map.hasLayer(clusterGroupRef.current)) {
        try {
          map.removeLayer(clusterGroupRef.current);
        } catch (error) {
          console.warn('Error cleaning up cluster group:', error);
        }
      }
    };
    
  }, [map, plaques, options.onMarkerClick, options.onAddToRoute, options.routeMode, mobile]);
  
  return {
    getMarker: (plaqueId: number) => markersRef.current.get(plaqueId),
    getAllMarkers: () => Array.from(markersRef.current.values()),
    getClusterGroup: () => clusterGroupRef.current
  };
};

// Export the hook
export { useMarkers };