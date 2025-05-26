// src/components/map/UnifiedMap.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Plaque } from '@/types/plaque';
import { useMapState } from './hooks/useMapState';
import { useMapOperations } from './hooks/useMapOperations';
import UnifiedSearchBar from './UnifiedSearchBar';
import FloatingControls from './FloatingControls';
import PlaqueDetail from '../plaques/PlaqueDetail';
import { toast } from 'sonner';

interface UnifiedMapProps {
  plaques: Plaque[];
  favorites: number[];
  onFavoriteToggle: (plaqueId: number) => void;
  onMarkVisited: (plaqueId: number) => void;
  isPlaqueVisited: (plaqueId: number) => boolean;
  className?: string;
}

const UnifiedMap: React.FC<UnifiedMapProps> = ({
  plaques,
  favorites,
  onFavoriteToggle,
  onMarkVisited,
  isPlaqueVisited,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  // Unified state management
  const {
    state,
    actions: {
      setCenter,
      setZoom,
      setSearch,
      selectPlaque,
      clearSelection,
      setDistanceFilter,
      clearDistanceFilter,
      toggleRouteMode,
      addToRoute,
      removeFromRoute,
      clearRoute,
      setMapStyle
    },
    getVisiblePlaques,
    searchPlaques,
    getRouteStats
  } = useMapState(plaques);

  // Map operations (location search, filtering, etc.)
  const {
    isLoadingLocation,
    searchLocation,
    findUserLocation
  } = useMapOperations(mapInstanceRef.current, plaques, state);

  // Initialize Leaflet map (similar to your existing approach)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      // Load Leaflet and clustering libraries
      const L = (window as any).L;
      if (!L) {
        await loadLeafletLibraries();
      }

      const map = L.map(mapContainerRef.current, {
        center: state.center,
        zoom: state.zoom,
        zoomControl: false, // We'll add custom controls
        attributionControl: true,
        preferCanvas: true // Better performance for many markers
      });

      // Add base layer
      const tileLayer = getTileLayer(state.mapStyle);
      tileLayer.addTo(map);

      // Update state when map moves
      map.on('moveend', () => {
        setCenter([map.getCenter().lat, map.getCenter().lng]);
        setZoom(map.getZoom());
      });

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map style when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    // Remove existing tile layers
    map.eachLayer((layer: any) => {
      if (layer._url) { // This is a tile layer
        map.removeLayer(layer);
      }
    });

    // Add new tile layer
    const tileLayer = getTileLayer(state.mapStyle);
    tileLayer.addTo(map);
  }, [state.mapStyle]);

  // Marker cluster group ref
  const clusterGroupRef = useRef<any>(null);

  // Initialize marker clustering (similar to your existing approach)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    
    const map = mapInstanceRef.current;
    const L = window.L;

    // Create cluster group if not exists
    if (!clusterGroupRef.current) {
      // Use simple clustering like your existing code
      if (L.markerClusterGroup) {
        clusterGroupRef.current = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          disableClusteringAtZoom: 18,
          maxClusterRadius: 50,
          animate: true,
          animateAddingMarkers: true,
          spiderfyDistanceMultiplier: 1.5,
          
          // Simple cluster icon like your existing code (fixed HTML string)
          iconCreateFunction: function(cluster: any) {
            const count = cluster.getChildCount();
            let size = 40;
            
            // Adjust size based on count (like your existing code)
            if (count > 50) size = 60;
            else if (count > 20) size = 50;
            else if (count < 5) size = 36;
            
            return L.divIcon({
              html: `<div style="
                width: ${size}px;
                height: ${size}px;
                background-color: white;
                border: 2px solid #3b82f6;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                font-weight: bold;
                font-size: 14px;
                color: #3b82f6;
              ">${count}</div>`,
              className: 'marker-cluster-custom',
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            });
          }
        });
      } else {
        // Fallback to regular layer group if clustering not available
        console.warn('MarkerClusterGroup plugin not available');
        clusterGroupRef.current = L.layerGroup();
      }
      
      map.addLayer(clusterGroupRef.current);
    }
  }, [mapInstanceRef.current]);

  // Render plaque markers with clustering (similar to your existing approach)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !clusterGroupRef.current) return;

    const map = mapInstanceRef.current;
    const L = window.L;
    const clusterGroup = clusterGroupRef.current;

    // Clear existing markers from cluster group
    clusterGroup.clearLayers();

    // Get plaques to display
    const visiblePlaques = getVisiblePlaques();
    
    console.log(`Rendering ${visiblePlaques.length} plaques on map`);

    // Add markers to cluster group (like your existing code)
    visiblePlaques.forEach(plaque => {
      if (!plaque.latitude || !plaque.longitude) return;

      const lat = parseFloat(plaque.latitude as string);
      const lng = parseFloat(plaque.longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) return;

      try {
        const isSelected = state.selectedPlaque?.id === plaque.id;
        const isFavorite = favorites.includes(plaque.id);
        const isVisited = isPlaqueVisited(plaque.id);
        const isInRoute = state.routePoints.some(p => p.id === plaque.id);

        const marker = L.marker([lat, lng], {
          icon: createPlaqueIcon(plaque, {
            isSelected,
            isFavorite,
            isVisited,
            isInRoute,
            routeMode: state.routeMode
          }),
          bubblingMouseEvents: false,
          interactive: true,
          keyboard: false,
          zIndexOffset: isSelected ? 1000 : 0
        });

        // Add click handler - directly open PlaqueDetail
        marker.on('click', function(e: any) {
          // Stop propagation to prevent map click
          if (e.originalEvent) {
            L.DomEvent.stopPropagation(e.originalEvent);
          }
          
          // Directly open the existing PlaqueDetail component
          selectPlaque(plaque);
        });

        // Add to cluster group
        clusterGroup.addLayer(marker);
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });

    // Draw distance circle if active (add to map directly, not cluster group)
    if (state.activeLocation && state.distanceFilter) {
      drawDistanceCircle(map, state.activeLocation, state.distanceFilter);
    }

  }, [plaques.length, state.selectedPlaque?.id, state.routeMode, state.routePoints.length, state.activeLocation, state.distanceFilter, favorites.length]); // Fixed dependencies to prevent render loop

  // Cleanup cluster group on unmount
  useEffect(() => {
    return () => {
      if (clusterGroupRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, []);

  // Handle route toggle for plaques
  const handleRouteToggle = useCallback((plaque: Plaque) => {
    const isInRoute = state.routePoints.some(p => p.id === plaque.id);
    
    if (isInRoute) {
      removeFromRoute(plaque.id);
      toast.info(`Removed "${plaque.title}" from route`);
    } else {
      addToRoute(plaque);
      const newLength = state.routePoints.length + 1;
      if (newLength === 1) {
        toast.success(`Added "${plaque.title}" as starting point`);
      } else {
        toast.success(`Added "${plaque.title}" (${newLength} stops)`);
      }
    }
  }, [state.routePoints, addToRoute, removeFromRoute]);

  // Handle search results
  const handleSearchSelect = useCallback(async (result: any) => {
    if (result.type === 'location' && result.coordinates) {
      setCenter(result.coordinates);
      setZoom(15);
      
      // Auto-enable distance filter for location searches
      setTimeout(() => {
        setDistanceFilter(result.coordinates, 1); // 1km default
        toast.success("Location found! Showing nearby plaques within 1km");
      }, 500);
    } else if (result.type === 'plaque') {
      selectPlaque(result.data);
      if (result.data.latitude && result.data.longitude) {
        setCenter([parseFloat(result.data.latitude), parseFloat(result.data.longitude)]);
        setZoom(16);
      }
    }
  }, [setCenter, setZoom, setDistanceFilter, selectPlaque]);

  // Get nearby plaques for details panel
  const getNearbyPlaques = useCallback((currentPlaque: Plaque) => {
    return plaques.filter(p => 
      p.id !== currentPlaque.id && 
      (p.postcode === currentPlaque.postcode || p.profession === currentPlaque.profession)
    ).slice(0, 3);
  }, [plaques]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapContainerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {/* Unified Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-[1000]">
        <UnifiedSearchBar
          query={state.searchQuery}
          onQueryChange={setSearch}
          onResultSelect={handleSearchSelect}
          plaques={plaques}
          activeLocation={state.activeLocation}
          isLoading={isLoadingLocation}
        />
      </div>

      {/* Floating Controls */}
      <FloatingControls
        mapStyle={state.mapStyle}
        onMapStyleChange={setMapStyle}
        onFindLocation={findUserLocation}
        isLoadingLocation={isLoadingLocation}
        routeMode={state.routeMode}
        onToggleRouteMode={toggleRouteMode}
        routePointsCount={state.routePoints.length}
        onClearRoute={clearRoute}
        distanceFilter={state.distanceFilter}
        onDistanceFilterChange={(distance) => {
          if (state.activeLocation) {
            setDistanceFilter(state.activeLocation, distance);
          }
        }}
        onClearDistanceFilter={clearDistanceFilter}
      />

      {/* Route Info Panel (when in route mode) */}
      {state.routeMode && state.routePoints.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-[999]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Walking Route</h3>
            <button
              onClick={() => toggleRouteMode()}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            {state.routePoints.length} stops • {calculateRouteDistance(state.routePoints).toFixed(1)}km
          </div>
          
          <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
            {state.routePoints.map((point, index) => (
              <div key={point.id} className="flex items-center text-xs">
                <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                  {index + 1}
                </span>
                <span className="truncate">{point.title}</span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={clearRoute}
              className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={() => exportRouteAsGPX(state.routePoints)}
              className="flex-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export
            </button>
          </div>
        </div>
      )}

{/* Plaque Details Modal - Using existing PlaqueDetail component */}
{state.selectedPlaque && (
  <PlaqueDetail
    plaque={state.selectedPlaque}
    isOpen={true}
    onClose={clearSelection}
    isFavorite={favorites.includes(state.selectedPlaque.id)}
    onFavoriteToggle={() => onFavoriteToggle(state.selectedPlaque!.id)}
    onMarkVisited={() => onMarkVisited(state.selectedPlaque!.id)}
    nearbyPlaques={getNearbyPlaques(state.selectedPlaque)}
    onSelectNearbyPlaque={selectPlaque}
    className="z-[1003]"
    // Fixed: Separate the conditional props
    showAddToRoute={state.routeMode}
    isInRoute={state.routeMode ? state.routePoints.some(p => p.id === state.selectedPlaque!.id) : false}
    onAddToRoute={state.routeMode ? () => handleRouteToggle(state.selectedPlaque!) : undefined}
  />
)}
      {/* Status Info */}
      {state.distanceFilter && state.activeLocation && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          {getFilteredPlaques().length} plaques within {state.distanceFilter}km
        </div>
      )}
    </div>
  );
};

// Helper functions
const getTileLayer = (style: string) => {
  const L = (window as any).L;
  
  switch (style) {
    case 'satellite':
      return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
      });
    case 'terrain':
      return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap'
      });
    default:
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });
  }
};

const createPlaqueIcon = (plaque: Plaque, options: any) => {
  const L = (window as any).L;
  
  const getColorForPlaque = (plaque: Plaque) => {
    const colorMap: Record<string, string> = {
      'blue': '#3b82f6',
      'green': '#10b981', 
      'brown': '#b45309',
      'black': '#1f2937',
      'grey': '#4b5563',
      'gray': '#4b5563'
    };
    return colorMap[plaque.color?.toLowerCase() || 'blue'] || '#3b82f6';
  };

  const color = getColorForPlaque(plaque);
  const size = options.isSelected && !options.routeMode ? 40 : 32;
  
  return L.divIcon({
    className: 'custom-plaque-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${options.isFavorite ? 'box-shadow: 0 0 0 2px #f59e0b;' : ''}
        ${options.isInRoute ? 'border-color: #10b981; border-width: 4px;' : ''}
      ">
        <svg width="16" height="16" fill="white">
          ${options.isVisited ? 
            '<path d="M9 12l2 2 4-4M7.5 3v6l-3-3"/>' : 
            '<circle cx="8" cy="8" r="3"/>'
          }
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

const drawDistanceCircle = (map: any, center: [number, number], radius: number) => {
  const L = (window as any).L;
  
  // Remove existing circles
  map.eachLayer((layer: any) => {
    if (layer instanceof L.Circle && layer.options.className === 'distance-circle') {
      map.removeLayer(layer);
    }
  });
  
  // Add new circle
  L.circle(center, {
    radius: radius * 1000, // Convert km to meters
    fillColor: '#10b981',
    fillOpacity: 0.1,
    color: '#10b981',
    weight: 2,
    opacity: 0.8,
    className: 'distance-circle'
  }).addTo(map);
};

const calculateRouteDistance = (points: Plaque[]): number => {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    if (start.latitude && start.longitude && end.latitude && end.longitude) {
      const startLat = parseFloat(start.latitude as string);
      const startLng = parseFloat(start.longitude as string);
      const endLat = parseFloat(end.latitude as string);
      const endLng = parseFloat(end.longitude as string);
      
      if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
        total += haversineDistance(startLat, startLng, endLat, endLng);
      }
    }
  }
  return total;
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const exportRouteAsGPX = (routePoints: Plaque[]) => {
  const waypoints = routePoints.map((point, index) => `
    <wpt lat="${point.latitude}" lon="${point.longitude}">
      <name>${point.title || `Stop ${index + 1}`}</name>
    </wpt>`).join('');
  
  const gpxContent = `<?xml version="1.0"?>
<gpx version="1.1" creator="Plaquer App">
  <metadata>
    <name>Walking Route</name>
    <desc>Route with ${routePoints.length} stops</desc>
  </metadata>
  ${waypoints}
</gpx>`;
  
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `route-${Date.now()}.gpx`;
  link.click();
  URL.revokeObjectURL(url);
};

const loadLeafletLibraries = async (): Promise<void> => {
  // Skip if already loaded
  if (window.L) return Promise.resolve();

  try {
    // Load CSS files first
    await Promise.all([
      loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'),
      loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'),
      loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css')
    ]);
    
    // Load JavaScript libraries
    await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    
    // Load clustering plugin after Leaflet
    await loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js');
    
    console.log('Leaflet and clustering libraries loaded successfully');
  } catch (error) {
    console.error('Error loading Leaflet libraries:', error);
    throw error;
  }
};

// Helper to load CSS
const loadCSS = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`link[href="${url}"]`)) {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
    
    document.head.appendChild(link);
  });
};

// Helper to load JavaScript
const loadScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    
    document.head.appendChild(script);
  });
};

export default UnifiedMap;