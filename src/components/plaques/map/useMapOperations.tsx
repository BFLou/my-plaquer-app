// src/components/plaques/map/useMapOperations.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';

type UseMapOperationsProps = {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  plaques: Plaque[];
  favorites: number[];
  selectedPlaqueId?: number | null;
  maintainView: boolean;
  handlePlaqueClick: (plaque: Plaque) => void;
  maxDistance: number;
  setIsLoadingLocation: (loading: boolean) => void;
  setFilteredPlaquesCount: (count: number) => void;
  setShowFilters: (show: boolean) => void;
};

export const useMapOperations = ({
  mapContainerRef,
  plaques,
  favorites,
  selectedPlaqueId,
  maintainView,
  handlePlaqueClick,
  maxDistance,
  setIsLoadingLocation,
  setFilteredPlaquesCount,
  setShowFilters
}: UseMapOperationsProps) => {
  // Core map state
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [clusterGroup, setClusterGroup] = useState<any>(null);
  const [markersMap, setMarkersMap] = useState<Map<number, any>>(new Map());
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<Plaque[]>([]);
  const [routeLine, setRouteLine] = useState<any>(null);
  
  // References for tracking map state
  const initializedRef = useRef(false);
  const lastViewStateRef = useRef<{center: [number, number], zoom: number} | null>(null);
  const isManuallyZoomingRef = useRef(false);
  const prevSelectedIdRef = useRef<number | null>(null);
  const userMarkerRef = useRef<any>(null);
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  }, []);
  
  // Filter plaques by distance from user
  const filterPlaquesByDistance = useCallback((plaquesData: Plaque[], center: [number, number], radiusKm: number) => {
    return plaquesData.filter(plaque => {
      if (!plaque.latitude || !plaque.longitude) return false;
      
      const lat = parseFloat(plaque.latitude as unknown as string);
      const lng = parseFloat(plaque.longitude as unknown as string);
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      // Calculate distance in km
      const distance = calculateDistance(center[0], center[1], lat, lng);
      return distance <= radiusKm;
    });
  }, [calculateDistance]);
  
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
  
  // Create a simple polyline for the route
  const createSimplePolyline = useCallback((L: any, coordinates: any[]) => {
    if (!mapInstance) return;
    
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
    
    // Save current view before modifying it
    lastViewStateRef.current = {
      center: [mapInstance.getCenter().lat, mapInstance.getCenter().lng],
      zoom: mapInstance.getZoom()
    };
    
    // Fit bounds to show entire route but limit zoom level
    mapInstance.fitBounds(polyline.getBounds(), { 
      padding: [50, 50],
      maxZoom: 15 // Limit zoom level
    });
  }, [mapInstance]);
  
  // Update route line on map
  const updateRouteLine = useCallback((points: Plaque[]) => {
    if (!window.L || !mapInstance || points.length < 2) return;
    
    const L = window.L;
    
    console.log('Updating route line with', points.length, 'points');
    
    // More thorough cleanup of existing route line
    if (routeLine) {
      // If it's a routing control, we need special cleanup
      if (routeLine._plan && typeof routeLine.getPlan === 'function') {
        try {
          routeLine.getPlan().setWaypoints([]); // Clear waypoints first
          mapInstance.removeControl(routeLine); // Remove control
        } catch (e) {
          console.error('Error removing routing control:', e);
          // Fallback to regular removal
          mapInstance.removeLayer(routeLine);
        }
      } else {
        // Regular polyline
        mapInstance.removeLayer(routeLine);
      }
      setRouteLine(null);
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
      try {
        // Use Leaflet Routing Machine with modified options
        const routingControl = L.Routing.control({
          waypoints: coordinates.map(c => L.latLng(c[0], c[1])),
          lineOptions: {
            styles: [{ color: '#3b82f6', weight: 4, opacity: 0.7 }],
            extendToWaypoints: true,
            missingRouteTolerance: 100
          },
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false, // Don't auto-fit routes
          showAlternatives: false,
          show: false, // Don't show the control panel
          routeWhileDragging: false,
          autoRoute: true
        }).addTo(mapInstance);
        
        // Store reference to the routing control
        setRouteLine(routingControl);
        
        // We still want to fit bounds for the initial display, but using our own logic
        if (points.length >= 2) {
          const bounds = L.latLngBounds(coordinates.map(c => L.latLng(c[0], c[1])));
          
          // Save current view state first
          lastViewStateRef.current = {
            center: [mapInstance.getCenter().lat, mapInstance.getCenter().lng],
            zoom: mapInstance.getZoom()
          };
          
          // Fit bounds once only, with some padding
          mapInstance.fitBounds(bounds, { 
            padding: [50, 50],
            maxZoom: 15 // Limit zoom level
          });
        }
      } catch (error) {
        console.error('Error creating routing control:', error);
        // Fallback to simple polyline
        createSimplePolyline(L, coordinates);
      }
    } else {
      // Fallback to simple polyline
      createSimplePolyline(L, coordinates);
    }
  }, [mapInstance, createSimplePolyline]);
  
  // Remove plaque from route
  const removePlaqueFromRoute = useCallback((plaque: Plaque) => {
    // First, explicitly remove any existing route
    if (routeLine && mapInstance) {
      console.log('Removing existing route line in removePlaqueFromRoute');
      
      if (routeLine._plan && typeof routeLine.getPlan === 'function') {
        try {
          routeLine.getPlan().setWaypoints([]); // Clear waypoints first
          mapInstance.removeControl(routeLine); // Remove control
        } catch (e) {
          console.error('Error removing routing control:', e);
          mapInstance.removeLayer(routeLine);
        }
      } else {
        mapInstance.removeLayer(routeLine);
      }
      
      setRouteLine(null);
    }
    
    // Update route points
    setRoutePoints(prev => {
      const newPoints = prev.filter(p => p.id !== plaque.id);
      
      // If we still have enough points for a route, redraw after a delay
      if (newPoints.length >= 2) {
        console.log('Will redraw route with', newPoints.length, 'points');
        setTimeout(() => {
          updateRouteLine(newPoints);
        }, 100);
      }
      
      return newPoints;
    });
  }, [mapInstance, routeLine, updateRouteLine]);
  
  // Update route points order
  const reorderRoutePoints = useCallback((newPoints: Plaque[]) => {
    setRoutePoints(newPoints);
  }, []);
  
  // Add plaque to route
  const addPlaqueToRoute = useCallback((plaque: Plaque) => {
    // Check if plaque is already in route
    if (routePoints.some(p => p.id === plaque.id)) {
      toast.info("This plaque is already in your route.");
      return;
    }
    
    // Add the new plaque to the route (preserving existing points)
    setRoutePoints(prevPoints => {
      const newPoints = [...prevPoints, plaque];
      return newPoints;
    });
    
    toast.success(`Added "${plaque.title}" to route (${routePoints.length + 1} stops)`);
  }, [routePoints]);
  
  // Helper function to create plaque icon
  const createPlaqueIcon = useCallback((plaque: Plaque, isFavorite: boolean, isSelected: boolean) => {
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
    <div class="flex items-center justify-center bg-white rounded-full p-1 shadow-md ${isFavorite ? 'ring-2 ring-amber-500' : ''} ${isSelected ? 'ring-2 ring-blue-500 scale-125' : ''}">
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
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }, []);
  
  // Helper function to create popup content
  const createPopupContent = useCallback((plaque: Plaque) => {
    const div = document.createElement('div');
    div.className = 'plaque-popup p-2';
    
    // Get the current routing mode state from the component
    const currentRoutingMode = routePoints.length > 0 || Boolean(routeLine);
    
    div.innerHTML = `
      <div class="font-semibold text-sm mb-1">${plaque.title || 'Unnamed Plaque'}</div>
      <div class="text-xs text-gray-600 mb-2 truncate">${plaque.location || plaque.address || ''}</div>
      <div class="flex gap-2">
        <button class="view-details py-1 px-2 bg-blue-500 text-white text-xs rounded flex-grow hover:bg-blue-600 transition-colors">View Details</button>
        ${currentRoutingMode ? `
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
          handlePlaqueClick(plaque);
        });
      }
      
      if (routeButton) {
        routeButton.addEventListener('click', () => {
          // Check if already in route
          if (!routePoints.some(p => p.id === plaque.id)) {
            addPlaqueToRoute(plaque);
          } else {
            toast.info("This plaque is already in your route");
          }
        });
      }
    }, 10);
    
    return div;
  }, [handlePlaqueClick, routePoints, routeLine, addPlaqueToRoute]);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current || mapInstance) return;
    
    // Check if Leaflet is loaded
    if (!window.L) {
      loadLeafletLibraries();
      return;
    }
    
    const map = initializeMap();
    if (map) {
      setMapInstance(map.map);
      setClusterGroup(map.cluster);
      initializedRef.current = true;
    }
  }, [mapContainerRef, mapInstance]);
  
  // Load Leaflet libraries
  const loadLeafletLibraries = () => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    
    document.head.appendChild(link);
    document.head.appendChild(script);
    
    script.onload = () => {
      // Load MarkerCluster plugin
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
        // Load routing plugin
        const routingScript = document.createElement('script');
        routingScript.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
        
        const routingCss = document.createElement('link');
        routingCss.rel = 'stylesheet';
        routingCss.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
        
        document.head.appendChild(routingCss);
        document.head.appendChild(routingScript);
        
        routingScript.onload = () => {
          const map = initializeMap();
          if (map) {
            setMapInstance(map.map);
            setClusterGroup(map.cluster);
            initializedRef.current = true;
          }
        };
      };
    };
  };
  
  // Initialize the map
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.L) return null;
    
    const L = window.L;
    
    // Create the map
    const map = L.map(mapContainerRef.current, {
      center: [51.505, -0.09], // London coordinates
      zoom: 13,
      maxZoom: 18,
      minZoom: 10
    });
    
    // Track zoom and pan events
    map.on('zoomstart', () => {
      isManuallyZoomingRef.current = true;
    });
    
    map.on('zoomend', () => {
      setTimeout(() => {
        isManuallyZoomingRef.current = false;
      }, 100);
    });
    
    map.on('moveend', () => {
      lastViewStateRef.current = {
        center: [map.getCenter().lat, map.getCenter().lng],
        zoom: map.getZoom()
      };
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Create cluster group
    const cluster = L.markerClusterGroup({
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
    
    // Add zoom control
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    // Add scale control
    L.control.scale({
      imperial: false,
      position: 'bottomleft'
    }).addTo(map);
    
    return { map, cluster };
  };
  
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
  }, [mapInstance, plaques, maxDistance, filterPlaquesByDistance, setFilteredPlaquesCount, setIsLoadingLocation, setShowFilters]);
    
  // Add markers to map
  const addMarkersToMap = useCallback(() => {
    if (!window.L || !mapInstance || !clusterGroup) return;
    
    const L = window.L;
    const newMarkersMap = new Map();
    
    // Clear existing markers
    clusterGroup.clearLayers();
    
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
        
        // Add popup
        marker.bindPopup(createPopupContent(plaque));
        
        // Add click handler
        marker.on('click', () => {
          marker.openPopup();
        });
        
        // Store marker reference
        newMarkersMap.set(plaque.id, marker);
        
        // Add to cluster group
        clusterGroup.addLayer(marker);
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    setMarkersMap(newMarkersMap);
    
    // If we have markers and no previous view state, fit bounds
    if (newMarkersMap.size > 0 && !lastViewStateRef.current) {
      const bounds = L.latLngBounds(
        Array.from(newMarkersMap.values()).map(marker => marker.getLatLng())
      );
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [plaques, mapInstance, clusterGroup, createPlaqueIcon, createPopupContent, favorites, selectedPlaqueId]);
  
  // Update markers when plaques change
  useEffect(() => {
    if (!mapInstance || !clusterGroup) return;
    
    // Generate markers for plaques
    addMarkersToMap();
    
  }, [plaques, mapInstance, clusterGroup, favorites, selectedPlaqueId, addMarkersToMap]);
  
  // Handle selected plaque changes
  useEffect(() => {
    if (!mapInstance || !markersMap.size) return;
    
    // Find the selected plaque
    if (selectedPlaqueId) {
      const marker = markersMap.get(selectedPlaqueId);
      
      if (marker) {
        const plaque = plaques.find(p => p.id === selectedPlaqueId);
        
        if (plaque) {
          // Update icon to show selection
          marker.setIcon(createPlaqueIcon(plaque, favorites.includes(plaque.id), true));
          
          // Pan to marker if not maintaining view
          if (!maintainView && !isManuallyZoomingRef.current) {
            mapInstance.panTo(marker.getLatLng(), { 
              animate: true,
              duration: 0.5
            });
          }
        }
      }
    } else {
      // If no plaque is selected and we don't want to maintain view
      if (!maintainView && lastViewStateRef.current && !isManuallyZoomingRef.current) {
        mapInstance.setView(
          lastViewStateRef.current.center, 
          lastViewStateRef.current.zoom, 
          { animate: false }
        );
      }
    }
  }, [selectedPlaqueId, mapInstance, markersMap, maintainView, plaques, favorites, createPlaqueIcon]);
  
  // Apply distance filter
  const applyDistanceFilter = useCallback(() => {
    if (!userLocation || !mapInstance || !clusterGroup) return;
    
    // Get filtered plaques
    const filteredPlaques = filterPlaquesByDistance(plaques, userLocation, maxDistance);
    setFilteredPlaquesCount(filteredPlaques.length);
    
    // Save current view state
    lastViewStateRef.current = {
      center: [mapInstance.getCenter().lat, mapInstance.getCenter().lng],
      zoom: mapInstance.getZoom()
    };
    
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
    
    // Update markers map
    setMarkersMap(filtered);
    
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
  }, [userLocation, mapInstance, clusterGroup, plaques, maxDistance, filterPlaquesByDistance, createPlaqueIcon, createPopupContent, favorites, selectedPlaqueId, markersMap, drawDistanceCircle, setFilteredPlaquesCount]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    if (!mapInstance || !clusterGroup) return;
    
    // Clear distance circle
    if (mapInstance._distanceCircle) {
      mapInstance.removeLayer(mapInstance._distanceCircle);
    }
    
    // Restore the original markers
    addMarkersToMap();
    
    // Reset UI
    setShowFilters(false);
    
    toast.info("Filters reset");
  }, [mapInstance, clusterGroup, addMarkersToMap]);
  
  // Clear route
  const clearRoute = useCallback(() => {
    if (routeLine && mapInstance) {
      console.log('Clearing route completely');
      
      // More thorough cleanup
      if (routeLine._plan && typeof routeLine.getPlan === 'function') {
        try {
          routeLine.getPlan().setWaypoints([]); // Clear waypoints first
          mapInstance.removeControl(routeLine); // Remove control
        } catch (e) {
          console.error('Error removing routing control:', e);
          mapInstance.removeLayer(routeLine);
        }
      } else {
        mapInstance.removeLayer(routeLine);
      }
    }
    
    setRouteLine(null);
    setRoutePoints([]);
  }, [mapInstance, routeLine]);
  
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
  
  // Save route to localStorage
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
  
  // Update route when route points change
  useEffect(() => {
    if (mapInstance && routePoints.length >= 2) {
      updateRouteLine(routePoints);
    }
  }, [routePoints, mapInstance, updateRouteLine]);
  
  return {
    mapInstance,
    userLocation,
    routePoints,
    addPlaqueToRoute,
    removePlaqueFromRoute,
    reorderRoutePoints,
    clearRoute,
    exportRoute,
    saveRoute,
    findUserLocation,
    applyDistanceFilter,
    resetFilters,
    drawDistanceCircle
  };
};