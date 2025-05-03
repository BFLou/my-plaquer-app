import React, { useEffect, useRef, useState } from "react";
import { Search, Badge } from 'lucide-react';
import { Plaque } from "@/types/plaque";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";

// Import our new components
import useMapInitialization from './map/useMapInitialization';
import createPlaqueMarker from './map/PlaqueMarker';
import MapControlPanel from './map/MapControlPanel';
import MapFilterPanel from './map/MapFilterPanel';
import createPlaquePopupContent from './map/PlaquePopup';

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
  const markersRef = useRef<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [mapFilterVisible, setMapFilterVisible] = useState(false);
  const [routePlaques, setRoutePlaques] = useState<Plaque[]>([]);
  
  // Use our custom hook for map initialization
  const { 
    mapLoaded, 
    mapError, 
    mapInstance, 
    clusterGroup, 
    routeLine,
    isScriptLoaded
  } = useMapInitialization(mapRef);

  // Add markers when plaques data changes and map is loaded
  useEffect(() => {
    if (!mapLoaded || !mapInstance) return;
    
    try {
      // Clear existing markers
      if (clusterGroup) {
        clusterGroup.clearLayers();
      } else {
        markersRef.current.forEach(marker => {
          if (mapInstance) {
            mapInstance.removeLayer(marker);
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

      // Create markers for each plaque using our utility function
      const markers = validPlaques.map((plaque, index) => {
        const marker = createPlaqueMarker(plaque, { 
          L: window.L, 
          onMarkerClick: () => handlePlaqueClick(plaque),
          favorites,
          selectedMarkerId: selectedMarker
        });
        
        if (!marker) return null;
        
        // Create popup with our utility function
        const popupContent = createPlaquePopupContent(plaque, {
          onViewDetails: () => {
            if (onPlaqueClick) onPlaqueClick(plaque);
            marker.closePopup();
          },
          onAddToRoute: () => handleAddToRoute(plaque),
          isFavorite: favorites.includes(plaque.id)
        });
        
        // Create popup with specified options
        const popup = window.L.popup({
          closeButton: true,
          autoClose: true,
          className: 'plaque-popup-container'
        }).setContent(popupContent);
        
        // Bind popup to marker
        marker.bindPopup(popup);
        
        return marker;
      }).filter(Boolean);
      
      // Add markers to map
      if (clusterGroup && markers.length > 0) {
        // Add to cluster group if available
        clusterGroup.addLayers(markers);
      } else if (markers.length > 0) {
        // Otherwise add directly to map
        markers.forEach(marker => {
          marker.addTo(mapInstance);
        });
      }
      
      markersRef.current = markers;
      
      // Fit bounds to show all markers
      if (markers.length > 0) {
        const group = window.L.featureGroup(markers);
        mapInstance.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Error adding markers:", error);
    }
  }, [plaques, mapLoaded, favorites, selectedMarker, mapInstance, clusterGroup]);

  // Handle plaque click
  const handlePlaqueClick = (plaque: Plaque) => {
    setSelectedMarker(plaque.id);
    if (onPlaqueClick) onPlaqueClick(plaque);
  };
  
  // Handle adding a plaque to the route
  const handleAddToRoute = (plaque: Plaque) => {
    setRoutePlaques(prev => {
      // Check if already in route
      if (prev.some(p => p.id === plaque.id)) {
        return prev; // Already in route
      }
      return [...prev, plaque]; // Add to route
    });
    
    // Show confirmation
    if (mapInstance) {
      const lat = parseFloat(plaque.latitude as string);
      const lng = parseFloat(plaque.longitude as string);
      
      window.L.popup()
        .setLatLng([lat, lng])
        .setContent(`<div class="text-xs font-medium text-green-600">Added to route! (${routePlaques.length + 1} points)</div>`)
        .openOn(mapInstance);
      
      setTimeout(() => {
        mapInstance.closePopup();
      }, 1500);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  // Map control handlers
  const handleCenterMap = () => {
    if (mapInstance) {
      // Center on London
      mapInstance.setView([51.505, -0.09], 13);
    }
  };

  const handleFindMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapInstance) {
            const { latitude, longitude } = position.coords;
            mapInstance.setView([latitude, longitude], 16);
            
            // Add a temporary marker at the user's location
            const userMarker = window.L.circleMarker([latitude, longitude], {
              radius: 8,
              color: '#4299e1',
              fillColor: '#3182ce',
              fillOpacity: 0.8,
              weight: 2
            }).addTo(mapInstance);
            
            // Add a pulsing effect
            const pulseMarker = window.L.circleMarker([latitude, longitude], {
              radius: 16,
              color: '#4299e1',
              fillColor: '#3182ce',
              fillOpacity: 0.3,
              weight: 1
            }).addTo(mapInstance);
            
            // Remove the markers after 5 seconds
            setTimeout(() => {
              if (mapInstance) {
                mapInstance.removeLayer(userMarker);
                mapInstance.removeLayer(pulseMarker);
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
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 0
        }
      );
    } else {
      alert("Your browser doesn't support geolocation");
    }
  };

  // Clear route handler
  const handleClearRoute = () => {
    setRoutePlaques([]);
    
    // Remove existing route lines
    if (routeLine && mapInstance) {
      mapInstance.removeLayer(routeLine);
    }
  };

  // Define some category quick filters
  const categories = [
    { label: "Authors", onClick: () => handleCategorySearch("author") },
    { label: "Scientists", onClick: () => handleCategorySearch("scientist") },
    { label: "Composers", onClick: () => handleCategorySearch("composer") },
    { label: "Politicians", onClick: () => handleCategorySearch("politician") }
  ];

  const handleCategorySearch = (category: string) => {
    if (onSearchChange) onSearchChange(category);
    if (onSearchSubmit) onSearchSubmit();
    setMapFilterVisible(false);
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
          {/* Controls Panel */}
          <MapControlPanel
            onCenterMap={handleCenterMap}
            onToggleFilters={() => setMapFilterVisible(!mapFilterVisible)}
            onFindMyLocation={handleFindMyLocation}
            filtersVisible={mapFilterVisible}
          />
          
          {/* Filter Panel */}
          <MapFilterPanel
            visible={mapFilterVisible}
            onClose={() => setMapFilterVisible(false)}
            searchQuery={searchQuery}
            onSearchChange={(e) => onSearchChange?.(e.target.value)}
            onSearch={() => onSearchSubmit?.()}
            categories={categories}
          />
          
          {/* Plaque counter */}
          <div className="absolute top-4 right-[5.5rem] z-10 bg-white rounded-full px-3 py-1 shadow-md text-sm font-medium">
            {plaques.length} {plaques.length === 1 ? 'Plaque' : 'Plaques'}
          </div>
          
          {/* Route Controls - only show if there are route plaques */}
          {routePlaques.length > 0 && (
            <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg p-3 shadow-md">
              <h4 className="font-medium text-sm mb-2">Route Planning</h4>
              <div className="text-xs text-gray-600 mb-2">
                {routePlaques.length} points selected
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleClearRoute}>
                  Clear Route
                </Button>
                <Button size="sm" onClick={() => {
                  // In a real app, you would implement routing functionality here
                  // For now, just show the route
                  if (mapInstance) {
                    const routePoints = routePlaques.map(plaque => 
                      [parseFloat(plaque.latitude as string), parseFloat(plaque.longitude as string)]
                    );
                    
                    // Remove existing routes first
                    if (routeLine) {
                      mapInstance.removeLayer(routeLine);
                    }
                    
                    const newRouteLine = window.L.polyline(routePoints, {
                      color: '#10b981',
                      weight: 5,
                      opacity: 0.7,
                      dashArray: '10, 10',
                      lineCap: 'round',
                      className: 'route-line'
                    }).addTo(mapInstance);
                    
                    // Fit map to show the route
                    mapInstance.fitBounds(newRouteLine.getBounds(), {padding: [50, 50]});
                  }
                }}>
                  Calculate Route
                </Button>
              </div>
            </div>
          )}
          
          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-md p-3">
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
        </>
      )}
    </div>
  );
};

export default PlaqueMap;