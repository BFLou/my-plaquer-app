// src/components/maps/core/useMarkers.ts - UPDATED: Higher z-index for popups
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Plaque } from '@/types/plaque';
import { createPlaqueIcon, createPlaquePopup } from '../utils/markerUtils';

interface MarkerOptions {
  onMarkerClick: (plaque: Plaque) => void;
  onAddToRoute?: (plaque: Plaque) => void;
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
    console.log(
      '🗺️ useMarkers: Starting with',
      plaques.length,
      'plaques, route mode:',
      options.routeMode
    );

    if (!map) {
      console.log('🗺️ useMarkers: No map available');
      return;
    }

    // Clear existing markers and clusters
    markersRef.current.forEach((marker) => {
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

    // Create cluster group with enhanced styling
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: false,
      disableClusteringAtZoom: 18,

      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let size = 36;
        let fontSize = '12px';

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
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    // Create markers
    const markers: L.Marker[] = [];
    const markersMap = new Map<number, L.Marker>();
    let successfulMarkers = 0;

    plaques.forEach((plaque) => {
      try {
        if (!plaque.latitude || !plaque.longitude) {
          console.debug(
            `🗺️ useMarkers: Skipping plaque ${plaque.id} - missing coordinates`
          );
          return;
        }

        // Proper type conversion for coordinates
        const lat =
          typeof plaque.latitude === 'string'
            ? parseFloat(plaque.latitude)
            : (plaque.latitude as number);
        const lng =
          typeof plaque.longitude === 'string'
            ? parseFloat(plaque.longitude)
            : (plaque.longitude as number);

        if (isNaN(lat) || isNaN(lng)) {
          console.debug(
            `🗺️ useMarkers: Skipping plaque ${plaque.id} - invalid coordinates: ${lat}, ${lng}`
          );
          return;
        }

        // Validate coordinates are in reasonable range for London
        if (lat < 51.2 || lat > 51.7 || lng < -0.5 || lng > 0.3) {
          console.debug(
            `🗺️ useMarkers: Skipping plaque ${plaque.id} - coordinates outside London area: ${lat}, ${lng}`
          );
          return;
        }

        const icon = createPlaqueIcon(L, plaque, false, false);
        const marker = L.marker([lat, lng], {
          icon,
          bubblingMouseEvents: false,
          interactive: true,
          keyboard: false,
          zIndexOffset: 0,
        });

        // Create popup with BOTH handlers and HIGH Z-INDEX
        const popupContent = createPlaquePopup(
          plaque,
          options.onMarkerClick,
          options.routeMode,
          options.onAddToRoute || null
        );

        // CRITICAL: Set high z-index for popups to appear above controls
        const popupOptions: L.PopupOptions = {
          closeButton: true,
          autoClose: true,
          className: 'plaque-popup-container high-z-popup',
          maxWidth: 300,
          minWidth: 200,
          offset: [0, -20] as L.PointTuple,
          autoPanPadding: [50, 50] as L.PointTuple,
          keepInView: true,
        };

        marker.bindPopup(popupContent, popupOptions);

        // Only open popup on click, don't auto-trigger any actions
        marker.on('click', function (e: any) {
          console.log(
            '🗺️ useMarkers: Marker clicked, opening popup for:',
            plaque.title
          );
          e.originalEvent?.stopPropagation();

          // CRITICAL: Ensure popup gets the highest z-index when opened
          setTimeout(() => {
            const popupElement = marker.getPopup()?.getElement();
            if (popupElement) {
              popupElement.style.zIndex = '10001';
              // Also set z-index on parent container
              const container = popupElement.closest('.leaflet-popup');
              if (container) {
                (container as HTMLElement).style.zIndex = '10001';
              }
            }
          }, 50);

          marker.openPopup();
        });

        // Add hover effects for better UX
        marker.on('mouseover', function (this: L.Marker) {
          this.getElement()?.classList.add('marker-hover');
        });

        marker.on('mouseout', function (this: L.Marker) {
          this.getElement()?.classList.remove('marker-hover');
        });

        markersMap.set(plaque.id, marker);
        markers.push(marker);
        successfulMarkers++;
      } catch (error) {
        console.error(
          `🗺️ useMarkers: Error creating marker for plaque ${plaque.id}:`,
          error
        );
      }
    });

    console.log(
      `🗺️ useMarkers: Successfully created ${successfulMarkers} markers out of ${plaques.length} plaques`
    );

    // Add markers to cluster group
    if (markers.length > 0) {
      try {
        clusterGroup.addLayers(markers);
        map.addLayer(clusterGroup);

        clusterGroupRef.current = clusterGroup;
        markersRef.current = markersMap;

        console.log(
          `🗺️ useMarkers: Added ${markers.length} markers to map with route mode: ${options.routeMode}`
        );
      } catch (error) {
        console.error('🗺️ useMarkers: Error adding markers to map:', error);
      }
    } else {
      console.warn('🗺️ useMarkers: No valid markers created');
    }

    // Cleanup function
    return () => {
      console.log('🗺️ useMarkers: Cleaning up markers');
      markersRef.current.forEach((marker) => {
        try {
          if (map && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        } catch (error) {
          console.warn('Error cleaning up marker:', error);
        }
      });
      markersRef.current.clear();

      if (
        clusterGroupRef.current &&
        map &&
        map.hasLayer(clusterGroupRef.current)
      ) {
        try {
          map.removeLayer(clusterGroupRef.current);
        } catch (error) {
          console.warn('Error cleaning up cluster group:', error);
        }
      }
    };
  }, [
    map,
    plaques,
    options.onMarkerClick,
    options.onAddToRoute,
    options.routeMode,
  ]);

  return {
    getMarker: (plaqueId: number) => markersRef.current.get(plaqueId),
    getAllMarkers: () => Array.from(markersRef.current.values()),
    getClusterGroup: () => clusterGroupRef.current,
  };
};
