import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Filter, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';

interface PlaqueMapProps {
  plaques: Plaque[];
  onPlaqueClick?: (plaque: Plaque) => void;
  favorites?: number[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  className?: string;
}

/**
 * A map component to display plaques geographically
 */
const PlaqueMap: React.FC<PlaqueMapProps> = ({
  plaques = [],
  onPlaqueClick,
  favorites = [],
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clusterGroupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapFilterVisible, setMapFilterVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (mapInitialized) return; // Skip if already initialized

    // Add Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const linkLeaflet = document.createElement('link');
      linkLeaflet.rel = 'stylesheet';
      linkLeaflet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(linkLeaflet);
    }

    // Add MarkerCluster CSS
    if (!document.querySelector('link[href*="MarkerCluster.css"]')) {
      const linkCluster = document.createElement('link');
      linkCluster.rel = 'stylesheet';
      linkCluster.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
      document.head.appendChild(linkCluster);
      
      const linkClusterDefault = document.createElement('link');
      linkClusterDefault.rel = 'stylesheet';
      linkClusterDefault.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
      document.head.appendChild(linkClusterDefault);
    }

    // Define initializer function
    const initializeLeaflet = () => {
      try {
        // Check if map is already initialized
        if (mapInstanceRef.current) {
          console.log("Map already initialized, skipping");
          return;
        }
        
        // Load MarkerCluster if needed
        if (!(window as any).L.markerClusterGroup) {
          const clusterScript = document.createElement('script');
          clusterScript.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
          clusterScript.async = true;
          
          clusterScript.onload = () => {
            initializeMap();
          };
          
          clusterScript.onerror = () => {
            setMapError("Failed to load marker cluster plugin");
            // Initialize map anyway without clustering
            initializeMap();
          };
          
          document.head.appendChild(clusterScript);
        } else {
          // MarkerCluster already loaded, initialize map
          initializeMap();
        }
      } catch (error) {
        console.error("Error loading map dependencies:", error);
        setMapError("Error loading map dependencies");
      }
    };

    // Check if Leaflet is already loaded
    if ((window as any).L) {
      initializeLeaflet();
    } else {
      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      
      script.onload = () => {
        initializeLeaflet();
      };
      
      script.onerror = () => {
        setMapError("Failed to load Leaflet map library");
      };
      
      document.head.appendChild(script);
    }

    // Set initialized flag
    setMapInitialized(true);

    return () => {
      // Clean up map instance when component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMapInitialized(false);
    };
  }, []);

  // Initialize the map
  const initializeMap = () => {
    try {
      if (!mapRef.current || !(window as any).L) return;
      
      const L = (window as any).L;
      
      // Verify the map container isn't already initialized
      if (mapInstanceRef.current) {
        console.log("Map already initialized, skipping");
        return;
      }
      
      // Create map instance
      console.log("Creating new map instance");
      const map = L.map(mapRef.current, {
        center: [51.505, -0.09],
        zoom: 12,
        maxZoom: 18
      });
      
      // Add tile layer (map background)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Create marker cluster group if available
      if (L.markerClusterGroup) {
        const clusterGroup = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          iconCreateFunction: function(cluster: any) {
            return L.divIcon({
              html: `<div class="marker-cluster"><div>${cluster.getChildCount()}</div></div>`,
              className: 'custom-cluster',
              iconSize: L.point(40, 40)
            });
          }
        });
        
        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup;
      }
      
      mapInstanceRef.current = map;
      setMapLoaded(true);
      
    } catch (error) {
      console.error("Map initialization error:", error);
      setMapError(`Failed to initialize map: ${error}`);
    }
  };

  // Add markers when plaques data changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    
    try {
      const L = (window as any).L;
      if (!L) return;

      // Clear existing markers
      if (clusterGroupRef.current) {
        clusterGroupRef.current.clearLayers();
      } else {
        markersRef.current.forEach(marker => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(marker);
          }
        });
        markersRef.current = [];
      }
      
      // Filter plaques with valid coordinates
      const validPlaques = plaques.filter(plaque => 
        plaque.latitude && plaque.longitude && 
        !isNaN(parseFloat(plaque.latitude as string)) && !isNaN(parseFloat(plaque.longitude as string))
      );
      
      if (validPlaques.length === 0) return;

      // Create markers for each plaque
      const markers = validPlaques.map(plaque => {
        const lat = parseFloat(plaque.latitude as string);
        const lng = parseFloat(plaque.longitude as string);
        
        // Determine marker color based on plaque color
        let markerColor = 'blue';
        if (plaque.color) {
          const color = plaque.color.toLowerCase();
          if (color === 'blue') markerColor = 'blue';
          else if (color === 'green') markerColor = 'green';
          else if (color === 'brown' || color === 'bronze') markerColor = 'orange';
          else if (color === 'black' || color === 'grey' || color === 'gray') markerColor = 'gray';
          else markerColor = 'blue';
        }
        
        // Create custom icon
        const icon = L.divIcon({
          className: `custom-marker ${selectedMarker === plaque.id ? 'selected-marker' : ''}`,
          html: `
            <div class="bg-white rounded-full p-1 shadow-md ${favorites.includes(plaque.id) ? 'ring-2 ring-amber-500' : ''}">
              <div class="bg-${markerColor}-500 text-white rounded-full w-7 h-7 flex items-center justify-center">
                ${plaque.visited ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : ''}
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        
        // Create marker
        const marker = L.marker([lat, lng], { icon });
        
        // Create a popup with plaque info
        const popupContent = document.createElement('div');
        popupContent.className = 'plaque-popup';
        popupContent.innerHTML = `
          <div class="font-semibold">${plaque.title}</div>
          <div class="text-xs text-gray-600">${plaque.location || plaque.address || ''}</div>
          ${plaque.color ? `<div class="mt-1 text-xs">${plaque.color} Plaque</div>` : ''}
          <button class="view-details mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded w-full">View Details</button>
        `;
        
        // Add click handler to the View Details button
        const detailButton = popupContent.querySelector('.view-details');
        if (detailButton) {
          detailButton.addEventListener('click', () => {
            if (onPlaqueClick) onPlaqueClick(plaque);
          });
        }
        
        marker.bindPopup(popupContent);
        
        // Add click handler for the marker
        marker.on('click', () => {
          setSelectedMarker(plaque.id);
        });
        
        return marker;
      });
      
      // Add markers to map
      if (clusterGroupRef.current) {
        // Add to cluster group if available
        clusterGroupRef.current.addLayers(markers);
      } else {
        // Otherwise add directly to map
        markers.forEach(marker => {
          marker.addTo(mapInstanceRef.current);
        });
      }
      
      markersRef.current = markers;
      
      // Fit bounds to show all markers
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Error adding markers:", error);
    }
  }, [plaques, mapLoaded, favorites, selectedMarker, onPlaqueClick]);

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleCenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([51.505, -0.09], 12);
    }
  };

  const handleFindMyLocation = () => {
    if (mapInstanceRef.current && 'locate' in mapInstanceRef.current) {
      mapInstanceRef.current.locate({setView: true, maxZoom: 16});
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {/* Map container */}
      <div 
        ref={mapRef} 
        id="plaque-map" 
        className="w-full h-[650px]"
        style={{ backgroundColor: '#f0f0f0' }}
      ></div>
      
      {/* Map loading state */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Map error state */}
      {mapError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Map Failed to Load</h3>
            <p className="text-gray-600 mb-4">{mapError}</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Reload Page
            </Button>
          </div>
        </div>
      )}
      
      {/* Map Controls */}
      {mapLoaded && !mapError && (
        <>
          {/* Top right controls */}
          <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-2">
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCenterMap}
                className="h-8 w-8 p-0"
                title="Center map on London"
              >
                <MapPin size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMapFilterVisible(!mapFilterVisible)}
                className="h-8 w-8 p-0"
                title="Toggle filter panel"
              >
                <Filter size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleFindMyLocation}
                className="h-8 w-8 p-0"
                title="Find my location"
              >
                <div className="h-4 w-4 rounded-full border-2 border-current relative">
                  <div className="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-75 h-1 w-1 m-auto"></div>
                </div>
              </Button>
              {(window as any)?.L?.markerClusterGroup && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  title="Clustering options"
                >
                  <Layers size={16} />
                </Button>
              )}
            </div>
          </div>
          
          {/* Search/Filter Panel */}
          <div className={`absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md w-72 transition-all duration-300 transform ${
            mapFilterVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
          }`}>
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Map Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setMapFilterVisible(false)}
                >
                  <span className="sr-only">Close</span>
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search plaques..."
                    className="w-full pl-8 pr-3 py-2 border rounded-md text-sm"
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                  />
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Button 
                    type="submit"
                    variant="default"
                    size="sm"
                    className="w-full mt-2"
                  >
                    Search
                  </Button>
                </div>
              </form>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Quick Filters</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs justify-start"
                      onClick={() => {
                        if (onSearchChange) onSearchChange("author");
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                    >
                      <MapPin size={12} className="mr-1" /> 
                      Authors
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs justify-start"
                      onClick={() => {
                        if (onSearchChange) onSearchChange("composer");
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                    >
                      <MapPin size={12} className="mr-1" /> 
                      Composers
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs justify-start"
                      onClick={() => {
                        if (onSearchChange) onSearchChange("scientist");
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                    >
                      <MapPin size={12} className="mr-1" /> 
                      Scientists
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs justify-start"
                      onClick={() => {
                        if (onSearchChange) onSearchChange("politician");
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                    >
                      <MapPin size={12} className="mr-1" /> 
                      Politicians
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Plaque Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      className="bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200"
                      onClick={() => {
                        if (onSearchChange) onSearchChange("blue");
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                    >
                      Blue
                    </Badge>
                    <Badge 
                      className="bg-green-100 text-green-800 border-green-200 cursor-pointer hover:bg-green-200"
                      onClick={() => {
                        if (onSearchChange) onSearchChange("green");
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                    >
                      Green
                    </Badge>
                    <Badge 
                      className="bg-amber-100 text-amber-800 border-amber-200 cursor-pointer hover:bg-amber-200"
                      onClick={() => {
                        if (onSearchChange) onSearchChange("brown");
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                    >
                      Brown
                    </Badge>
                    <Badge 
                      className="bg-gray-100 text-gray-800 border-gray-200 cursor-pointer hover:bg-gray-200"
                      onClick={() => {
                        if (onSearchChange) onSearchChange("black");
                        if (onSearchSubmit) onSearchSubmit();
                      }}
                    >
                      Black
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md p-3">
            <h4 className="font-medium text-sm mb-2">Legend</h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 w-4 h-4 rounded-full"></div>
                <span className="text-xs">Blue Plaques</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-green-500 w-4 h-4 rounded-full"></div>
                <span className="text-xs">Green Plaques</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-orange-500 w-4 h-4 rounded-full"></div>
                <span className="text-xs">Brown Plaques</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-500 w-4 h-4 rounded-full"></div>
                <span className="text-xs">Black/Grey Plaques</span>
              </div>
            </div>
          </div>
          
          {/* Mobile toggle for filter panel */}
          {!mapFilterVisible && (
            <Button
              variant="default"
              size="sm"
              className="absolute top-20 left-4 z-10 shadow-md md:hidden"
              onClick={() => setMapFilterVisible(true)}
            >
              <Filter size={16} className="mr-1" /> Filters
            </Button>
          )}
          
          {/* Plaque counter */}
          <div className="absolute top-4 right-[5.5rem] z-10 bg-white rounded-full px-3 py-1 shadow-md text-sm font-medium">
            {plaques.length} {plaques.length === 1 ? 'Plaque' : 'Plaques'}
          </div>
        </>
      )}
    </div>
  );
};

export default PlaqueMap;