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
  Trash 
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateRouteDistance } from './utils/routeUtils';

// Improved version of the PlaqueMap component with routing functionality
const PlaqueMap = React.forwardRef(({
  plaques = [],
  onPlaqueClick = () => {},
  favorites = [],
  selectedPlaqueId = null,
  maintainView = false,
  className = '',
  isRoutingMode = false,
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
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeLine, setRouteLine] = useState(null);
  
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

    // Add custom styles to ensure markers display correctly
    const customStyles = document.createElement('style');
    customStyles.textContent = `
      .leaflet-container {
        width: 100%;
        height: 100%;
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      
      .leaflet-div-icon {
        background: transparent;
        border: none;
      }
      
      .custom-marker {
        background: transparent !important;
        border: none !important;
      }
      
      .leaflet-marker-icon {
        transition: transform 0.2s ease;
      }
      
      /* Fix for flashing icons and z-index issues */
      .leaflet-map-pane {
        z-index: 100 !important;
      }
      
      .leaflet-tile-pane {
        z-index: 200 !important;
      }
      
      .leaflet-marker-pane {
        z-index: 600 !important;
      }
      
      .leaflet-marker-icon {
        z-index: 650 !important;
      }
      
      .leaflet-popup-pane {
        z-index: 700 !important;
      }
      
      .leaflet-overlay-pane {
        z-index: 400 !important;
      }
      
      .leaflet-shadow-pane {
        z-index: 500 !important;
      }
      
      /* Make popups appear above map controls */
      .leaflet-popup {
        z-index: 999 !important;
      }
      
      .leaflet-popup-content-wrapper {
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
      }
      
      /* Marker cluster styling */
      .marker-cluster {
        background-color: rgba(59, 130, 246, 0.6);
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .marker-cluster div {
        background-color: rgba(59, 130, 246, 0.8);
        color: white;
        font-weight: bold;
      }
      
      /* Ensure map controls are visible and styled properly */
      .leaflet-control {
        clear: both;
        z-index: 800 !important;
      }
      
      .leaflet-control-container {
        z-index: 900 !important;
      }
      
      /* Animation for user location pulse */
      @keyframes pulse {
        0% {
          transform: scale(0.8);
          opacity: 0.7;
        }
        70% {
          transform: scale(1.5);
          opacity: 0;
        }
        100% {
          transform: scale(0.8);
          opacity: 0;
        }
      }
      
      /* Route line animation */
      @keyframes dash {
        to {
          stroke-dashoffset: -1000;
        }
      }
      
      .animated-dash {
        animation: dash 30s linear infinite;
      }
    `;
    document.head.appendChild(customStyles);

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
    
    // CRITICAL FIX: Check if map is already initialized
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
                <div style="
                  width: ${size}px;
                  height: ${size}px;
                  background-color: white;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                ">
                  <div style="
                    width: calc(100% - 4px);
                    height: calc(100% - 4px);
                    border-radius: 50%;
                    background-color: #3b82f6;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                  ">
                    ${count}
                  </div>
                </div>
              `,
              className: 'custom-cluster',
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
  
  // Add markers to the map
  const addMapMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.L) {
      console.log("Map or Leaflet not available for adding markers");
      return;
    }
    
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const clusterGroup = clusterGroupRef.current;
    
    // Clear existing markers
    if (markersLayer) {
      markersLayer.clearLayers();
    }
    
    if (clusterGroup) {
      clusterGroup.clearLayers();
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
        const isInRoute = routePoints.some(p => p.id === plaque.id);
        
        // Create marker with custom icon
        const isFavorite = favorites.includes(plaque.id);
        const isSelected = plaque.id === selectedPlaqueId;
        const size = isSelected ? 42 : 36;
        
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="${isSelected ? 'transform: scale(1.2);' : ''} transition: transform 0.2s ease;">
              <div style="
                width: ${size}px;
                height: ${size}px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                border: ${isInRoute ? '2px solid #10b981' : isFavorite ? '2px solid #f59e0b' : '2px solid white'};
                padding: 2px;
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
                  ${isInRoute ? 
                    `<div style="font-weight: bold; font-size: 12px;">${routePoints.findIndex(p => p.id === plaque.id) + 1}</div>` :
                    plaque.visited ? 
                      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
                      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
                  }
                </div>
              </div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });
        
        const marker = window.L.marker([lat, lng], { icon });
        
        // Create popup
        const popupContent = document.createElement('div');
        popupContent.className = 'plaque-popup p-3';
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
            ${isInRoute ? `<div class="text-xs text-green-600 mt-1">• Stop #${routePoints.findIndex(p => p.id === plaque.id) + 1} in route</div>` : ''}
            <div class="flex gap-2 mt-3">
              <button class="view-details py-1.5 px-3 bg-blue-500 text-white text-xs rounded-full flex-grow hover:bg-blue-600 transition-colors">
                View Details
              </button>
              ${isRoutingMode ? (
                isInRoute ? `
                  <button class="remove-from-route py-1.5 px-3 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors">
                    Remove from Route
                  </button>
                ` : `
                  <button class="add-to-route py-1.5 px-3 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors">
                    Add to Route
                  </button>
                `
              ) : ''}
            </div>
          </div>
        `;
        
        // Add event listeners to buttons
        setTimeout(() => {
          const detailButton = popupContent.querySelector('.view-details');
          if (detailButton) {
            detailButton.addEventListener('click', () => {
              marker.closePopup(); // Close popup first to prevent z-index issues
              setTimeout(() => {
                onPlaqueClick(plaque);
              }, 50); // Small delay to ensure popup is closed before action
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
          
          // Remove from route button click handler
          const removeRouteButton = popupContent.querySelector('.remove-from-route');
          if (removeRouteButton) {
            removeRouteButton.addEventListener('click', () => {
              removePlaqueFromRoute(plaque.id);
              marker.closePopup();
            });
          }
        }, 0);
        
        // Configure popup options
        const popupOptions = {
          closeButton: true,
          autoClose: true,
          className: 'plaque-popup-container',
          maxWidth: 300,
          minWidth: 200,
          offset: [0, -20]
        };
        
        // Bind popup to marker
        marker.bindPopup(popupContent, popupOptions);
        
        // Add click handler
        marker.on('click', () => {
          marker.openPopup();
        });
        
        // Add marker to the appropriate layer
        if (clusterGroup) {
          clusterGroup.addLayer(marker);
        } else if (markersLayer) {
          markersLayer.addLayer(marker);
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
          
          // Create bounds from points
          const bounds = window.L.latLngBounds(latLngs.map(coords => window.L.latLng(coords[0], coords[1])));
          
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      }
    }
    
    console.log("Markers added successfully");
  }, [plaques, favorites, selectedPlaqueId, maintainView, isRoutingMode, routePoints, onPlaqueClick, addPlaqueToRoute, removePlaqueFromRoute]);
  
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
                <div style="position: relative; width: 100%; height: 100%;">
                  <div style="position: absolute; top: -14px; left: -14px; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.3); animation: pulse 1.5s infinite;"></div>
                  <div style="position: absolute; top: -8px; left: -8px; width: 16px; height: 16px; border-radius: 50%; background-color: #3b82f6; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);"></div>
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
  
  // Draw route line on the map
  const drawRouteLine = useCallback((pointsForRoute) => {
    if (!mapInstanceRef.current || !window.L || pointsForRoute.length < 2) {
      console.log("Cannot draw route: Map not loaded or insufficient points");
      return null;
    }
    
    const map = mapInstanceRef.current;
    
    // Clear existing route line
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Get coordinates for each point
    const latLngs = pointsForRoute
      .filter(p => p.latitude && p.longitude)
      .map(p => [
        parseFloat(p.latitude),
        parseFloat(p.longitude)
      ]);
    
    if (latLngs.length < 2) {
      console.log("Not enough valid coordinates to draw route");
      return null;
    }
    
    // Create route group to contain all route elements
    const routeGroup = window.L.layerGroup();
    
    // Create polyline with animated dash effect
    const routePolyline = window.L.polyline(latLngs, {
      color: '#10b981', // green-500
      weight: 4,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '10, 10',
      className: 'animated-dash'
    });
    
    routeGroup.addLayer(routePolyline);
    
    // Add route markers
    pointsForRoute.forEach((point, index) => {
      if (!point.latitude || !point.longitude) return;
      
      const lat = parseFloat(point.latitude);
      const lng = parseFloat(point.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      // Create custom marker icon showing route order
      const markerColor = index === 0 ? '#3b82f6' : // Start point (blue)
                         index === pointsForRoute.length - 1 ? '#ef4444' : // End point (red)
                         '#10b981'; // Waypoints (green)
      
      const markerLabel = index === 0 ? 'S' : 
                          index === pointsForRoute.length - 1 ? 'E' : 
                          (index + 1).toString();
      
      const routeMarker = window.L.marker([lat, lng], {
        icon: window.L.divIcon({
          className: 'route-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: ${markerColor};
              color: white;
              border-radius: 50%;
              font-weight: bold;
              font-size: 12px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${markerLabel}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      });
      
      routeGroup.addLayer(routeMarker);
      
      // Add popup with route stop information
      routeMarker.bindPopup(`
        <div class="p-2">
          <strong class="text-sm">Stop #${index + 1}</strong>
          <div class="text-xs mt-1">${point.title}</div>
          ${index > 0 ? `
            <div class="text-xs text-gray-500 mt-1">
              Distance from previous: ${calculateDistance(
                parseFloat(pointsForRoute[index-1].latitude),
                parseFloat(pointsForRoute[index-1].longitude),
                lat,
                lng
              ).toFixed(2)} km
            </div>
          ` : ''}
        </div>
      `);
    });
    
    // Add distance labels along the route
    for (let i = 0; i < latLngs.length - 1; i++) {
      const midPoint = [
        (latLngs[i][0] + latLngs[i+1][0]) / 2,
        (latLngs[i][1] + latLngs[i+1][1]) / 2
      ];
      
      const distance = calculateDistance(
        latLngs[i][0], latLngs[i][1],
        latLngs[i+1][0], latLngs[i+1][1]
      );
      
      // Only show distance label if it's more than 0.1 km
      if (distance > 0.1) {
        const distanceMarker = window.L.marker(midPoint, {
          icon: window.L.divIcon({
            className: 'distance-label',
            html: `
              <div style="
                padding: 3px 6px;
                background-color: white;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
                color: #10b981;
                border: 1px solid #d1fae5;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
              ">
                ${distance.toFixed(1)} km
              </div>
            `,
            iconSize: [40, 20],
            iconAnchor: [20, 10]
          })
        });
        
        routeGroup.addLayer(distanceMarker);
      }
    }
    
    // Calculate total distance
    const totalDistance = calculateRouteDistance(pointsForRoute);
    
    // Add a label with the total distance
    if (totalDistance > 0) {
      const totalDistanceMarker = window.L.marker(latLngs[Math.floor(latLngs.length/2)], {
        icon: window.L.divIcon({
          className: 'total-distance-label',
          html: `
            <div style="
              padding: 4px 8px;
              background-color: #10b981;
              color: white;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              transform: translateY(-20px);
            ">
              Total: ${totalDistance.toFixed(1)} km
            </div>
          `,
          iconSize: [80, 30],
          iconAnchor: [40, 0]
        })
      });
      
      routeGroup.addLayer(totalDistanceMarker);
    }
    
    // Add the route group to the map
    routeGroup.addTo(map);
    routeLineRef.current = routeGroup;
    
    // Fit map to show entire route
// Fit map to show entire route
const bounds = routePolyline.getBounds();
map.fitBounds(bounds, { 
  padding: [50, 50],
  maxZoom: 15
});

return routeGroup;
}, []);

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

// Update markers when plaques or selection changes
useEffect(() => {
if (mapInstanceRef.current && mapLoaded) {
  addMapMarkers();
}
}, [mapLoaded, plaques, favorites, selectedPlaqueId, isRoutingMode, routePoints, addMapMarkers]);

// Draw route when route points change
useEffect(() => {
if (mapInstanceRef.current && mapLoaded && routePoints.length >= 2 && isRoutingMode) {
  drawRouteLine(routePoints);
} else if (routeLineRef.current && mapInstanceRef.current) {
  // Clear route line if routing mode is disabled or no points
  mapInstanceRef.current.removeLayer(routeLineRef.current);
  routeLineRef.current = null;
}
}, [mapLoaded, routePoints, isRoutingMode, drawRouteLine]);

// Reset map function for development/testing
const resetMap = useCallback(() => {
console.log("Resetting map view");
if (mapInstanceRef.current) {
  mapInstanceRef.current.setView([51.505, -0.09], 13);
}
}, []);

// Expose methods to the parent component through the ref
React.useImperativeHandle(ref, () => ({
drawRouteLine: (pointsForRoute) => {
  return drawRouteLine(pointsForRoute);
},

clearRoute: () => {
  if (routeLineRef.current && mapInstanceRef.current) {
    mapInstanceRef.current.removeLayer(routeLineRef.current);
    routeLineRef.current = null;
  }
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
      console.error("Error fitting bounds:", e);
    }
  }
}
}));

return (
<div className={`relative ${className}`}>
  {/* Map container */}
  <div 
    ref={mapContainerRef} 
    className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-md"
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
  
  {/* Route planning indicator when active */}
  {isRoutingMode && mapLoaded && (
    <div className="absolute top-16 left-4 bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-sm font-medium z-40 shadow-sm border border-green-200">
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
  <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-md p-2">
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
          variant="outline" 
          size="sm" 
          className={`h-10 w-10 p-0 relative ${isRoutingMode ? 'bg-green-50 border-green-200' : ''}`}
          onClick={() => onToggleRoutingMode && onToggleRoutingMode()}
        >
          <RouteIcon size={18} className={isRoutingMode ? 'text-green-600' : ''} />
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
  
  {/* Map attribution */}
  <div className="absolute bottom-1 right-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
    © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
  </div>
</div>
);
});

export default PlaqueMap;