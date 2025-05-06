// src/components/maps/PlaqueMap.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
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
import { 
  Search, 
  MapPin, 
  CornerUpLeft, 
  Navigation, 
  Filter, 
  Route as RouteIcon, 
  Map, 
  X, 
  Trash,
  Save,
  Download,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import FilterPanel from './controls/FilterPanel';
import LocationSearchPanel from './controls/LocationSearchPanel';

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

// Calculate total route distance
function calculateRouteDistance(points) {
  if (!points || points.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
    
    const startLat = parseFloat(start.latitude);
    const startLng = parseFloat(start.longitude);
    const endLat = parseFloat(end.latitude);
    const endLng = parseFloat(end.longitude);
    
    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
    
    // Calculate direct distance (haversine formula)
    totalDistance += calculateDistance(startLat, startLng, endLat, endLng);
  }
  
  return totalDistance;
}

// Improved PlaqueMap component with reliable routing functionality
const PlaqueMap = React.forwardRef(({
  plaques = [],
  onPlaqueClick = () => {},
  favorites = [],
  selectedPlaqueId = null,
  maintainView = false,
  className = '',
  isRoutingMode = false,
  setIsRoutingMode = () => {},
  routePoints = [],
  addPlaqueToRoute = () => {},
  removePlaqueFromRoute = () => {},
  clearRoute = () => {}
}, ref) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const routeLineRef = useRef(null);
  const routeMarkerGroupRef = useRef(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [useImperial, setUseImperial] = useState(false);
  const [clearRouteDialog, setClearRouteDialog] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  
  // Load Leaflet and related libraries - only once
  useEffect(() => {
    // Check if the libraries are already loaded
    if (document.querySelector('link[href*="leaflet.css"]')) {
      console.log("Leaflet CSS already loaded");
      initializeMap();
      return;
    }

    console.log("Loading Leaflet libraries...");
    
    // Load CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const clusterCSS = document.createElement('link');
    clusterCSS.rel = 'stylesheet';
    clusterCSS.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
    document.head.appendChild(clusterCSS);

    const clusterDefaultCSS = document.createElement('link');
    clusterDefaultCSS.rel = 'stylesheet';
    clusterDefaultCSS.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
    document.head.appendChild(clusterDefaultCSS);

    // Load JavaScript
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.onload = () => {
      // Load MarkerCluster after Leaflet is loaded
      const clusterScript = document.createElement('script');
      clusterScript.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      
      clusterScript.onload = () => {
        console.log("Map libraries loaded successfully");
        initializeMap();
      };
      
      document.head.appendChild(clusterScript);
    };
    
    document.head.appendChild(leafletScript);

    // No cleanup to ensure scripts remain loaded
  }, []);

  // Initialize map - placed outside of useEffect to be called once libraries are loaded
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.L) {
      console.log("Map container or Leaflet not available");
      return;
    }
    
    // Check if map is already initialized
    if (mapInstanceRef.current) {
      console.log("Map already initialized, skipping initialization");
      return;
    }
    
    console.log("Initializing map...");
    
    try {
      // Create map instance
      const map = window.L.map(mapContainerRef.current, {
        center: [51.505, -0.09], // London as default
        zoom: 13,
        maxZoom: 18,
        minZoom: 4,
        zoomControl: false
      });
      
      mapInstanceRef.current = map;
      
      // Add zoom control in better position
      window.L.control.zoom({
        position: 'topright'
      }).addTo(map);
      
      // Add tile layer
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);
      
      // Create marker layer
      const markers = window.L.layerGroup().addTo(map);
      markersLayerRef.current = markers;
      
      // Create a separate layer for route markers to prevent clustering
      const routeMarkers = window.L.layerGroup().addTo(map);
      routeMarkerGroupRef.current = routeMarkers;
      
      // Create cluster group if available
      if (window.L.markerClusterGroup) {
        const clusters = window.L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 18,
          animate: true,
          zoomToBoundsOnClick: true,
          iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let size = 40;
            
            // Size based on count
            if (count < 5) size = 40;
            else if (count < 20) size = 44;
            else if (count < 50) size = 48;
            else size = 52;
            
            return window.L.divIcon({
              html: `
                <div class="custom-cluster">
                  <div class="custom-cluster-inner">
                    ${count}
                  </div>
                </div>
              `,
              className: 'custom-cluster-icon',
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            });
          }
        });
        
        map.addLayer(clusters);
        clusterGroupRef.current = clusters;
      }
      
      // Enable interactions
      map.scrollWheelZoom.enable();
      
      // Set map as loaded
      setMapLoaded(true);
      
      // Add markers after a short delay
      setTimeout(() => {
        addMapMarkers();
      }, 100);
      
      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);
  
  // Format distance based on unit preference
  const formatDistance = useCallback((distanceKm) => {
    if (useImperial) {
      // Convert to miles (1 km = 0.621371 miles)
      const miles = distanceKm * 0.621371;
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${distanceKm.toFixed(1)} km`;
    }
  }, [useImperial]);
  
  // Calculate walking time based on distance
  const calculateWalkingTime = useCallback((distanceKm) => {
    if (distanceKm <= 0) return "0 min";
    
    const minutes = Math.round(distanceKm * 12); // 12 minutes per km
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
  }, []);
  
  // Add markers to the map
  const addMapMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.L) {
      console.log("Map or Leaflet not available for adding markers");
      return;
    }
    
    // Don't add markers if we're in the middle of drawing a route
    if (isDrawingRoute) {
      return;
    }
    
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const clusterGroup = clusterGroupRef.current;
    const routeMarkerGroup = routeMarkerGroupRef.current;
    
    // Clear existing markers
    if (markersLayer) {
      markersLayer.clearLayers();
    }
    
    if (clusterGroup) {
      clusterGroup.clearLayers();
    }
    
    if (routeMarkerGroup) {
      routeMarkerGroup.clearLayers();
    }
    
    console.log(`Adding ${plaques.length} markers to the map`);
    
    // Add markers for plaques
    plaques.forEach(plaque => {
      try {
        // Skip plaques without coordinates
        if (!plaque.latitude || !plaque.longitude) return;
        
        const lat = parseFloat(plaque.latitude);
        const lng = parseFloat(plaque.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Get plaque color
        const plaqueColor = (plaque.color?.toLowerCase() || 'blue');
        const bgColor = {
          'blue': '#3b82f6',
          'green': '#10b981',
          'brown': '#b45309',
          'black': '#1f2937',
          'grey': '#4b5563',
          'gray': '#4b5563'
        }[plaqueColor] || '#3b82f6';
        
        // Check if plaque is in the route
        const routeIndex = routePoints.findIndex(p => p.id === plaque.id);
        const isInRoute = routeIndex !== -1;
        
        // Create marker with custom icon
        const isFavorite = favorites.includes(plaque.id);
        const isSelected = plaque.id === selectedPlaqueId;
        
        if (isInRoute) {
          // ROUTE MARKERS - Diamond shaped with numbers/letters
          let markerLabel, markerColor, markerClass;
          
          if (routeIndex === 0) {
            markerLabel = 'S';
            markerColor = '#3b82f6'; // Blue for start
            markerClass = 'route-marker-start';
          } else if (routeIndex === routePoints.length - 1) {
            markerLabel = 'E';
            markerColor = '#ef4444'; // Red for end
            markerClass = 'route-marker-end';
          } else {
            markerLabel = (routeIndex + 1).toString();
            markerColor = '#10b981'; // Green for waypoints
            markerClass = 'route-marker-waypoint';
          }
          
          // Create diamond-shaped route marker
          const icon = window.L.divIcon({
            className: `route-marker ${markerClass}`,
            html: `
              <div class="route-marker-container">
                <div class="route-marker-diamond" style="background-color: ${markerColor};">
                  <div class="route-marker-content">${markerLabel}</div>
                </div>
                <div class="route-marker-label">${
                  routeIndex === 0 ? 'Start' : 
                    routeIndex === routePoints.length - 1 ? 'End' : 
                    `Stop ${routeIndex + 1}`
                }</div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          
          const marker = window.L.marker([lat, lng], { 
            icon,
            zIndexOffset: 1000 // Ensure route markers are on top
          });
          
          // Create popup
          const popupContent = document.createElement('div');
          popupContent.className = 'plaque-popup';
          popupContent.innerHTML = `
            <div class="max-w-xs">
              <div class="font-medium text-sm">${plaque.title || 'Unnamed Plaque'}</div>
              <div class="text-xs text-green-600 mt-1">• ${
                routeIndex === 0 ? 'Start point' : 
                routeIndex === routePoints.length - 1 ? 'End point' : 
                `Stop #${routeIndex + 1}`
              } in route</div>
              <div class="flex gap-2 mt-3">
                <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
                  View Details
                </button>
                <button class="remove-from-route py-1.5 px-3 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors">
                  Remove from Route
                </button>
              </div>
            </div>
          `;
          
          // Add event listeners
          setTimeout(() => {
            const detailButton = popupContent.querySelector('.view-details');
            if (detailButton) {
              detailButton.addEventListener('click', () => {
                marker.closePopup();
                setTimeout(() => {
                  onPlaqueClick(plaque);
                }, 50);
              });
            }
            
            const removeButton = popupContent.querySelector('.remove-from-route');
            if (removeButton) {
              removeButton.addEventListener('click', () => {
                marker.closePopup();
                removePlaqueFromRoute(plaque.id);
              });
            }
          }, 0);
          
          // Configure popup
          const popupOptions = {
            closeButton: true,
            autoClose: true,
            className: 'plaque-popup-container',
            maxWidth: 300,
            minWidth: 200,
            offset: [0, -20]
          };
          
          marker.bindPopup(popupContent, popupOptions);
          
          // Add click handler
          marker.on('click', () => {
            marker.openPopup();
          });
          
          // Add to route marker layer (no clustering)
          if (routeMarkerGroup) {
            routeMarkerGroup.addLayer(marker);
          } else if (markersLayer) {
            markersLayer.addLayer(marker);
          }
        } else {
          // REGULAR PLAQUE MARKERS - Circle with icon
          const size = isSelected ? 42 : 36;
          const markerContent = plaque.visited ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
          
          // Create regular circular marker
          const icon = window.L.divIcon({
            className: 'custom-marker',
            html: `
              <div class="plaque-marker ${isSelected ? 'plaque-marker-selected' : ''}" style="${isSelected ? 'transform: scale(1.2);' : ''}">
                <div class="plaque-marker-circle" style="
                  width: ${size}px;
                  height: ${size}px;
                  background-color: white;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  border: ${isFavorite ? '2px solid #f59e0b' : '2px solid white'};
                  padding: 2px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <div style="
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background-color: ${bgColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                  ">
                    ${markerContent}
                  </div>
                </div>
              </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
          });
          
          const marker = window.L.marker([lat, lng], { 
            icon,
            zIndexOffset: isSelected ? 900 : 0
          });
          
          // Create popup
          const popupContent = document.createElement('div');
          popupContent.className = 'plaque-popup';
          popupContent.innerHTML = `
            <div class="max-w-xs">
              <div class="font-medium text-sm">${plaque.title || 'Unnamed Plaque'}</div>
              <div class="text-xs text-gray-600 mt-1">${plaque.location || plaque.address || ''}</div>
              ${plaque.color ? `
                <div class="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <div class="w-3 h-3 rounded-full" style="background-color: ${bgColor}"></div>
                  <span>${plaqueColor.charAt(0).toUpperCase() + plaqueColor.slice(1)} plaque</span>
                </div>
              ` : ''}
              ${plaque.erected ? `<div class="text-xs text-gray-500 mt-1">Erected: ${plaque.erected}</div>` : ''}
              ${plaque.visited ? `<div class="text-xs text-green-600 mt-1">✓ You've visited this plaque</div>` : ''}
              <div class="flex gap-2 mt-3">
                <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
                  View Details
                </button>
                ${isRoutingMode ? `
                  <button class="add-to-route py-1.5 px-3 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors">
                    Add to Route
                  </button>
                ` : ''}
              </div>
            </div>
          `;
          
          // Add event listeners
          setTimeout(() => {
            const detailButton = popupContent.querySelector('.view-details');
            if (detailButton) {
              detailButton.addEventListener('click', () => {
                marker.closePopup();
                setTimeout(() => {
                  onPlaqueClick(plaque);
                }, 50);
              });
            }
            
            // Add route button click handler if in routing mode
            const addRouteButton = popupContent.querySelector('.add-to-route');
            if (addRouteButton) {
              addRouteButton.addEventListener('click', () => {
                // Check if plaque is already in route
                const isAlreadyInRoute = routePoints.some(p => p.id === plaque.id);
                if (isAlreadyInRoute) {
                  toast.info("This plaque is already in your route");
                  return;
                }
                
                // Add to route
                addPlaqueToRoute(plaque);
                marker.closePopup();
              });
            }
          }, 0);
          
          // Configure popup
          const popupOptions = {
            closeButton: true,
            autoClose: true,
            className: 'plaque-popup-container',
            maxWidth: 300,
            minWidth: 200,
            offset: [0, -20]
          };
          
          marker.bindPopup(popupContent, popupOptions);
          
          // Add click handler
          marker.on('click', () => {
            marker.openPopup();
          });
          
          // Add to cluster group or marker layer
          if (clusterGroup) {
            clusterGroup.addLayer(marker);
          } else if (markersLayer) {
            markersLayer.addLayer(marker);
          }
        }
      } catch (error) {
        console.error(`Error creating marker for plaque ${plaque.id}:`, error);
      }
    });
    
    // Focus on selected plaque or fit all markers
    if (selectedPlaqueId && !maintainView) {
      const selectedPlaque = plaques.find(p => p.id === selectedPlaqueId);
      if (selectedPlaque && selectedPlaque.latitude && selectedPlaque.longitude) {
        const lat = parseFloat(selectedPlaque.latitude);
        const lng = parseFloat(selectedPlaque.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], 15, { animate: true });
        }
      }
    } else if (plaques.length > 0 && !maintainView) {
      // Fit bounds to show all markers if no specific one is selected
      const validPlaques = plaques.filter(p => p.latitude && p.longitude);
      
      if (validPlaques.length > 0) {
        try {
          const latLngs = validPlaques.map(p => [
            parseFloat(p.latitude), 
            parseFloat(p.longitude)
          ]);
          
          // Create bounds from points - handle with try/catch for safety
          try {
            const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
            
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (error) {
        console.warn("Non-critical error fitting to route bounds:", error);
      }
      
      // Add total distance summary
      const totalDistance = calculateRouteDistance(pointsForRoute);
      
      // Store reference and update state
      routeLineRef.current = routeGroup;
      
      // Refresh the markers to ensure route markers show up correctly
      setTimeout(() => {
        addMapMarkers();
        setIsDrawingRoute(false);
      }, 100);
      
      return { routeGroup, totalDistance };
    } catch (error) {
      console.error("Error drawing simple route:", error);
      setIsDrawingRoute(false);
      
      // Ensure we don't leave hanging references
      if (routeLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Notify user of error
      toast.error("Couldn't draw the complete route. Using simplified view.");
      
      return null;
    }
  }, [calculateDistance, formatDistance, addMapMarkers]);
  
  // Handle clearing route
// Handle clearing route
const handleClearRoute = useCallback(() => {
  if (!mapInstanceRef.current) {
    console.log("Map not available for clearing route");
    return;
  }
  
  // Clear existing route line
  if (routeLineRef.current) {
    mapInstanceRef.current.removeLayer(routeLineRef.current);
    routeLineRef.current = null;
  }
  
  // Reset route state in parent component
  clearRoute();
  
  // Close dialog if open
  setClearRouteDialog(false);
  
  // Refresh markers to reset their appearance
  setTimeout(() => {
    addMapMarkers();
  }, 50);
  
  console.log("Route cleared successfully");
  toast.success("Route cleared");
}, [clearRoute, addMapMarkers]);
  
  // Update markers when dependencies change
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded && !isDrawingRoute) {
      addMapMarkers();
    }
  }, [mapLoaded, plaques, favorites, selectedPlaqueId, isRoutingMode, routePoints, addMapMarkers, isDrawingRoute]);
  
  // Draw route when route points change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !isRoutingMode) return;
    
    if (routePoints.length >= 2) {
      // Don't try to draw a route if we're already drawing one
      if (!isDrawingRoute) {
        // Add a slight delay to prevent race conditions
        const timer = setTimeout(() => {
          drawSimpleRoute(routePoints);
        }, 100);
        return () => clearTimeout(timer);
      }
    } else if (routeLineRef.current) {
      // Clear route line if no points
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  }, [mapLoaded, routePoints, isRoutingMode, drawSimpleRoute, isDrawingRoute]);
  
  // Handle unit preference change
  useEffect(() => {
    // Redraw route with new unit formatting
    if (routePoints.length >= 2 && routeLineRef.current && !isDrawingRoute) {
      const timer = setTimeout(() => {
        drawSimpleRoute(routePoints);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [useImperial, drawSimpleRoute, routePoints, isDrawingRoute]);
  
  // Fixed: Reliable plaque removal from route that doesn't cause flashing
  const handleRemovePlaqueFromRoute = useCallback((plaqueId) => {
    // Prevent removing if we're already in the middle of drawing a route
    if (isDrawingRoute) {
      toast.info("Please wait, route is being updated...");
      return;
    }
    
    setIsDrawingRoute(true); // Set flag to prevent re-renders during update
    
    // First, clear the existing route to prevent ghost lines
    if (routeLineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Update route points in the parent component
    removePlaqueFromRoute(plaqueId);
    
    // We'll let the useEffect for routePoints redraw the route after this update
    // This avoids race conditions between state updates
    
    // Reset the drawing flag after a delay
    setTimeout(() => {
      setIsDrawingRoute(false);
    }, 300);
    
    toast.info("Removed plaque from route");
  }, [removePlaqueFromRoute, isDrawingRoute]);
  
  // Toggle routing mode
  const handleToggleRoutingMode = useCallback(() => {
    const newRoutingMode = !isRoutingMode;
    
    if (newRoutingMode) {
      setIsRoutingMode(true);
      setShowRoutePanel(true);
      toast.success("Route planning mode activated");
    } else {
      // If we have a route and exiting routing mode
      if (routePoints.length > 0) {
        setClearRouteDialog(true);
      } else {
        setIsRoutingMode(false);
        setShowRoutePanel(false);
        
        // Clear any route lines
        if (routeLineRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(routeLineRef.current);
          routeLineRef.current = null;
        }
      }
    }
  }, [isRoutingMode, routePoints.length, setIsRoutingMode]);
  
  // Reset map view
  const resetMap = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([51.505, -0.09], 13);
    }
  }, []);

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    drawRouteLine: (pointsForRoute) => {
      return drawSimpleRoute(pointsForRoute);
    },
    
    clearRoute: () => {
      handleClearRoute();
    },
    
    findUserLocation: () => {
      findUserLocation();
    },
    
    fitToMarkers: () => {
      if (!mapInstanceRef.current || !window.L) return;
      
      const validPlaques = plaques.filter(p => p.latitude && p.longitude);
      
      if (validPlaques.length > 0) {
        try {
          const latLngs = validPlaques.map(p => [
            parseFloat(p.latitude), 
            parseFloat(p.longitude)
          ]);
          
          const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
          
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
        } catch (e) {
          console.warn("Non-critical error fitting to markers:", e);
          // Fallback to fixed view
          mapInstanceRef.current.setView([51.505, -0.09], 13);
        }
      }
    },
    
    fitRoute: (routePointsToFit) => {
      if (!mapInstanceRef.current || !window.L || routePointsToFit.length < 2) return;
      
      try {
        const latLngs = routePointsToFit
          .filter(p => p.latitude && p.longitude)
          .map(p => [
            parseFloat(p.latitude),
            parseFloat(p.longitude)
          ]);
        
        if (latLngs.length >= 2) {
          const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } catch (error) {
        console.warn("Non-critical error fitting to route:", error);
      }
    }
  }));
  
  // Route Builder Panel Component
  const RoutePanel = () => {
    const totalDistance = calculateRouteDistance(routePoints);
    
    return (
      <div className="route-panel-container absolute right-4 top-20 z-50 bg-white rounded-lg shadow-lg p-3 w-72 max-h-[70vh] overflow-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium flex items-center gap-1.5 text-green-800">
            <RouteIcon size={16} />
            Route Builder ({routePoints.length} stops)
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={() => setShowRoutePanel(false)}
          >
            <X size={14} />
          </Button>
        </div>
        
        {/* Route stats with unit toggle */}
        <div className="bg-green-50 p-2 rounded-md mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-green-700">
              <div className="font-medium">Distance: {formatDistance(totalDistance)}</div>
              <div>Walking time: ~{calculateWalkingTime(totalDistance)}</div>
            </div>
            
            {/* Units toggle */}
            <div className="flex items-center gap-1 text-xs">
              <span className={!useImperial ? "font-medium" : ""}>km</span>
              <Switch 
                checked={useImperial}
                onCheckedChange={setUseImperial}
                size="sm"
              />
              <span className={useImperial ? "font-medium" : ""}>mi</span>
            </div>
          </div>
          
          {/* Optimize button */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs bg-white w-full mt-1"
            onClick={() => {
              if (routePoints.length < 3) {
                toast.info("Need at least 3 stops to optimize");
                return;
              }
              
              // Simple optimization: keep first and last, sort middle by ID
              const start = routePoints[0];
              const end = routePoints[routePoints.length - 1];
              const middle = [...routePoints.slice(1, -1)].sort((a, b) => a.id - b.id);
              const optimized = [start, ...middle, end];
              
              // Update route points through parent
              // The useEffect will handle redrawing
              const updatedRoutePoints = [...optimized]; 
              clearRoute();
              
              // Add new points after a short delay
              setTimeout(() => {
                updatedRoutePoints.forEach(point => {
                  addPlaqueToRoute(point);
                });
                toast.success("Route optimized");
              }, 200);
            }}
            disabled={routePoints.length < 3 || isDrawingRoute}
          >
            Optimize Route
          </Button>
        </div>
        
        {/* Route stops list */}
        <div className="space-y-2 my-3">
          {routePoints.length === 0 ? (
            <div className="text-center text-sm text-gray-500 p-4">
              Click on plaques to add them to your route
            </div>
          ) : (
            routePoints.map((point, index) => (
              <div key={point.id} className="flex items-center gap-2 p-2 border rounded-md route-point">
                <Badge className={`h-6 w-6 flex-shrink-0 items-center justify-center p-0 ${
                  index === 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : 
                  index === routePoints.length - 1 ? "bg-red-100 text-red-800 hover:bg-red-200" :
                  "bg-green-100 text-green-800 hover:bg-green-200"
                }`}>
                  {index === 0 ? "S" : index === routePoints.length - 1 ? "E" : index + 1}
                </Badge>
                <div className="flex-grow truncate text-sm">{point.title}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" 
                  onClick={() => handleRemovePlaqueFromRoute(point.id)}
                  disabled={isDrawingRoute}
                >
                  <Trash size={14} />
                </Button>
              </div>
            ))
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setClearRouteDialog(true)}
            disabled={routePoints.length === 0 || isDrawingRoute}
          >
            <Trash size={14} className="mr-1" />
            Clear Route
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              // Export route functionality placeholder
              toast.success("Route exported");
            }}
            disabled={routePoints.length < 2 || isDrawingRoute}
          >
            <Download size={14} className="mr-1" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              // Save route functionality placeholder
              toast.success("Route saved");
            }}
            disabled={routePoints.length < 2 || isDrawingRoute}
          >
            <Save size={14} className="mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-md map-container"
        style={{ minHeight: '400px', height: '500px' }}
      />
      
      {/* Map overlay for loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-medium text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Loading overlay during route drawing */}
      {isDrawingRoute && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-40 rounded-lg pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="h-5 w-5 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-sm text-gray-700">Updating route...</p>
          </div>
        </div>
      )}
      
      {/* Route planning indicator when active */}
      {isRoutingMode && mapLoaded && (
        <div className="absolute top-16 left-4 route-planning-indicator">
          Route Planning Mode Active
        </div>
      )}
      
      {/* Search location button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <Button 
          variant="default" 
          size="sm" 
          className="h-9 shadow-md flex items-center gap-2 px-4 bg-white text-gray-700 border-0 hover:bg-gray-50"
          onClick={() => setShowLocationSearch(true)}
        >
          <Search size={16} />
          <span>Search location</span>
          <MapPin size={16} className="text-gray-400" />
        </Button>
      </div>
      
      {/* Map controls with tooltips */}
      <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-md p-2 map-controls">
        <div className="flex flex-col gap-2">
          {/* Location Button */}
          <div className="relative group">
            <Button 
              variant={userLocation ? "outline" : "default"}
              size="sm" 
              className={`h-10 w-10 p-0 ${isLoadingLocation ? 'bg-blue-50' : ''}`}
              onClick={findUserLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
              ) : (
                <Navigation size={18} className={userLocation ? 'text-blue-600' : ''} />
              )}
            </Button>
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
              Find my location
            </div>
          </div>
          
          {/* Filter Button */}
          <div className="relative group">
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-10 w-10 p-0 relative ${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} className={showFilters ? 'text-blue-600' : ''} />
              {userLocation && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
              )}
            </Button>
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
              Distance filter{!userLocation ? " (find location first)" : ""}
            </div>
          </div>
          
          {/* Route Button */}
          <div className="relative group">
            <Button 
              variant={isRoutingMode ? "default" : "outline"}
              size="sm" 
              className={`h-10 w-10 p-0 relative ${isRoutingMode ? 'bg-green-600 text-white' : ''}`}
              onClick={handleToggleRoutingMode}
              disabled={isDrawingRoute}
            >
              <RouteIcon size={18} />
              {isRoutingMode && routePoints.length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center bg-green-500 rounded-full text-white text-xs">
                  {routePoints.length}
                </span>
              )}
            </Button>
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
              {isRoutingMode ? "Exit route planning" : "Plan a route"}
            </div>
          </div>
          
          {/* Reset Button */}
          <div className="relative group">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0"
              onClick={resetMap}
            >
              <Map size={18} />
            </Button>
            <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
              Reset map view
            </div>
          </div>
        </div>
      </div>
      
      {/* Route Builder Panel */}
      {isRoutingMode && showRoutePanel && (
        <RoutePanel />
      )}
      
      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          maxDistance={3}
          setMaxDistance={() => {}}
          filteredPlaquesCount={0}
          applyFilter={() => {}}
          closeFilters={() => setShowFilters(false)}
          resetFilters={() => {}}
          hasUserLocation={!!userLocation}
        />
      )}
      
      {/* Location Search Panel */}
      {showLocationSearch && (
        <LocationSearchPanel
          onSearch={() => {}}
          onClose={() => setShowLocationSearch(false)}
          isLoading={false}
        />
      )}

      {/* Clear Route Dialog */}
      <AlertDialog open={clearRouteDialog} onOpenChange={setClearRouteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear the current route? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearRoute}
              className="bg-red-500 hover:bg-red-600"
            >
              Clear Route
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Map attribution */}
      <div className="absolute bottom-1 right-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
      </div>
    </div>
  );
});

export default PlaqueMap;50, 50] });
            }
          } catch (boundError) {
            console.warn("Non-critical error fitting bounds:", boundError);
            // Fallback to center on first valid plaque
            if (latLngs.length > 0) {
              map.setView(latLngs[0], 13);
            }
          }
        } catch (e) {
          console.warn("Non-critical error processing coordinates:", e);
        }
      }
    }
    
    console.log("Markers added successfully");
  }, [plaques, favorites, selectedPlaqueId, maintainView, isRoutingMode, routePoints, onPlaqueClick, addPlaqueToRoute, removePlaqueFromRoute, isDrawingRoute]);
  
  // Find user's location
  const findUserLocation = useCallback(() => {
    if (!mapInstanceRef.current || !window.L) {
      console.log("Map or Leaflet not available for location");
      return;
    }
    
    setIsLoadingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const map = mapInstanceRef.current;
          
          // Add user location marker
          const userMarker = window.L.marker([latitude, longitude], {
            icon: window.L.divIcon({
              className: 'user-location-marker',
              html: `
                <div class="user-location-pulse-container">
                  <div class="user-location-pulse"></div>
                  <div class="user-location-dot"></div>
                </div>
              `,
              iconSize: [0, 0],
            })
          }).addTo(map);
          
          // Pan to location
          map.setView([latitude, longitude], 15, {
            animate: true
          });
          
          setUserLocation([latitude, longitude]);
          setIsLoadingLocation(false);
          toast.success("Location found!");
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          toast.error("Could not find your location. Please check your browser permissions.");
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  }, []);
  
  // Draw a simplified route line with fallback for API errors
  const drawSimpleRoute = useCallback((pointsForRoute) => {
    if (!mapInstanceRef.current || !window.L || pointsForRoute.length < 2) {
      console.log("Cannot draw route: Map not loaded or insufficient points");
      return null;
    }
    
    // Set drawing state to prevent re-renders during operation
    setIsDrawingRoute(true);
    
    try {
      const map = mapInstanceRef.current;
      
      // Clear any existing route
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Filter valid points
      const validPoints = pointsForRoute
        .filter(p => p.latitude && p.longitude)
        .map(p => [
          parseFloat(p.latitude),
          parseFloat(p.longitude)
        ])
        .filter(coords => !isNaN(coords[0]) && !isNaN(coords[1]));
      
      if (validPoints.length < 2) {
        console.warn("Not enough valid points to draw route");
        setIsDrawingRoute(false);
        return null;
      }
      
      // Create route group
      const routeGroup = window.L.featureGroup().addTo(map);
      
      // Draw line segments between consecutive points
      for (let i = 0; i < validPoints.length - 1; i++) {
        const startPoint = validPoints[i];
        const endPoint = validPoints[i + 1];
        
        // Draw route segment
        const routeSegment = window.L.polyline([startPoint, endPoint], {
          color: '#10b981', // green
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '10, 10',
          className: 'animated-dash'
        }).addTo(routeGroup);
        
        // Calculate segment distance
        const segmentDistance = calculateDistance(
          startPoint[0], 
          startPoint[1], 
          endPoint[0], 
          endPoint[1]
        );
        
        // Add distance label at midpoint
        const midPoint = [
          (startPoint[0] + endPoint[0]) / 2,
          (startPoint[1] + endPoint[1]) / 2
        ];
        
        window.L.marker(midPoint, {
          icon: window.L.divIcon({
            className: 'distance-label',
            html: `
              <div class="route-distance-label">
                ${formatDistance(segmentDistance)}
              </div>
            `,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
          })
        }).addTo(routeGroup);
      }
      
      // Fit to route bounds
// Continuation of PlaqueMap component code

try {
  const bounds = window.L.latLngBounds(validPoints);
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }
} catch (error) {
  console.warn("Non-critical error fitting to route bounds:", error);
}

// Add total distance summary
const totalDistance = calculateRouteDistance(pointsForRoute);

// Store reference and update state
routeLineRef.current = routeGroup;

// Refresh the markers to ensure route markers show up correctly
setTimeout(() => {
  addMapMarkers();
  setIsDrawingRoute(false);
}, 100);

return { routeGroup, totalDistance };
} catch (error) {
console.error("Error drawing simple route:", error);
setIsDrawingRoute(false);

// Ensure we don't leave hanging references
if (routeLineRef.current && mapInstanceRef.current) {
  mapInstanceRef.current.removeLayer(routeLineRef.current);
  routeLineRef.current = null;
}

// Notify user of error
toast.error("Couldn't draw the complete route. Using simplified view.");

return null;
}
}, [calculateDistance, formatDistance, addMapMarkers]);

// Handle clearing route
const handleClearRoute = useCallback(() => {
if (!mapInstanceRef.current) {
console.log("Map not available for clearing route");
return;
}

// Clear existing route line
if (routeLineRef.current) {
mapInstanceRef.current.removeLayer(routeLineRef.current);
routeLineRef.current = null;
}

// Reset route state in parent component
clearRoute();

// Close dialog if open
setClearRouteDialog(false);

// Refresh markers to reset their appearance
setTimeout(() => {
addMapMarkers();
}, 50);

console.log("Route cleared successfully");
toast.success("Route cleared");
}, [clearRoute, addMapMarkers]);

// Update markers when dependencies change
useEffect(() => {
if (mapInstanceRef.current && mapLoaded && !isDrawingRoute) {
addMapMarkers();
}
}, [mapLoaded, plaques, favorites, selectedPlaqueId, isRoutingMode, routePoints, addMapMarkers, isDrawingRoute]);

// Draw route when route points change
useEffect(() => {
if (!mapInstanceRef.current || !mapLoaded || !isRoutingMode) return;

if (routePoints.length >= 2) {
// Don't try to draw a route if we're already drawing one
if (!isDrawingRoute) {
  // Add a slight delay to prevent race conditions
  const timer = setTimeout(() => {
    drawSimpleRoute(routePoints);
  }, 100);
  return () => clearTimeout(timer);
}
} else if (routeLineRef.current) {
// Clear route line if no points
mapInstanceRef.current.removeLayer(routeLineRef.current);
routeLineRef.current = null;
}
}, [mapLoaded, routePoints, isRoutingMode, drawSimpleRoute, isDrawingRoute]);

// Handle unit preference change
useEffect(() => {
// Redraw route with new unit formatting
if (routePoints.length >= 2 && routeLineRef.current && !isDrawingRoute) {
const timer = setTimeout(() => {
  drawSimpleRoute(routePoints);
}, 100);
return () => clearTimeout(timer);
}
}, [useImperial, drawSimpleRoute, routePoints, isDrawingRoute]);

// Fixed: Reliable plaque removal from route that doesn't cause flashing
const handleRemovePlaqueFromRoute = useCallback((plaqueId) => {
// Prevent removing if we're already in the middle of drawing a route
if (isDrawingRoute) {
toast.info("Please wait, route is being updated...");
return;
}

setIsDrawingRoute(true); // Set flag to prevent re-renders during update

// First, clear the existing route to prevent ghost lines
if (routeLineRef.current && mapInstanceRef.current) {
mapInstanceRef.current.removeLayer(routeLineRef.current);
routeLineRef.current = null;
}

// Update route points in the parent component
removePlaqueFromRoute(plaqueId);

// We'll let the useEffect for routePoints redraw the route after this update
// This avoids race conditions between state updates

// Reset the drawing flag after a delay
setTimeout(() => {
setIsDrawingRoute(false);
}, 300);

toast.info("Removed plaque from route");
}, [removePlaqueFromRoute, isDrawingRoute]);

// Toggle routing mode
const handleToggleRoutingMode = useCallback(() => {
const newRoutingMode = !isRoutingMode;

if (newRoutingMode) {
setIsRoutingMode(true);
setShowRoutePanel(true);
toast.success("Route planning mode activated");
} else {
// If we have a route and exiting routing mode
if (routePoints.length > 0) {
  setClearRouteDialog(true);
} else {
  setIsRoutingMode(false);
  setShowRoutePanel(false);
  
  // Clear any route lines
  if (routeLineRef.current && mapInstanceRef.current) {
    mapInstanceRef.current.removeLayer(routeLineRef.current);
    routeLineRef.current = null;
  }
}
}
}, [isRoutingMode, routePoints.length, setIsRoutingMode]);

// Reset map view
const resetMap = useCallback(() => {
if (mapInstanceRef.current) {
mapInstanceRef.current.setView([51.505, -0.09], 13);
}
}, []);

// Expose methods to parent component
React.useImperativeHandle(ref, () => ({
drawRouteLine: (pointsForRoute) => {
return drawSimpleRoute(pointsForRoute);
},

clearRoute: () => {
handleClearRoute();
},

findUserLocation: () => {
findUserLocation();
},

fitToMarkers: () => {
if (!mapInstanceRef.current || !window.L) return;

const validPlaques = plaques.filter(p => p.latitude && p.longitude);

if (validPlaques.length > 0) {
  try {
    const latLngs = validPlaques.map(p => [
      parseFloat(p.latitude), 
      parseFloat(p.longitude)
    ]);
    
    const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
    
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  } catch (e) {
    console.warn("Non-critical error fitting to markers:", e);
    // Fallback to fixed view
    mapInstanceRef.current.setView([51.505, -0.09], 13);
  }
}
},

fitRoute: (routePointsToFit) => {
if (!mapInstanceRef.current || !window.L || routePointsToFit.length < 2) return;

try {
  const latLngs = routePointsToFit
    .filter(p => p.latitude && p.longitude)
    .map(p => [
      parseFloat(p.latitude),
      parseFloat(p.longitude)
    ]);
  
  if (latLngs.length >= 2) {
    const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }
} catch (error) {
  console.warn("Non-critical error fitting to route:", error);
}
}
}));

// Route Builder Panel Component
const RoutePanel = () => {
const totalDistance = calculateRouteDistance(routePoints);

return (
<div className="route-panel-container absolute right-4 top-20 z-50 bg-white rounded-lg shadow-lg p-3 w-72 max-h-[70vh] overflow-auto">
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-sm font-medium flex items-center gap-1.5 text-green-800">
      <RouteIcon size={16} />
      Route Builder ({routePoints.length} stops)
    </h3>
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-7 w-7 p-0" 
      onClick={() => setShowRoutePanel(false)}
    >
      <X size={14} />
    </Button>
  </div>
  
  {/* Route stats with unit toggle */}
  <div className="bg-green-50 p-2 rounded-md mb-3">
    <div className="flex justify-between items-center mb-2">
      <div className="text-xs text-green-700">
        <div className="font-medium">Distance: {formatDistance(totalDistance)}</div>
        <div>Walking time: ~{calculateWalkingTime(totalDistance)}</div>
      </div>
      
      {/* Units toggle */}
      <div className="flex items-center gap-1 text-xs">
        <span className={!useImperial ? "font-medium" : ""}>km</span>
        <Switch 
          checked={useImperial}
          onCheckedChange={setUseImperial}
          size="sm"
        />
        <span className={useImperial ? "font-medium" : ""}>mi</span>
      </div>
    </div>
    
    {/* Optimize button */}
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs bg-white w-full mt-1"
      onClick={() => {
        if (routePoints.length < 3) {
          toast.info("Need at least 3 stops to optimize");
          return;
        }
        
        // Simple optimization: keep first and last, sort middle by ID
        const start = routePoints[0];
        const end = routePoints[routePoints.length - 1];
        const middle = [...routePoints.slice(1, -1)].sort((a, b) => a.id - b.id);
        const optimized = [start, ...middle, end];
        
        // Update route points through parent
        // The useEffect will handle redrawing
        const updatedRoutePoints = [...optimized]; 
        clearRoute();
        
        // Add new points after a short delay
        setTimeout(() => {
          updatedRoutePoints.forEach(point => {
            addPlaqueToRoute(point);
          });
          toast.success("Route optimized");
        }, 200);
      }}
      disabled={routePoints.length < 3 || isDrawingRoute}
    >
      Optimize Route
    </Button>
  </div>
  
  {/* Route stops list */}
  <div className="space-y-2 my-3">
    {routePoints.length === 0 ? (
      <div className="text-center text-sm text-gray-500 p-4">
        Click on plaques to add them to your route
      </div>
    ) : (
      routePoints.map((point, index) => (
        <div key={point.id} className="flex items-center gap-2 p-2 border rounded-md route-point">
          <Badge className={`h-6 w-6 flex-shrink-0 items-center justify-center p-0 ${
            index === 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : 
            index === routePoints.length - 1 ? "bg-red-100 text-red-800 hover:bg-red-200" :
            "bg-green-100 text-green-800 hover:bg-green-200"
          }`}>
            {index === 0 ? "S" : index === routePoints.length - 1 ? "E" : index + 1}
          </Badge>
          <div className="flex-grow truncate text-sm">{point.title}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" 
            onClick={() => handleRemovePlaqueFromRoute(point.id)}
            disabled={isDrawingRoute}
          >
            <Trash size={14} />
          </Button>
        </div>
      ))
    )}
  </div>
  
  {/* Actions */}
  <div className="flex gap-2 mt-4">
    <Button 
      variant="outline" 
      size="sm" 
      className="flex-1"
      onClick={() => setClearRouteDialog(true)}
      disabled={routePoints.length === 0 || isDrawingRoute}
    >
      <Trash size={14} className="mr-1" />
      Clear Route
    </Button>
    <Button 
      variant="outline" 
      size="sm" 
      className="flex-1"
      onClick={() => {
        // Export route functionality placeholder
        toast.success("Route exported");
      }}
      disabled={routePoints.length < 2 || isDrawingRoute}
    >
      <Download size={14} className="mr-1" />
      Export
    </Button>
    <Button 
      variant="outline" 
      size="sm" 
      className="flex-1"
      onClick={() => {
        // Save route functionality placeholder
        toast.success("Route saved");
      }}
      disabled={routePoints.length < 2 || isDrawingRoute}
    >
      <Save size={14} className="mr-1" />
      Save
    </Button>
  </div>
</div>
);
};

return (
<div className={`relative ${className}`}>
{/* Map container */}
<div 
  ref={mapContainerRef} 
  className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-md map-container"
  style={{ minHeight: '400px', height: '500px' }}
/>

{/* Map overlay for loading state */}
{!mapLoaded && (
  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-medium text-gray-600">Loading map...</p>
    </div>
  </div>
)}

{/* Loading overlay during route drawing */}
{isDrawingRoute && (
  <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-40 rounded-lg pointer-events-none">
    <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
      <div className="h-5 w-5 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-medium text-sm text-gray-700">Updating route...</p>
    </div>
  </div>
)}

{/* Route planning indicator when active */}
{isRoutingMode && mapLoaded && (
  <div className="absolute top-16 left-4 route-planning-indicator">
    Route Planning Mode Active
  </div>
)}

{/* Search location button */}
<div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
  <Button 
    variant="default" 
    size="sm" 
    className="h-9 shadow-md flex items-center gap-2 px-4 bg-white text-gray-700 border-0 hover:bg-gray-50"
    onClick={() => setShowLocationSearch(true)}
  >
    <Search size={16} />
    <span>Search location</span>
    <MapPin size={16} className="text-gray-400" />
  </Button>
</div>

{/* Map controls with tooltips */}
<div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-md p-2 map-controls">
  <div className="flex flex-col gap-2">
    {/* Location Button */}
    <div className="relative group">
      <Button 
        variant={userLocation ? "outline" : "default"}
        size="sm" 
        className={`h-10 w-10 p-0 ${isLoadingLocation ? 'bg-blue-50' : ''}`}
        onClick={findUserLocation}
        disabled={isLoadingLocation}
      >
        {isLoadingLocation ? (
          <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-600 animate-spin"></div>
        ) : (
          <Navigation size={18} className={userLocation ? 'text-blue-600' : ''} />
        )}
      </Button>
      <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
        Find my location
      </div>
    </div>
    
    {/* Filter Button */}
    <div className="relative group">
      <Button 
        variant="outline" 
        size="sm" 
        className={`h-10 w-10 p-0 relative ${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter size={18} className={showFilters ? 'text-blue-600' : ''} />
        {userLocation && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
        )}
      </Button>
      <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
        Distance filter{!userLocation ? " (find location first)" : ""}
      </div>
    </div>
    
    {/* Route Button */}
    <div className="relative group">
      <Button 
        variant={isRoutingMode ? "default" : "outline"}
        size="sm" 
        className={`h-10 w-10 p-0 relative ${isRoutingMode ? 'bg-green-600 text-white' : ''}`}
        onClick={handleToggleRoutingMode}
        disabled={isDrawingRoute}
      >
        <RouteIcon size={18} />
        {isRoutingMode && routePoints.length > 0 && (
          <span className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center bg-green-500 rounded-full text-white text-xs">
            {routePoints.length}
          </span>
        )}
      </Button>
      <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
        {isRoutingMode ? "Exit route planning" : "Plan a route"}
      </div>
    </div>
    
    {/* Reset Button */}
    <div className="relative group">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-10 w-10 p-0"
        onClick={resetMap}
      >
        <Map size={18} />
      </Button>
      <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap">
        Reset map view
      </div>
    </div>
  </div>
</div>

{/* Route Builder Panel */}
{isRoutingMode && showRoutePanel && (
  <RoutePanel />
)}

{/* Filter Panel */}
{showFilters && (
  <FilterPanel
    maxDistance={3}
    setMaxDistance={() => {}}
    filteredPlaquesCount={0}
    applyFilter={() => {}}
    closeFilters={() => setShowFilters(false)}
    resetFilters={() => {}}
    hasUserLocation={!!userLocation}
  />
)}

{/* Location Search Panel */}
{showLocationSearch && (
  <LocationSearchPanel
    onSearch={() => {}}
    onClose={() => setShowLocationSearch(false)}
    isLoading={false}
  />
)}

{/* Clear Route Dialog */}
<AlertDialog open={clearRouteDialog} onOpenChange={setClearRouteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Clear Route</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to clear the current route? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleClearRoute}
        className="bg-red-500 hover:bg-red-600"
      >
        Clear Route
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* Map attribution */}
<div className="absolute bottom-1 right-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
  © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
</div>
</div>
);
});

export default PlaqueMap;