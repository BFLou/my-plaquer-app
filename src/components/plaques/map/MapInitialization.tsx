// src/components/plaques/map/MapInitialization.tsx
import { Plaque } from '@/types/plaque';
import { createPlaqueIcon, createPopupContent } from './PlaqueMarkerUtils';

/**
 * Initialize the map with all required libraries and settings
 */
export const initializeMap = (
  mapRef: HTMLDivElement,
  handlePlaqueClickStable: (plaque: Plaque) => void,
  addPlaqueToRoute: (plaque: Plaque) => void,
  isRoutingMode: boolean
) => {
  if (!window.L) {
    loadMapLibraries(mapRef, handlePlaqueClickStable, addPlaqueToRoute, isRoutingMode);
    return null;
  }
  
  const L = window.L;
  
  // Create the map
  const map = L.map(mapRef, {
    center: [51.505, -0.09], // London coordinates
    zoom: 13,
    maxZoom: 18,
    minZoom: 10
  });
  
  // Track zoom and pan events
  map.on('zoomstart', () => {
    map._isManuallyZooming = true;
  });
  
  map.on('zoomend', () => {
    setTimeout(() => {
      map._isManuallyZooming = false;
    }, 100); // Small delay to prevent conflict with other operations
  });
  
  map.on('moveend', () => {
    // Save the current view state
    map._lastViewState = {
      center: [map.getCenter().lat, map.getCenter().lng],
      zoom: map.getZoom()
    };
  });
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Initialize marker cluster group
  let cluster = createClusterGroup(L);
  map.addLayer(cluster);
  
  // Add zoom control to bottom right
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);
  
  // Add scale control
  L.control.scale({
    imperial: false,
    position: 'bottomleft'
  }).addTo(map);
  
  return {
    map,
    cluster
  };
};

/**
 * Load all required map libraries dynamically
 */
const loadMapLibraries = (
  mapRef: HTMLDivElement, 
  handlePlaqueClickStable: (plaque: Plaque) => void,
  addPlaqueToRoute: (plaque: Plaque) => void,
  isRoutingMode: boolean
) => {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.async = true;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  
  document.head.appendChild(link);
  document.head.appendChild(script);
  
  script.onload = () => {
    initializeMap(mapRef, handlePlaqueClickStable, addPlaqueToRoute, isRoutingMode);
  };
  
  return () => {
    document.head.removeChild(link);
    document.head.removeChild(script);
  };
};

/**
 * Create a cluster group for marker clustering
 */
export const createClusterGroup = (L: any) => {
  // Check if MarkerClusterGroup plugin is available
  if (!L.markerClusterGroup) {
    loadClusterPlugin();
    return null;
  }
  
  return L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      // Determine size based on number of markers
      let size = 40;
      if (count > 50) size = 60;
      else if (count > 20) size = 50;
      
      return L.divIcon({
        html: `
          <div class="flex items-center justify-center bg-white rounded-full p-1 shadow-md">
            <div class="bg-blue-500 text-white rounded-full w-full h-full flex items-center justify-center font-semibold">
              ${count}
            </div>
          </div>
        `,
        className: 'custom-cluster',
        iconSize: L.point(size, size),
        iconAnchor: L.point(size/2, size/2)
      });
    }
  });
};

/**
 * Load the clustering plugin
 */
const loadClusterPlugin = () => {
  // Load MarkerClusterGroup plugin
  const clusterScript = document.createElement('script');
  clusterScript.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
  
  const clusterCss = document.createElement('link');
  clusterCss.rel = 'stylesheet';
  clusterCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
  
  const clusterDefaultCss = document.createElement('link');
  clusterDefaultCss.rel = 'stylesheet';
  clusterDefaultCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
  
  document.head.appendChild(clusterCss);
  document.head.appendChild(clusterDefaultCss);
  document.head.appendChild(clusterScript);
  
  return () => {
    document.head.removeChild(clusterCss);
    document.head.removeChild(clusterDefaultCss);
    document.head.removeChild(clusterScript);
  };
};

/**
 * Load the routing plugin
 */
export const loadRoutingPlugin = () => {
  if (!window.L || window.L.Routing) return null;
  
  const routingScript = document.createElement('script');
  routingScript.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
  
  const routingCss = document.createElement('link');
  routingCss.rel = 'stylesheet';
  routingCss.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
  
  document.head.appendChild(routingCss);
  document.head.appendChild(routingScript);
  
  return () => {
    document.head.removeChild(routingCss);
    document.head.removeChild(routingScript);
  };
};

/**
 * Add markers to the map for the given plaques
 */
export const addMarkersToMap = (
  L: any,
  plaques: Plaque[], 
  cluster: any, 
  map: any, 
  favorites: number[], 
  selectedPlaqueId: number | null, 
  handlePlaqueClickStable: (plaque: Plaque) => void,
  addPlaqueToRoute: (plaque: Plaque) => void,
  isRoutingMode: boolean
) => {
  if (!L) return new Map();
  
  const newMarkersMap = new Map();
  
  // Clear existing markers if any
  if (cluster) {
    cluster.clearLayers();
  }
  
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
      
      // Add popup
      marker.bindPopup(createPopupContent(plaque, handlePlaqueClickStable, isRoutingMode, addPlaqueToRoute));
      
      // Add click handler
      marker.on('click', () => {
        marker.openPopup();
      });
      
      // Store marker reference
      newMarkersMap.set(plaque.id, marker);
      
      // Add to cluster group
      if (cluster) {
        cluster.addLayer(marker);
      } else {
        marker.addTo(map);
      }
    } catch (error) {
      console.error(`Error creating marker for plaque ${plaque.id}:`, error);
    }
  });
  
  // If we have markers and no previous view state, fit bounds
  if (newMarkersMap.size > 0 && !map._lastViewState) {
    const bounds = L.latLngBounds(
      Array.from(newMarkersMap.values()).map(marker => marker.getLatLng())
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }
  
  return newMarkersMap;
};