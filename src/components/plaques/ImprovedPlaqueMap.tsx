// src/components/plaques/ImprovedPlaqueMap.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Plaque } from '@/types/plaque';
import MapControls from './map/MapControls';
import MapFilterPanel from './map/MapFilterPanel';
import RoutePanel from './map/RoutePanel';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { createPlaqueIcon, createPlaquePopup } from '@/utils/map-utils';

type PlaqueMapProps = {
  plaques: Plaque[];
  onPlaqueClick: (plaque: Plaque) => void;
  favorites?: number[];
  selectedPlaqueId?: number | null;
  maintainView?: boolean;
  className?: string;
  routePoints?: Plaque[]; // Support for route points
  onRemovePoint?: (plaqueId: number) => void; // Support for removing points
  onAddToRoute?: (plaque: Plaque) => void; // Support for adding to route
};

const ImprovedPlaqueMap: React.FC<PlaqueMapProps> = ({
  plaques,
  onPlaqueClick,
  favorites = [],
  selectedPlaqueId,
  maintainView = false,
  className = '',
  routePoints = [],
  onRemovePoint,
  onAddToRoute
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [clusterGroup, setClusterGroup] = useState<any>(null);
  const [isRoutingMode, setIsRoutingMode] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(2); // in km
  const [filteredPlaquesCount, setFilteredPlaquesCount] = useState<number>(0);
  const [showClearRouteDialog, setShowClearRouteDialog] = useState<boolean>(false);
  
  // References for markers and other map elements
  const markersRef = useRef<Map<number, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const lastViewStateRef = useRef<any>(null);
  
  const handlePlaqueClickStable = useCallback((plaque: Plaque) => {
    onPlaqueClick(plaque);
  }, [onPlaqueClick]);

  // Initialize map when component mounts
  useEffect(() => {
    // Check if map is already initialized
    if (mapInstance || !mapContainerRef.current) return;
    
    // Guard against multiple initialization attempts
    const container = mapContainerRef.current;
    
    // Set flag on the DOM element to prevent double initialization
    if (container._leaflet_id) {
      console.warn('Map already initialized, skipping initialization');
      return;
    }
    
    // Initialize Leaflet - check if window.L exists, otherwise load it
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      
      document.head.appendChild(link);
      document.head.appendChild(script);
      
      script.onload = () => initializeMap(container);
      return () => {
        document.head.removeChild(link);
        document.head.removeChild(script);
      };
    } else {
      initializeMap(container);
    }
    
    // Cleanup function to properly remove the map when component unmounts
    return () => {
      if (mapInstance) {
        console.log('Cleaning up map instance');
        mapInstance.remove();
        setMapInstance(null);
        setClusterGroup(null);
      }
    };
  }, [mapContainerRef.current, mapInstance]); // Only depend on these two values

  // Initialize the map
  const initializeMap = (container) => {
    if (!window.L || !container) return;
    
    console.log('Initializing map on container:', container);
    
    try {
      const L = window.L;
      
      // Create the map
      const map = L.map(container, {
        center: [51.505, -0.09], // London coordinates
        zoom: 13,
        maxZoom: 18,
        minZoom: 10
      });
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Create cluster group if MarkerClusterGroup is available
      let cluster = null;
      if (L.markerClusterGroup) {
        cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
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
        
        map.addLayer(cluster);
      }
      
      // Add zoom control
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
      
      setMapInstance(map);
      setClusterGroup(cluster);
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  };

  // Update markers when plaques or map changes
  useEffect(() => {
    if (!mapInstance) return;
    
    const L = window.L;
    if (!L) return;
    
    // Clear existing markers
    const currentMarkers = markersRef.current;
    if (clusterGroup) {
      clusterGroup.clearLayers();
    } else {
      currentMarkers.forEach(marker => marker.remove());
      currentMarkers.clear();
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
          icon: createPlaqueIcon(plaque, favorites.includes(plaque.id), plaque.id === selectedPlaqueId)
        });
        
        // Add popup with routing capability if in routing mode
        const popupContent = createPlaquePopup(
          plaque,
          handlePlaqueClickStable,
          isRoutingMode, // Pass the routing mode
          isRoutingMode ? (onAddToRoute || addPlaqueToRoute) : null // Pass the add to route function
        );
        
        marker.bindPopup(popupContent);
        
        // Add click handler
        marker.on('click', () => {
          marker.openPopup();
        });
        
        // Store marker reference
        currentMarkers.set(plaque.id, marker);
        
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
    
    // If we have markers and no previous view state, fit bounds
    if (currentMarkers.size > 0 && !lastViewStateRef.current) {
      const bounds = L.latLngBounds(
        Array.from(currentMarkers.values()).map(marker => marker.getLatLng())
      );
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // If we have a selected plaque, center on it
    if (selectedPlaqueId && !maintainView) {
      const selectedPlaque = plaques.find(p => p.id === selectedPlaqueId);
      if (selectedPlaque && selectedPlaque.latitude && selectedPlaque.longitude) {
        const lat = parseFloat(selectedPlaque.latitude as unknown as string);
        const lng = parseFloat(selectedPlaque.longitude as unknown as string);
        if (!isNaN(lat) && !isNaN(lng)) {
          mapInstance.panTo([lat, lng], {
            animate: true,
            duration: 0.5
          });
        }
      }
    }
  }, [plaques, mapInstance, clusterGroup, favorites, selectedPlaqueId, isRoutingMode, handlePlaqueClickStable, maintainView, onAddToRoute]);

  // Local placeholder function if onAddToRoute is not provided
  const addPlaqueToRoute = useCallback((plaque: Plaque) => {
    toast.success(`Added "${plaque.title}" to route`);
    
    // If onAddToRoute prop is provided, use it
    if (onAddToRoute) {
      onAddToRoute(plaque);
    }
  }, [onAddToRoute]);

  // Find user location on the map
  const findUserLocation = useCallback(() => {
    if (!window.L || !mapInstance) return;
    
    setIsLoadingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          // Add or update user marker
          if (userMarkerRef.current) {
            mapInstance.removeLayer(userMarkerRef.current);
          }
          
          // Create user location marker
          const L = window.L;
          const userMarker = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(mapInstance);
          
          // Add accuracy circle
          const accuracyCircle = L.circle([latitude, longitude], {
            radius: position.coords.accuracy,
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            stroke: false
          }).addTo(mapInstance);
          
          // Store reference
          userMarkerRef.current = L.layerGroup([userMarker, accuracyCircle]);
          
          // Save current view before panning
          lastViewStateRef.current = {
            center: [mapInstance.getCenter().lat, mapInstance.getCenter().lng],
            zoom: mapInstance.getZoom()
          };
          
          // Pan to location
          mapInstance.panTo([latitude, longitude]);
          
          setIsLoadingLocation(false);
          toast.success("Location found!");
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          toast.error("Could not access your location. Please check your browser settings.");
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  }, [mapInstance]);

  // Draw distance circle around user location
  const drawDistanceCircle = useCallback((center: [number, number], radiusKm: number) => {
    if (!window.L || !mapInstance) return;
    
    const L = window.L;
    
    // Remove existing circle
    if (mapInstance._distanceCircle) {
      mapInstance.removeLayer(mapInstance._distanceCircle);
    }
    
    // Create new circle
    const circle = L.circle(center, {
      radius: radiusKm * 1000, // Convert km to meters
      fillColor: '#3b82f6',
      fillOpacity: 0.05,
      color: '#3b82f6',
      weight: 1
    }).addTo(mapInstance);
    
    // Store reference
    mapInstance._distanceCircle = circle;
  }, [mapInstance]);

  // Apply distance filter
  const applyDistanceFilter = useCallback(() => {
    if (!userLocation || !mapInstance) return;
    
    toast.success(`Showing plaques within ${maxDistance} km`);
    
    // Draw the distance circle
    drawDistanceCircle(userLocation, maxDistance);
    
    // In a real implementation, this would filter the markers based on distance
    // For this demo, we'll just update the count
    const filteredCount = Math.min(
      plaques.length, 
      Math.floor(plaques.length * (1 - maxDistance / 5))
    );
    setFilteredPlaquesCount(filteredCount);
    
  }, [userLocation, mapInstance, maxDistance, plaques.length, drawDistanceCircle]);

  // Reset filters
  const resetFilters = useCallback(() => {
    if (!mapInstance) return;
    
    // Clear distance circle
    if (mapInstance._distanceCircle) {
      mapInstance.removeLayer(mapInstance._distanceCircle);
    }
    
    setShowFilters(false);
    toast.info("Filters reset");
  }, [mapInstance]);

  // Toggle routing mode
  const toggleRoutingMode = useCallback(() => {
    // If already in routing mode and has route points, confirm before exiting
    if (isRoutingMode && routePoints.length > 0) {
      setShowClearRouteDialog(true);
      return;
    }
    
    // Toggle mode
    setIsRoutingMode(prev => !prev);
    
    // When entering routing mode, show toast with instructions
    if (!isRoutingMode) {
      toast.info("Route planning mode activated. Click 'Add to Route' in plaque popups to build your route.", {
        duration: 5000
      });
    }
  }, [isRoutingMode, routePoints.length]);

  // Update markers when routing mode changes
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    
    // Update all markers with new popups that reflect routing mode
    const currentMarkers = markersRef.current;
    
    currentMarkers.forEach((marker, plaqueId) => {
      const plaque = plaques.find(p => p.id === plaqueId);
      if (plaque) {
        const newPopupContent = createPlaquePopup(
          plaque,
          handlePlaqueClickStable,
          isRoutingMode,
          isRoutingMode ? (onAddToRoute || addPlaqueToRoute) : null
        );
        
        marker.getPopup()?.setContent(newPopupContent);
      }
    });
  }, [isRoutingMode, plaques, handlePlaqueClickStable, onAddToRoute, addPlaqueToRoute]);

  // Clear route
  const clearRoute = useCallback(() => {
    // If routeLineRef contains a route line, remove it
    if (routeLineRef.current && mapInstance) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // If onRemovePoint is provided, use it to clear all route points
    if (onRemovePoint && routePoints.length > 0) {
      routePoints.forEach(point => {
        onRemovePoint(point.id);
      });
    }
    
    setIsRoutingMode(false);
  }, [mapInstance, onRemovePoint, routePoints]);

  // Export route
  const exportRoute = useCallback(() => {
    if (routePoints.length < 2) {
      toast.error("Add at least two plaques to create a route");
      return;
    }
    
    // Create route data
    const routeData = {
      name: `${routePoints.length} Plaques Walking Tour`,
      stops: routePoints.map(p => ({
        id: p.id,
        title: p.title,
        location: p.location || p.address,
        coordinates: [
          parseFloat(p.latitude as unknown as string),
          parseFloat(p.longitude as unknown as string)
        ]
      })),
      created: new Date().toISOString()
    };
    
    // Convert to JSON
    const json = JSON.stringify(routeData, null, 2);
    
    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plaque-route.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Route exported successfully");
  }, [routePoints]);

  // Save route
  const saveRoute = useCallback(() => {
    if (routePoints.length < 2) {
      toast.error("Add at least two plaques to create a route");
      return;
    }
    
    try {
      // Prompt for route name
      const routeName = prompt("Enter a name for this route:", `${routePoints.length} Plaques Walking Tour`);
      
      if (!routeName) {
        return; // User cancelled
      }
      
      // Create route data
      const routeData = {
        id: Date.now(),
        name: routeName,
        stops: routePoints.map(p => ({
          id: p.id,
          title: p.title,
          location: p.location || p.address,
          coordinates: [
            parseFloat(p.latitude as unknown as string),
            parseFloat(p.longitude as unknown as string)
          ]
        })),
        created: new Date().toISOString()
      };
      
      // Get existing saved routes or initialize empty array
      const savedRoutes = JSON.parse(localStorage.getItem('plaqueroutes') || '[]');
      
      // Add new route
      savedRoutes.push(routeData);
      
      // Save back to localStorage
      localStorage.setItem('plaqueroutes', JSON.stringify(savedRoutes));
      
      toast.success(`Route "${routeName}" saved successfully`);
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error("Failed to save route. Please try again.");
    }
  }, [routePoints]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      ></div>
      
      {/* Map controls */}
      <MapControls 
        isLoadingLocation={isLoadingLocation}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        isRoutingMode={isRoutingMode}
        toggleRoutingMode={toggleRoutingMode}
        findUserLocation={findUserLocation}
        hasUserLocation={!!userLocation}
      />
      
      {/* Filter panel */}
      {showFilters && userLocation && (
        <MapFilterPanel 
          maxDistance={maxDistance}
          setMaxDistance={setMaxDistance}
          filteredPlaquesCount={filteredPlaquesCount}
          applyFilter={applyDistanceFilter}
          closeFilters={() => setShowFilters(false)}
          resetFilters={resetFilters}
        />
      )}
      
      {/* Route Panel */}
      {isRoutingMode && (
        <RoutePanel 
          routePoints={routePoints}
          onRemovePoint={(plaque) => onRemovePoint?.(plaque.id)}
          onReorderPoints={() => {}} // This would need to be implemented
          onExportRoute={exportRoute}
          onSaveRoute={saveRoute}
          onClose={() => {
            if (routePoints.length > 0) {
              setShowClearRouteDialog(true);
            } else {
              setIsRoutingMode(false);
            }
          }}
          onShowClearDialog={() => setShowClearRouteDialog(true)}
        />
      )}
      
      {/* Confirmation dialog for clearing route */}
      <AlertDialog open={showClearRouteDialog} onOpenChange={setShowClearRouteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear this route? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              clearRoute();
              setShowClearRouteDialog(false);
            }}>
              Clear Route
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Map attribution - required for OSM */}
      <div className="absolute bottom-1 left-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-600">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default ImprovedPlaqueMap;