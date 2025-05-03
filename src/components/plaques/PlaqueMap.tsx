import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Filter, Layers, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plaque } from '@/types/plaque';

// Load Leaflet and MarkerCluster dynamically
declare global {
  interface Window {
    L: any;
  }
}

interface PlaqueMapProps {
  plaques: Plaque[];
  onPlaqueClick?: (plaque: Plaque) => void;
  favorites?: number[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  className?: string;
}

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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Leaflet scripts
  useEffect(() => {
    if (window.L) {
      setIsScriptLoaded(true);
      return;
    }

    // Create and load Leaflet CSS
    const linkLeaflet = document.createElement('link');
    linkLeaflet.rel = 'stylesheet';
    linkLeaflet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkLeaflet);

    // Create and load MarkerCluster CSS
    const linkCluster = document.createElement('link');
    linkCluster.rel = 'stylesheet';
    linkCluster.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    document.head.appendChild(linkCluster);

    const linkClusterDefault = document.createElement('link');
    linkClusterDefault.rel = 'stylesheet';
    linkClusterDefault.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    document.head.appendChild(linkClusterDefault);

    // Load Leaflet JS
    const scriptLeaflet = document.createElement('script');
    scriptLeaflet.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    scriptLeaflet.async = true;
    scriptLeaflet.onload = () => {
      // Load MarkerCluster JS after Leaflet is loaded
      const scriptCluster = document.createElement('script');
      scriptCluster.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      scriptCluster.async = true;
      scriptCluster.onload = () => {
        setIsScriptLoaded(true);
      };
      document.head.appendChild(scriptCluster);
    };
    document.head.appendChild(scriptLeaflet);

    // Add some critical inline styles for the map
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-container {
        width: 100%;
        height: 100%;
      }
      .custom-marker {
        transition: transform 0.2s;
      }
      .custom-marker:hover {
        transform: scale(1.2);
        z-index: 1000 !important;
      }
      .selected-marker {
        transform: scale(1.2);
        z-index: 1000 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup if component unmounts
      document.head.removeChild(linkLeaflet);
      document.head.removeChild(linkCluster);
      document.head.removeChild(linkClusterDefault);
      document.head.removeChild(scriptLeaflet);
      if (document.querySelector('script[src*="leaflet.markercluster.js"]')) {
        document.head.removeChild(document.querySelector('script[src*="leaflet.markercluster.js"]')!);
      }
      document.head.removeChild(style);
    };
  }, []);

  // Initialize map once scripts are loaded
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      console.log("Initializing map");
      // Initialize the map
      const map = window.L.map(mapRef.current, {
        center: [51.505, -0.09], // London coordinates
        zoom: 13,
        maxZoom: 18,
        minZoom: 8,
      });

      // Add tile layer (map background)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Create marker cluster group if available
      if (window.L.markerClusterGroup) {
        const clusterGroup = window.L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          iconCreateFunction: function(cluster: any) {
            return window.L.divIcon({
              html: `<div class="marker-cluster"><div>${cluster.getChildCount()}</div></div>`,
              className: 'custom-cluster',
              iconSize: window.L.point(40, 40)
            });
          }
        });
        
        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup;
      }

      // Add scale control
      window.L.control.scale({
        imperial: false,
        position: 'bottomright'
      }).addTo(map);

      // Store map instance
      mapInstanceRef.current = map;
      setMapLoaded(true);
      
    } catch (error) {
      console.error("Map initialization error:", error);
      setMapError(`Failed to initialize map: ${error}`);
    }
  }, [isScriptLoaded]);

  // Add markers when plaques data changes and map is loaded
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    
    try {
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
        try {
          const lat = parseFloat(plaque.latitude as string);
          const lng = parseFloat(plaque.longitude as string);
          
          // Create marker
          const marker = window.L.marker([lat, lng], { 
            icon: window.L.divIcon({
              className: `custom-marker ${selectedMarker === plaque.id ? 'selected-marker' : ''}`,
              html: `
                <div class="bg-white rounded-full p-1 shadow-md ${favorites.includes(plaque.id) ? 'ring-2 ring-amber-500' : ''}">
                  <div class="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center">
                    ${plaque.visited ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'}
                  </div>
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })
          });
          
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
            
            // Highlight the selected marker with a pulse animation
            const markerElement = marker.getElement();
            if (markerElement) {
              markerElement.classList.add('selected-marker');
              // Remove the class after animation completes
              setTimeout(() => {
                markerElement.classList.remove('selected-marker');
              }, 1500);
            }
          });
          
          return marker;
        } catch (error) {
          console.error(`Error creating marker for plaque ${plaque.id}:`, error);
          return null;
        }
      }).filter(Boolean);
      
      // Add markers to map
      if (clusterGroupRef.current && markers.length > 0) {
        // Add to cluster group if available
        clusterGroupRef.current.addLayers(markers);
      } else if (markers.length > 0) {
        // Otherwise add directly to map
        markers.forEach(marker => {
          marker.addTo(mapInstanceRef.current);
        });
      }
      
      markersRef.current = markers;
      
      // Fit bounds to show all markers
      if (markers.length > 0) {
        const group = window.L.featureGroup(markers);
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
      // Center on London
      mapInstanceRef.current.setView([51.505, -0.09], 13);
    }
  };

  const handleFindMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapInstanceRef.current) {
            const { latitude, longitude } = position.coords;
            mapInstanceRef.current.setView([latitude, longitude], 16);
            
            // Add a temporary marker at the user's location
            const userMarker = window.L.circleMarker([latitude, longitude], {
              radius: 8,
              color: '#4299e1',
              fillColor: '#3182ce',
              fillOpacity: 0.8,
              weight: 2
            }).addTo(mapInstanceRef.current);
            
            // Add a pulsing effect
            const pulseMarker = window.L.circleMarker([latitude, longitude], {
              radius: 16,
              color: '#4299e1',
              fillColor: '#3182ce',
              fillOpacity: 0.3,
              weight: 1
            }).addTo(mapInstanceRef.current);
            
            // Remove the markers after 5 seconds
            setTimeout(() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(userMarker);
                mapInstanceRef.current.removeLayer(pulseMarker);
              }
            }, 5000);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Please enable location services to use this feature");
        },
        {
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 0
        }
      );
    } else {
      alert("Your browser doesn't support geolocation");
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {/* Map container with fixed height */}
      <div 
        ref={mapRef} 
        id="plaque-map" 
        className="w-full h-[650px]"
        style={{ backgroundColor: '#f0f0f0' }}
      ></div>
      
      {/* Map loading state */}
      {(!mapLoaded && !mapError) && (
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
                className={`h-8 w-8 p-0 ${mapFilterVisible ? 'bg-blue-50 text-blue-600' : ''}`}
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
              {window.L?.markerClusterGroup && (
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
                  <X size={16} />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search plaques..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm"
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
                <div className="bg-amber-500 w-4 h-4 rounded-full"></div>
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