// src/components/plaques/EnhancedPlaqueMap.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Navigation, Filter, Target, CornerDownLeft, Route as RouteIcon, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';

type PlaqueMapProps = {
  plaques: Plaque[];
  onPlaqueClick: (plaque: Plaque) => void;
  favorites?: number[];
  selectedPlaqueId?: number | null;
  className?: string;
};

const EnhancedPlaqueMap: React.FC<PlaqueMapProps> = ({
  plaques,
  onPlaqueClick,
  favorites = [],
  selectedPlaqueId,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [clusterGroup, setClusterGroup] = useState<any>(null);
  const [markersMap, setMarkersMap] = useState<Map<number, any>>(new Map());
  
  // User location state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const userMarkerRef = useRef<any>(null);
  
  // Filter controls
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(2); // in km
  const [filteredPlaquesCount, setFilteredPlaquesCount] = useState<number>(0);
  
  // Route planning
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routePoints, setRoutePoints] = useState<Plaque[]>([]);
  const [routeLine, setRouteLine] = useState<any>(null);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;
    
    // Check if Leaflet is loaded
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      
      document.head.appendChild(link);
      document.head.appendChild(script);
      
      script.onload = initializeMap;
      
      return () => {
        document.head.removeChild(link);
        document.head.removeChild(script);
      };
    } else {
      initializeMap();
    }
  }, []);
  
  // Function to initialize the map
  const initializeMap = () => {
    const L = window.L;
    
    // Create the map
    const map = L.map(mapRef.current!, {
      center: [51.505, -0.09], // London coordinates
      zoom: 13,
      maxZoom: 18,
      minZoom: 10
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Initialize marker cluster group if available
    let cluster;
    
    // Check if MarkerClusterGroup plugin is available, if not, load it
    if (!L.markerClusterGroup) {
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
      
      clusterScript.onload = () => {
        cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          iconCreateFunction: (cluster) => {
            return L.divIcon({
              html: `<div class="cluster-marker"><div>${cluster.getChildCount()}</div></div>`,
              className: 'custom-cluster',
              iconSize: L.point(40, 40)
            });
          }
        });
        map.addLayer(cluster);
        setClusterGroup(cluster);
        
        // Add markers after cluster is initialized
        addMarkersToMap(plaques, cluster, map);
      };
    } else {
      cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        iconCreateFunction: (cluster) => {
          return L.divIcon({
            html: `<div class="cluster-marker"><div>${cluster.getChildCount()}</div></div>`,
            className: 'custom-cluster',
            iconSize: L.point(40, 40)
          });
        }
      });
      map.addLayer(cluster);
      setClusterGroup(cluster);
      
      // Add markers
      addMarkersToMap(plaques, cluster, map);
    }
    
    // Add routing control if available
    if (!L.Routing) {
      const routingScript = document.createElement('script');
      routingScript.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
      
      const routingCss = document.createElement('link');
      routingCss.rel = 'stylesheet';
      routingCss.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
      
      document.head.appendChild(routingCss);
      document.head.appendChild(routingScript);
    }
    
    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    // Add scale control
    L.control.scale({
      imperial: false,
      position: 'bottomleft'
    }).addTo(map);
    
    // Store map instance
    setMapInstance(map);
  };
  
  // Add markers to map
  const addMarkersToMap = (plaquesData: Plaque[], cluster: any, map: any) => {
    if (!window.L) return;
    
    const L = window.L;
    const newMarkersMap = new Map();
    
    // Clear existing markers
    if (cluster) {
      cluster.clearLayers();
    }
    
    // Add markers for plaques with valid coordinates
    plaquesData.forEach(plaque => {
      if (!plaque.latitude || !plaque.longitude) return;
      
      try {
        const lat = parseFloat(plaque.latitude as unknown as string);
        const lng = parseFloat(plaque.longitude as unknown as string);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Create marker
        const marker = L.marker([lat, lng], {
          icon: createPlaqueIcon(plaque, favorites.includes(plaque.id), plaque.id === selectedPlaqueId)
        });
        
        // Add popup
        marker.bindPopup(createPopupContent(plaque));
        
        // Add click handler
        marker.on('click', () => {
          marker.openPopup();
        });
        
        // Store marker reference
        newMarkersMap.set(plaque.id, marker);
        
        // Add to cluster group or directly to map
        if (cluster) {
          cluster.addLayer(marker);
        } else {
          marker.addTo(map);
        }
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    setMarkersMap(newMarkersMap);
    
    // If we have markers, fit bounds
    if (newMarkersMap.size > 0) {
      const bounds = L.latLngBounds(
        Array.from(newMarkersMap.values()).map(marker => marker.getLatLng())
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };
  
  // Update markers when plaques change
  useEffect(() => {
    if (!mapInstance || !clusterGroup) return;
    
    addMarkersToMap(plaques, clusterGroup, mapInstance);
    
    // Update filtered count
    if (userLocation) {
      const filtered = filterPlaquesByDistance(plaques, userLocation, maxDistance);
      setFilteredPlaquesCount(filtered.length);
    }
  }, [plaques, mapInstance, clusterGroup, favorites, selectedPlaqueId]);
  
  // Update selected plaque marker
  useEffect(() => {
    if (!mapInstance || !markersMap.size) return;
    
    // Remove previous selection styling
    markersMap.forEach(marker => {
      const plaque = plaques.find(p => p.id === parseInt(marker.options.icon.options.iconUrl.split('id=')[1]));
      if (plaque) {
        marker.setIcon(createPlaqueIcon(
          plaque, 
          favorites.includes(plaque.id),
          plaque.id === selectedPlaqueId
        ));
      }
    });
    
    // Apply selection styling and pan to selected
    if (selectedPlaqueId) {
      const marker = markersMap.get(selectedPlaqueId);
      if (marker) {
        const plaque = plaques.find(p => p.id === selectedPlaqueId);
        if (plaque) {
          marker.setIcon(createPlaqueIcon(plaque, favorites.includes(plaque.id), true));
          mapInstance.panTo(marker.getLatLng(), { animate: true });
        }
      }
    }
  }, [selectedPlaqueId, markersMap, mapInstance]);
  
  // Helper function to create plaque icon
  const createPlaqueIcon = (plaque: Plaque, isFavorite: boolean, isSelected: boolean) => {
    const L = window.L;
    if (!L) return null;
    
    // Determine color based on plaque color
    const colorMap: Record<string, string> = {
      'blue': '#3b82f6',
      'green': '#10b981',
      'brown': '#b45309',
      'black': '#1f2937',
      'grey': '#4b5563',
      'gray': '#4b5563'
    };
    
    const color = colorMap[(plaque.color || 'blue').toLowerCase()] || '#3b82f6';
    
    // Create HTML for icon
    const html = `
      <div class="bg-white rounded-full p-1 shadow-md ${isFavorite ? 'ring-2 ring-amber-500' : ''} ${isSelected ? 'ring-2 ring-blue-500 scale-125' : ''}">
        <div style="background-color: ${color}; width: 28px; height: 28px;" class="text-white rounded-full flex items-center justify-center">
          ${plaque.visited ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
          }
        </div>
      </div>
    `;
    
    return L.divIcon({
      html,
      className: `custom-marker ${isSelected ? 'selected-marker' : ''}`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      iconUrl: `marker-id=${plaque.id}` // Hack to store ID in icon for later retrieval
    });
  };
  
  // Helper function to create popup content
  const createPopupContent = (plaque: Plaque) => {
    const div = document.createElement('div');
    div.className = 'plaque-popup p-2';
    
    div.innerHTML = `
      <div class="font-semibold text-sm mb-1">${plaque.title || 'Unnamed Plaque'}</div>
      <div class="text-xs text-gray-600 mb-2 truncate">${plaque.location || plaque.address || ''}</div>
      <div class="flex gap-2">
        <button class="view-details py-1 px-2 bg-blue-500 text-white text-xs rounded flex-grow hover:bg-blue-600 transition-colors">View Details</button>
        ${isRoutingMode ? `
          <button class="add-to-route py-1 px-2 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors">
            Add to Route
          </button>
        ` : ''}
      </div>
    `;
    
    // Add event listeners after a small delay
    setTimeout(() => {
      const viewButton = div.querySelector('.view-details');
      const routeButton = div.querySelector('.add-to-route');
      
      if (viewButton) {
        viewButton.addEventListener('click', () => {
          onPlaqueClick(plaque);
        });
      }
      
      if (routeButton) {
        routeButton.addEventListener('click', () => {
          addPlaqueToRoute(plaque);
        });
      }
    }, 10);
    
    return div;
  };
  
  // Find the user's current location
  const findUserLocation = () => {
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
          
          // Pan to location
          mapInstance.panTo([latitude, longitude]);
          
          // Filter plaques by distance and update count
          const filtered = filterPlaquesByDistance(plaques, [latitude, longitude], maxDistance);
          setFilteredPlaquesCount(filtered.length);
          
          // Show filters
          setShowFilters(true);
          setIsLoadingLocation(false);
          
          toast.success("Location found!");
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          
          let errorMessage = "Could not access your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Please enable location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
          }
          
          toast.error(errorMessage);
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  };
  
  // Filter plaques by distance from user
  const filterPlaquesByDistance = (plaquesData: Plaque[], center: [number, number], radiusKm: number) => {
    return plaquesData.filter(plaque => {
      if (!plaque.latitude || !plaque.longitude) return false;
      
      const lat = parseFloat(plaque.latitude as unknown as string);
      const lng = parseFloat(plaque.longitude as unknown as string);
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      // Calculate distance in km
      const distance = calculateDistance(center[0], center[1], lat, lng);
      return distance <= radiusKm;
    });
  };
  
  // Apply distance filter
  const applyDistanceFilter = () => {
    if (!userLocation || !mapInstance || !clusterGroup) return;
    
    // Get filtered plaques
    const filteredPlaques = filterPlaquesByDistance(plaques, userLocation, maxDistance);
    setFilteredPlaquesCount(filteredPlaques.length);
    
    // Update markers
    clusterGroup.clearLayers();
    
    // Get marker references
    const L = window.L;
    const filtered = new Map();
    
    filteredPlaques.forEach(plaque => {
      const existingMarker = markersMap.get(plaque.id);
      if (existingMarker) {
        clusterGroup.addLayer(existingMarker);
        filtered.set(plaque.id, existingMarker);
      } else if (plaque.latitude && plaque.longitude) {
        const lat = parseFloat(plaque.latitude as unknown as string);
        const lng = parseFloat(plaque.longitude as unknown as string);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng], {
            icon: createPlaqueIcon(plaque, favorites.includes(plaque.id), plaque.id === selectedPlaqueId)
          });
          
          marker.bindPopup(createPopupContent(plaque));
          marker.on('click', () => marker.openPopup());
          
          clusterGroup.addLayer(marker);
          filtered.set(plaque.id, marker);
        }
      }
    });
    
    // Show distance circle
    drawDistanceCircle(userLocation, maxDistance);
    
    // Show toast
    toast.success(`Showing ${filteredPlaques.length} plaques within ${maxDistance} km`);
    
    // Fit bounds
    if (filteredPlaques.length > 0) {
      const bounds = L.latLngBounds(
        Array.from(filtered.values()).map(marker => marker.getLatLng())
      );
      
      // Add user location to bounds
      bounds.extend(L.latLng(userLocation[0], userLocation[1]));
      
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  };
  
  // Draw distance circle around user location
  const drawDistanceCircle = (center: [number, number], radiusKm: number) => {
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
  };
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };
  
  // Reset filters
  const resetFilters = () => {
    if (!mapInstance || !clusterGroup) return;
    
    // Clear distance circle
    if (mapInstance._distanceCircle) {
      mapInstance.removeLayer(mapInstance._distanceCircle);
    }
    
    // Reset markers
    clusterGroup.clearLayers();
    addMarkersToMap(plaques, clusterGroup, mapInstance);
    
    // Reset UI
    setShowFilters(false);
    setMaxDistance(2);
    
    toast.info("Filters reset");
  };
  
  // Toggle routing mode
  const toggleRoutingMode = () => {
    setIsRoutingMode(!isRoutingMode);
    
    if (isRoutingMode) {
      // Clear route
      clearRoute();
    } else {
      toast.info("Route planning mode activated. Click on plaques to add them to your route.", {
        duration: 5000
      });
    }
  };
  
  // Add plaque to route
  const addPlaqueToRoute = (plaque: Plaque) => {
    if (!isRoutingMode || !mapInstance) return;
    
    // Add to route points
    setRoutePoints(prev => {
      // Check if plaque is already in route
      if (prev.some(p => p.id === plaque.id)) {
        toast.info("This plaque is already in your route.");
        return prev;
      }
      
      const newPoints = [...prev, plaque];
      
      // Update route line
      if (newPoints.length >= 2) {
        updateRouteLine(newPoints);
      }
      
      toast.success(`Added "${plaque.title}" to route (${newPoints.length} stops)`);
      return newPoints;
    });
  };
  
  // Update route line on map
  const updateRouteLine = (points: Plaque[]) => {
    if (!window.L || !mapInstance || points.length < 2) return;
    
    const L = window.L;
    
    // Remove existing route line
    if (routeLine) {
      mapInstance.removeLayer(routeLine);
    }
    
    // Get valid coordinates
    const coordinates = points
      .filter(p => p.latitude && p.longitude)
      .map(p => [
        parseFloat(p.latitude as unknown as string), 
        parseFloat(p.longitude as unknown as string)
      ]);
    
    if (coordinates.length < 2) return;
    
    // Check if Routing plugin is available
    if (L.Routing && L.Routing.control) {
      // Use Leaflet Routing Machine
      const routingControl = L.Routing.control({
        waypoints: coordinates.map(c => L.latLng(c[0], c[1])),
        lineOptions: {
          styles: [{ color: '#3b82f6', weight: 4, opacity: 0.7 }],
          extendToWaypoints: true,
          missingRouteTolerance: 100
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false
      }).addTo(mapInstance);
      
      setRouteLine(routingControl);
    } else {
      // Fallback to simple polyline
      const polyline = L.polyline(coordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '5, 10',
        dashOffset: '0'
      }).addTo(mapInstance);
      
      setRouteLine(polyline);
      
      // Fit bounds to show entire route
      mapInstance.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  };
  
  // Remove plaque from route
  const removePlaqueFromRoute = (plaque: Plaque) => {
    setRoutePoints(prev => {
      const newPoints = prev.filter(p => p.id !== plaque.id);
      
      // Update route line
      if (newPoints.length >= 2) {
        updateRouteLine(newPoints);
      } else if (routeLine) {
        mapInstance.removeLayer(routeLine);
        setRouteLine(null);
      }
      
      return newPoints;
    });
  };
  
  // Clear route
  const clearRoute = () => {
    if (routeLine && mapInstance) {
      mapInstance.removeLayer(routeLine);
    }
    
    setRouteLine(null);
    setRoutePoints([]);
    setIsRoutingMode(false);
  };
  
  // Export route
  const exportRoute = () => {
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
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      ></div>
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-2">
        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={findUserLocation}
            disabled={isLoadingLocation}
            title="Find my location"
          >
            {isLoadingLocation ? (
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
            ) : (
              <Navigation size={16} />
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 w-8 p-0 ${showFilters ? 'bg-blue-50' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            disabled={!userLocation}
            title="Distance filter"
          >
            <Filter size={16} />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 w-8 p-0 ${isRoutingMode ? 'bg-green-50 text-green-600' : ''}`}
            onClick={toggleRoutingMode}
            title={isRoutingMode ? "Exit route planning" : "Plan a route"}
          >
            <RouteIcon size={16} />
          </Button>
          
          {/* Reset button - visible when filters active */}
          {showFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 text-red-500"
              onClick={resetFilters}
              title="Reset filters"
            >
              <CornerDownLeft size={16} />
            </Button>
          )}
        </div>
      </div>
      
      {/* Distance filter panel */}
      {showFilters && userLocation && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-10 w-64">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Distance Filter</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setShowFilters(false)}
            >
              <X size={14} />
            </Button>
          </div>
          
          <div className="space-y-3">
          <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Range: {maxDistance} km</span>
              <Badge variant="outline" className="text-xs">
                {filteredPlaquesCount} plaques
              </Badge>
            </div>
            
            <Slider
              value={[maxDistance]}
              min={0.5}
              max={5}
              step={0.5}
              onValueChange={(values) => setMaxDistance(values[0])}
              className="w-full"
            />
            
            <Button 
              size="sm" 
              className="w-full"
              onClick={applyDistanceFilter}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      )}
      
      {/* Route Panel - visible in routing mode */}
      {isRoutingMode && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-10 w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Route Planner</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setIsRoutingMode(false)}
            >
              <X size={14} />
            </Button>
          </div>
          
          {routePoints.length === 0 ? (
            <div className="text-center py-2 text-sm text-gray-500">
              Click on plaques to add them to your route
            </div>
          ) : (
            <div className="space-y-3">
              <div className="max-h-40 overflow-y-auto">
                {routePoints.map((plaque, index) => (
                  <div 
                    key={plaque.id} 
                    className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="flex items-center gap-2 text-sm truncate flex-grow">
                      <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                      <span className="truncate">{plaque.title}</span>
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-red-500 shrink-0"
                      onClick={() => removePlaqueFromRoute(plaque)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={clearRoute}
                >
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={exportRoute}
                  disabled={routePoints.length < 2}
                >
                  Export Route
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Map attribution - required for OSM */}
      <div className="absolute bottom-1 left-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-600">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default EnhancedPlaqueMap;