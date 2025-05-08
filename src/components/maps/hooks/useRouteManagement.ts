// src/hooks/useRouteManagement.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Plaque } from '@/types/plaque';

export const useRouteManagement = ({
  mapInstance,
  routeMarkerGroup,
  routeLineRef,
  formatDistance,
  calculateWalkingTime,
  onRouteChange
}) => {
  // State for route management
  const [routePoints, setRoutePoints] = useState([]);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  
  // Refs to track state between renders
  const drawTimeoutRef = useRef(null);
  const drawingRef = useRef(false);
  
  // Calculate distance using Haversine formula
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);
  
  // Add a point to the route
  const addPointToRoute = useCallback((plaque) => {
    if (!plaque) return;
    
    setRoutePoints(prev => {
      // Skip if already in route
      if (prev.some(p => p.id === plaque.id)) {
        toast.info("This plaque is already in your route");
        return prev;
      }
      
      // Add to route
      const newRoute = [...prev, plaque];
      if (onRouteChange) onRouteChange(newRoute);
      
      toast.success(`Added ${plaque.title || 'plaque'} to route`);
      return newRoute;
    });
  }, [onRouteChange]);
  
  // Remove a point from the route
  const removePointFromRoute = useCallback((plaqueId) => {
    if (!plaqueId) return;
    
    setRoutePoints(prev => {
      const newRoute = prev.filter(p => p.id !== plaqueId);
      if (onRouteChange) onRouteChange(newRoute);
      return newRoute;
    });
    
    toast.info("Removed plaque from route");
  }, [onRouteChange]);
  
  // Clear the entire route
// Fix for the clearRoute method
const clearRoute = useCallback(() => {
  if (!mapInstanceRef.current) return;
  
  // Clear existing route
  if (routeLineRef.current) {
    try {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    } catch (e) {
      console.warn("Error clearing route line:", e);
    }
  }
  
  // Reset route state
  setRoutePoints([]);
  setRouteLine(null);
  
  // Refresh markers to ensure they're not showing route status
  addMapMarkers();
  
  console.log("Route cleared successfully");
}, [addMapMarkers]);

// Fix for the removePlaqueFromRoute function
const removePlaqueFromRoute = useCallback((plaqueId) => {
  setRoutePoints(prev => {
    const updatedPoints = prev.filter(p => p.id !== plaqueId);
    
    // If we still have enough points to draw a route, redraw it
    if (updatedPoints.length >= 2 && mapInstanceRef.current) {
      // Use setTimeout to ensure state is updated before redrawing
      setTimeout(() => {
        drawWalkingRoute(updatedPoints);
      }, 50);
    } else if (updatedPoints.length < 2 && mapInstanceRef.current) {
      // Clear the route entirely if less than 2 points remain
      if (routeLineRef.current) {
        mapInstanceRef.current.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Refresh markers to reset their appearance
      addMapMarkers();
    }
    
    return updatedPoints;
  });
  
  toast.info("Removed plaque from route");
}, [drawWalkingRoute, addMapMarkers]);

// Update React.useImperativeHandle to expose these methods
React.useImperativeHandle(ref, () => ({
  drawRouteLine: (pointsForRoute) => {
    return drawWalkingRoute(pointsForRoute);
  },
  
  clearRoute: () => {
    if (routeLineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
      
      // Additional cleanup
      setRouteLine(null);
      
      // Refresh markers to ensure they're not showing route status
      addMapMarkers();
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
  
  // Safely get coordinates from a plaque
  const getCoords = useCallback((plaque) => {
    if (!plaque || !plaque.latitude || !plaque.longitude) return null;
    
    try {
      const lat = typeof plaque.latitude === 'string' ? 
        parseFloat(plaque.latitude) : plaque.latitude;
      const lng = typeof plaque.longitude === 'string' ? 
        parseFloat(plaque.longitude) : plaque.longitude;
      
      if (isNaN(lat) || isNaN(lng)) return null;
      
      return [lat, lng];
    } catch (e) {
      return null;
    }
  }, []);
  
  // Calculate route distance
  const calculateRouteDistance = useCallback((points = routePoints) => {
    if (!points || points.length < 2) return 0;
    
    let total = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = getCoords(points[i]);
      const end = getCoords(points[i + 1]);
      
      if (!start || !end) continue;
      
      total += calculateDistance(start[0], start[1], end[0], end[1]);
    }
    
    return total;
  }, [routePoints, getCoords, calculateDistance]);
  
  // Draw a simple direct route
  const drawSimpleRoute = useCallback(() => {
    if (!mapInstance || !window.L || routePoints.length < 2) return null;
    
    // Clear existing route
    if (routeLineRef.current) {
      try {
        mapInstance.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      } catch (e) {
        console.warn("Error clearing existing route:", e);
      }
    }
    
    try {
      // Get valid points
      const validPoints = routePoints
        .map(getCoords)
        .filter(coords => coords !== null);
      
      if (validPoints.length < 2) return null;
      
      // Create route group
      const routeGroup = window.L.featureGroup().addTo(mapInstance);
      
      // Draw line segments
      for (let i = 0; i < validPoints.length - 1; i++) {
        const start = validPoints[i];
        const end = validPoints[i + 1];
        
        // Create polyline
        window.L.polyline([start, end], {
          color: '#10b981', // green
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10'
        }).addTo(routeGroup);
        
        // Add distance label
        const distance = calculateDistance(start[0], start[1], end[0], end[1]);
        const midPoint = [
          (start[0] + end[0]) / 2,
          (start[1] + end[1]) / 2
        ];
        
        window.L.marker(midPoint, {
          icon: window.L.divIcon({
            className: 'distance-label',
            html: `
              <div class="route-distance-label">
                ${formatDistance(distance)} · ${calculateWalkingTime(distance)}
              </div>
            `,
            iconSize: [80, 20],
            iconAnchor: [40, 10]
          })
        }).addTo(routeGroup);
      }
      
      // Store reference
      routeLineRef.current = routeGroup;
      
      return routeGroup;
    } catch (e) {
      console.error("Error drawing simple route:", e);
      return null;
    }
  }, [
    mapInstance, 
    routeLineRef, 
    routePoints, 
    getCoords, 
    calculateDistance, 
    formatDistance, 
    calculateWalkingTime
  ]);
  
  // Draw walking route using either direct lines or routing API
// Updated drawWalkingRoute function using OpenRouteService
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
    
    // Use OpenRouteService for routing
    // Replace this with your own API key from https://openrouteservice.org/dev/#/signup
    const API_KEY = 'YOUR_API_KEY_HERE';
    
    let totalDistance = 0;
    const allCoordinates = [];
    
    // Process route in segments for multi-stop routes
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
        // Call OpenRouteService API
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/foot-walking/geojson`,
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json, application/geo+json',
              'Content-Type': 'application/json',
              'Authorization': API_KEY
            },
            body: JSON.stringify({
              coordinates: [
                [startLng, startLat], // ORS uses [lng, lat] format
                [endLng, endLat]
              ],
              preference: 'recommended', // 'shortest', 'recommended', or 'fastest'
              instructions: true,
              language: 'en'
            })
          }
        );
        
        if (!response.ok) {
          throw new Error(`OpenRouteService API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
          throw new Error('No route found');
        }
        
        // Get route details from response
        const route = data.features[0];
        const segmentDistance = route.properties.summary.distance / 1000; // Convert to km
        totalDistance += segmentDistance;
        
        // Get coordinates and convert from [lng, lat] to [lat, lng] for Leaflet
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
        
        // Add distance label at midpoint
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
        console.error(`Error fetching route segment ${i}:`, error);
        
        // Fallback to direct line if API fails
        const directLine = window.L.polyline([[startLat, startLng], [endLat, endLng]], {
          color: '#ef4444', // Red for fallback
          weight: 4,
          opacity: 0.6,
          dashArray: '5, 10',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeGroup);
        
        // Calculate direct distance
        const directDistance = calculateDistance(startLat, startLng, endLat, endLng);
        totalDistance += directDistance;
        
        // Add midpoint label
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
    
    // Fit bounds to show entire route
    if (allCoordinates.length > 0) {
      const bounds = window.L.latLngBounds(allCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Store reference and return
    routeLineRef.current = routeGroup;
    return { routeGroup, totalDistance };
    
  } catch (error) {
    console.error("Error creating route:", error);
    
    // Final fallback to straight lines if everything fails
    // (This code is similar to the error handler in the inner try/catch)
    // ...
    
    return null;
  }
}, [calculateDistance, formatDistance]);
  
  // Optimize walking route
  const optimizeRouteForWalking = useCallback(() => {
    if (routePoints.length < 3) {
      toast.info("Need at least 3 stops to optimize route");
      return;
    }
    
    // Keep start and end points fixed
    const start = routePoints[0];
    const end = routePoints[routePoints.length - 1];
    const middle = [...routePoints.slice(1, -1)];
    
    // Use nearest neighbor algorithm
    const optimized = [start];
    let current = start;
    
    while (middle.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      
      for (let i = 0; i < middle.length; i++) {
        const startCoords = getCoords(current);
        const endCoords = getCoords(middle[i]);
        
        if (!startCoords || !endCoords) continue;
        
        const dist = calculateDistance(
          startCoords[0], startCoords[1], 
          endCoords[0], endCoords[1]
        );
        
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      
      const next = middle.splice(bestIdx, 1)[0];
      optimized.push(next);
      current = next;
    }
    
    optimized.push(end);
    
    // Update route
    setRoutePoints(optimized);
    if (onRouteChange) onRouteChange(optimized);
    
    // Draw the route
    drawWalkingRoute(optimized);
    
    toast.success("Route optimized for walking");
  }, [routePoints, getCoords, calculateDistance, drawWalkingRoute, onRouteChange]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (drawTimeoutRef.current) {
        clearTimeout(drawTimeoutRef.current);
      }
      
      // Clean up any route lines
      if (routeLineRef.current && mapInstance) {
        try {
          mapInstance.removeLayer(routeLineRef.current);
          routeLineRef.current = null;
        } catch (e) {
          console.warn("Error cleaning up route lines:", e);
        }
      }
    };
  }, [mapInstance, routeLineRef]);
  
  return {
    routePoints,
    isDrawingRoute,
    isRoutingMode,
    setIsRoutingMode,
    addPointToRoute,
    removePointFromRoute,
    clearRoute,
    drawWalkingRoute,
    optimizeRouteForWalking,
    calculateRouteDistance
  };
};

export default useRouteManagement;