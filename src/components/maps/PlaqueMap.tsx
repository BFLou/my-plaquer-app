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
import { calculateRouteDistance, calculateDistance } from './utils/routeUtils';
import FilterPanel from './controls/FilterPanel';
import LocationSearchPanel from './controls/LocationSearchPanel';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Improved version of the PlaqueMap component with routing functionality
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
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeLine, setRouteLine] = useState(null);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [useImperial, setUseImperial] = useState(false);
  
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

    // Load Leaflet Routing Machine for walking routes
    const routingCSS = document.createElement('link');
    routingCSS.rel = 'stylesheet';
    routingCSS.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
    document.head.appendChild(routingCSS);

    const handleClearRoute = useCallback(() => {
      if (!mapInstanceRef.current || !window.L) {
        console.log("Map not available for clearing route");
        return;
      }
      
      // Clear existing route line
      if (routeLineRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Reset route state in parent component by calling the passed prop
      clearRoute();
      setRouteLine(null);
      
      // Refresh markers to ensure they're not showing route status
      addMapMarkers();
      
      console.log("Route cleared successfully");
    }, [clearRoute, addMapMarkers]);

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
      
      /* Hide the default routing machine itinerary */
      .leaflet-routing-container {
        display: none !important;
      }
      
      /* Custom route line style for walking paths */
      .leaflet-routing-line {
        stroke-dasharray: 5, 10;
        animation: dash 30s linear infinite;
      }
      
      /* Custom route marker styles */
      .route-marker-start {
        background: #3b82f6 !important;
        border: 2px solid white !important;
      }
      
      .route-marker-end {
        background: #ef4444 !important;
        border: 2px solid white !important;
      }
      
      .route-marker-waypoint {
        background: #10b981 !important;
        border: 2px solid white !important;
      }
      
      @keyframes dash {
        to {
          stroke-dashoffset: -1000;
        }
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
        // Load Leaflet Routing Machine after clusters are loaded
        const routingScript = document.createElement('script');
        routingScript.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js';
        
        routingScript.onload = () => {
          console.log("Map libraries loaded successfully");
          initializeMap();
        };
        
        document.head.appendChild(routingScript);
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
        const routeIndex = routePoints.findIndex(p => p.id === plaque.id);
        const isInRoute = routeIndex !== -1;
        
        // Create marker with custom icon
        const isFavorite = favorites.includes(plaque.id);
        const isSelected = plaque.id === selectedPlaqueId;
        const size = isSelected ? 42 : 36;
        
        // Create special marker for route points
        let markerContent = '';
        if (isInRoute) {
          // First point (S), Last point (E), or numbered
          if (routeIndex === 0) {
            markerContent = `<div style="font-weight: bold; font-size: 14px;">S</div>`;
          } else if (routeIndex === routePoints.length - 1) {
            markerContent = `<div style="font-weight: bold; font-size: 14px;">E</div>`;
          } else {
            markerContent = `<div style="font-weight: bold; font-size: 14px;">${routeIndex + 1}</div>`;
          }
        } else {
          markerContent = plaque.visited ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
        }
        
        // Color based on route position
        let markerBgColor = bgColor;
        if (isInRoute) {
          if (routeIndex === 0) {
            markerBgColor = '#3b82f6'; // Start: blue
          } else if (routeIndex === routePoints.length - 1) {
            markerBgColor = '#ef4444'; // End: red
          } else {
            markerBgColor = '#10b981'; // Waypoints: green
          }
        }
        
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
                  background-color: ${markerBgColor};
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
            ${isInRoute ? `<div class="text-xs text-green-600 mt-1">• ${routeIndex === 0 ? 'Start point' : routeIndex === routePoints.length - 1 ? 'End point' : `Stop #${routeIndex + 1}`} in route</div>` : ''}
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
    
  
  // Draw walking route on the map using Leaflet Routing Machine
// Fix for the drawWalkingRoute function in PlaqueMap.jsx
// Replace the existing drawWalkingRoute function with this implementation

// Updated drawWalkingRoute function that uses OSRM to follow actual road networks
const drawWalkingRoute = useCallback(async (pointsForRoute) => {
  if (!mapInstanceRef.current || !window.L || pointsForRoute.length < 2) {
    console.log("Cannot draw route: Map not loaded or insufficient points");
    return null;
  }
  
  const map = mapInstanceRef.current;
  
  // Clear existing route
  if (routeLineRef.current) {
    map.removeLayer(routeLineRef.current);
    routeLineRef.current = null;
  }
  
  // Create a feature group to hold all route elements
  const routeGroup = window.L.featureGroup().addTo(map);
  
  try {
    // Add route markers first
    pointsForRoute.forEach((point, index) => {
      if (!point.latitude || !point.longitude) return;
      
      const lat = parseFloat(point.latitude);
      const lng = parseFloat(point.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      // Create marker icon based on position in route
      let markerColor, markerLabel, markerClass;
      
      if (index === 0) {
        markerLabel = 'S';
        markerColor = '#3b82f6'; // blue for start
        markerClass = 'route-marker-start';
      } else if (index === pointsForRoute.length - 1) {
        markerLabel = 'E';
        markerColor = '#ef4444'; // red for end
        markerClass = 'route-marker-end';
      } else {
        markerLabel = (index + 1).toString();
        markerColor = '#10b981'; // green for waypoints
        markerClass = 'route-marker-waypoint';
      }
      
      const routeMarker = window.L.marker([lat, lng], {
        icon: window.L.divIcon({
          className: `route-marker ${markerClass}`,
          html: `
            <div style="
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: ${markerColor};
              color: white;
              border-radius: 50%;
              font-weight: bold;
              font-size: 14px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${markerLabel}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(routeGroup);
      
      // Add popup with route info
      const popupContent = `
        <div class="p-2">
          <div class="font-medium text-sm">${point.title || 'Route Point'}</div>
          <div class="text-xs text-gray-500 mt-1">
            ${index === 0 ? 'Start point' : 
              index === pointsForRoute.length - 1 ? 'End point' : 
              `Stop #${index + 1}`}
          </div>
        </div>
      `;
      
      routeMarker.bindPopup(popupContent);
    });
    
    // Process route segments using OSRM for walking directions
    let totalDistance = 0;
    const allCoordinates = [];
    
    // Process each route segment
    for (let i = 0; i < pointsForRoute.length - 1; i++) {
      const start = pointsForRoute[i];
      const end = pointsForRoute[i + 1];
      
      if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
      
      const startLat = parseFloat(start.latitude);
      const startLng = parseFloat(start.longitude);
      const endLat = parseFloat(end.latitude);
      const endLng = parseFloat(end.longitude);
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
      
      try {
        // Make a request to the OSRM API with enhanced options for shortest path
        // Using 'foot' profile to prioritize pedestrian paths
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true&steps=true`
        );
        
        if (!response.ok) {
          throw new Error(`OSRM API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error('No route found');
        }
        
        // Find the shortest route among alternatives (if available)
        const shortestRoute = data.routes.reduce((shortest, current) => {
          return current.distance < shortest.distance ? current : shortest;
        }, data.routes[0]);
        
        // Get the route geometry (line)
        const route = shortestRoute;
        const segmentDistance = route.distance / 1000; // Convert to km
        totalDistance += segmentDistance;
        
        // Get the coordinates of the route
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        allCoordinates.push(...coordinates);
        
        // Draw route segment
        const routeSegment = window.L.polyline(coordinates, {
          color: '#10b981', // green
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '10, 10',
          className: 'animated-dash'
        }).addTo(routeGroup);
        
        // Add distance label at midpoint with correct unit formatting
        if (segmentDistance > 0.05) { // Only for segments longer than 50m
          const midIndex = Math.floor(coordinates.length / 2);
          const midPoint = coordinates[midIndex];
          
          window.L.marker(midPoint, {
            icon: window.L.divIcon({
              className: 'distance-label',
              html: `
                <div style="
                  background-color: white;
                  padding: 3px 6px;
                  border-radius: 10px;
                  font-size: 11px;
                  font-weight: 500;
                  color: #10b981;
                  border: 1px solid #d1fae5;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                ">
                  ${formatDistance(segmentDistance)}
                </div>
              `,
              iconSize: [60, 20],
              iconAnchor: [30, 10]
            })
          }).addTo(routeGroup);
        }
      } catch (error) {
        console.error(`Error fetching walking route segment ${i}:`, error);
        
        // Fallback to direct line if API fails
        const directLine = window.L.polyline([[startLat, startLng], [endLat, endLng]], {
          color: '#ef4444', // Red to indicate fallback
          weight: 4,
          opacity: 0.6,
          dashArray: '5, 10',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeGroup);
        
        // Calculate direct distance
        const directDistance = calculateDistance(startLat, startLng, endLat, endLng);
        totalDistance += directDistance;
        
        // Add midpoint label for direct line using the current unit format
        const midPoint = [
          (startLat + endLat) / 2,
          (startLng + endLng) / 2
        ];
        
        window.L.marker(midPoint, {
          icon: window.L.divIcon({
            className: 'distance-label',
            html: `
              <div style="
                background-color: white;
                padding: 3px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 500;
                color: #ef4444;
                border: 1px solid #fee2e2;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
              ">
                ${formatDistance(directDistance)}
              </div>
            `,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
          })
        }).addTo(routeGroup);
      }
    }
    
    // Fit bounds to the route
    if (allCoordinates.length > 0) {
      const bounds = window.L.latLngBounds(allCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Fallback if no coordinates were generated
      const latLngs = pointsForRoute
        .filter(p => p.latitude && p.longitude)
        .map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
      
      if (latLngs.length >= 2) {
        const bounds = window.L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    
    // Store reference to route group
    routeLineRef.current = routeGroup;
    
    // Return the total distance if needed
    return { routeGroup, totalDistance };
  } catch (error) {
    console.error("Error creating walking route:", error);
    
    // Fallback to simple straight lines if all else fails
    const latLngs = pointsForRoute
      .filter(p => p.latitude && p.longitude)
      .map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);
    
    if (latLngs.length >= 2) {
      const fallbackLine = window.L.polyline(latLngs, {
        color: '#ef4444', // Red to indicate fallback
        weight: 4,
        opacity: 0.7,
        dashArray: '5, 5',
      }).addTo(routeGroup);
      
      routeLineRef.current = routeGroup;
      
      const bounds = window.L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    return routeGroup;
  }
}, [calculateDistance, formatDistance]);


// Add this helper function if not already present
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
  
  // Calculate walking time (assuming 5km/h or 3mph pace)
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

  // Update markers when plaques or selection changes
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      addMapMarkers();
    }
  }, [mapLoaded, plaques, favorites, selectedPlaqueId, isRoutingMode, routePoints, addMapMarkers]);

  useEffect(() => {
    // When unit preference changes, redraw the route to update distance labels
    if (routePoints.length >= 2 && routeLineRef.current && mapInstanceRef.current) {
      // Small delay to allow state to update fully
      const timer = setTimeout(() => {
        drawWalkingRoute(routePoints);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [useImperial, drawWalkingRoute, routePoints]);
  
  // Fix: Improved removal of plaque from route
  const handleRemovePlaqueFromRoute = useCallback((plaqueId) => {
    setRoutePoints(prev => {
      const updatedPoints = prev.filter(p => p.id !== plaqueId);
      
      // If we still have enough points to draw a route, redraw it
      if (updatedPoints.length >= 2 && mapInstanceRef.current) {
        setTimeout(() => {
          drawWalkingRoute(updatedPoints);
        }, 50);
      } else if (updatedPoints.length < 2 && mapInstanceRef.current) {
        // Clear the route entirely if we don't have enough points
        if (routeLineRef.current) {
          mapInstanceRef.current.removeLayer(routeLineRef.current);
          routeLineRef.current = null;
        }
      }
      
      return updatedPoints;
    });
    
    toast.info("Removed plaque from route");
  }, [drawWalkingRoute]);

  // Draw route when route points change
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded && routePoints.length >= 2 && isRoutingMode) {
      drawWalkingRoute(routePoints);
    } else if (routeLineRef.current && mapInstanceRef.current) {
      // Clear route line if routing mode is disabled or no points
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  }, [mapLoaded, routePoints, isRoutingMode, drawWalkingRoute]);

  // Handle routing mode toggle
  const handleToggleRoutingMode = useCallback(() => {
    const newRoutingMode = !isRoutingMode;
    setIsRoutingMode(newRoutingMode);
    
    if (newRoutingMode) {
      setShowRoutePanel(true);
      toast.success("Route planning mode activated. Click on plaques to add them to your route.");
    } else {
      // Clear the route when exiting routing mode
      if (routeLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      setShowRoutePanel(false);
    }
  }, [isRoutingMode, setIsRoutingMode]);

  // Reset map function for development/testing
  const resetMap = useCallback(() => {
    console.log("Resetting map view");
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([51.505, -0.09], 13);
    }
  }, []);

  // Expose methods to the parent component through the ref
 // In the React.useImperativeHandle section, add a comma after the clearRoute method
React.useImperativeHandle(ref, () => ({
  drawRouteLine: (pointsForRoute) => {
    return drawWalkingRoute(pointsForRoute);
  },

  clearRoute: () => {  // <-- This method was missing a comma after it
    if (routeLineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
      
      // Additional cleanup
      setRouteLine(null);
      
      // Refresh markers to ensure they're not showing route status
      addMapMarkers();
    }
  },  // <-- Added missing comma here

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
  },

  fitRoute: (newRoutePoints) => {
    if (!mapInstanceRef.current || newRoutePoints.length < 2) return;
    
    const latLngs = newRoutePoints
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
  }
}));
  // Route Builder Panel Component
  const RoutePanel = () => {
    const totalDistance = calculateRouteDistance(routePoints);
    
    return (
      <div className="absolute right-4 top-20 z-50 bg-white rounded-lg shadow-lg p-3 w-72 max-h-[70vh] overflow-auto">
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
              // For now this is just a placeholder. A real implementation would 
              // reorder the points for an optimal route
              toast.info("Optimizing route...");
              // Example implementation: keep first and last points, reorder middle
              if (routePoints.length >= 3) {
                const start = routePoints[0];
                const end = routePoints[routePoints.length - 1];
                const middle = [...routePoints.slice(1, -1)].sort((a, b) => a.id - b.id);
                const optimized = [start, ...middle, end];
                // In a real implementation, this would be replaced with a proper TSP algorithm
                // ...
              }
            }}
            disabled={routePoints.length < 3}
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
              <div key={point.id} className="flex items-center gap-2 p-2 border rounded-md">
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
                  onClick={() => removePlaqueFromRoute(point.id)}
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
            onClick={clearRoute}
            disabled={routePoints.length === 0}
          >
            <Trash size={14} className="mr-1" />
            Clear Route
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              // Export route functionality
              toast.success("Route exported");
            }}
            disabled={routePoints.length < 2}
          >
            <Download size={14} className="mr-1" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              // Save route functionality
              toast.success("Route saved");
            }}
            disabled={routePoints.length < 2}
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
          
          {/* Route Button - This is now the main route planner trigger */}
          <div className="relative group">
            <Button 
              variant={isRoutingMode ? "default" : "outline"}
              size="sm" 
              className={`h-10 w-10 p-0 relative ${isRoutingMode ? 'bg-green-600 text-white' : ''}`}
              onClick={handleToggleRoutingMode}
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
      
      {/* Map attribution */}
      <div className="absolute bottom-1 right-1 z-10 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
      </div>
    </div>
  );
});

export default PlaqueMap;