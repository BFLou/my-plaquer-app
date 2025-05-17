// Updated useRouteManagement.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plaque } from '@/types/plaque';
import { calculateDistance, formatDistance as formatDistanceUtil } from '../utils/routeUtils';

/**
 * Custom hook for managing routes on the map
 */
export const useRouteManagement = ({
  mapInstance,
  routePoints,
  useRoadRouting = true,
  useImperial = false,
  API_KEY,
  onRouteChange = () => {}
}) => {
  // State
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [routeDistance, setRouteDistance] = useState(0);
  
  // Refs
  const routeLineRef = useRef(null);
  const drawingTimeoutRef = useRef(null);
  
  // Clean up on unmount or when map changes
  useEffect(() => {
    return () => {
      if (drawingTimeoutRef.current) {
        clearTimeout(drawingTimeoutRef.current);
      }
      
      if (routeLineRef.current && mapInstance) {
        try {
          mapInstance.removeLayer(routeLineRef.current);
          routeLineRef.current = null;
        } catch (e) {
          console.warn("Error cleaning up route:", e);
        }
      }
    };
  }, [mapInstance]);
  
  // Format distance based on unit preference
  const formatDistance = useCallback((distanceKm) => {
    return formatDistanceUtil(distanceKm, useImperial);
  }, [useImperial]);
  
  // Calculate walking time (assuming 5km/h or 3mph pace)
  const calculateWalkingTime = useCallback((distanceKm) => {
    if (distanceKm <= 0) return "0 min";
    
    // Walking speeds differ slightly between km and miles
    const minutes = useImperial 
      ? Math.round(distanceKm * 0.621371 * 20) // 20 minutes per mile
      : Math.round(distanceKm * 12); // 12 minutes per km
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
  }, [useImperial]);
  
  // Calculate route distance between all points
  const calculateRouteDistance = useCallback((points = routePoints) => {
    if (!points || points.length < 2) return 0;
    
    let total = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
      
      const startLat = parseFloat(start.latitude);
      const startLng = parseFloat(start.longitude);
      const endLat = parseFloat(end.latitude);
      const endLng = parseFloat(end.longitude);
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
      
      total += calculateDistance(startLat, startLng, endLat, endLng);
    }
    
    return total;
  }, [routePoints]);
  
  // Helper function to draw direct route (without API call)
  const drawDirectRoute = useCallback((points, maintainView = false) => {
    if (!mapInstance || !window.L || points.length < 2) return null;
    
    try {
      // Clear existing route if present
      if (routeLineRef.current) {
        mapInstance.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      const routeGroup = window.L.featureGroup().addTo(mapInstance);
      let totalDistance = 0;
      const allLatLngs = [];
      
      // Add route markers first
      points.forEach((point, index) => {
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
        } else if (index === points.length - 1) {
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
        
        allLatLngs.push([lat, lng]);
        
        // Add popup with route info
        const popupContent = `
          <div class="p-2">
            <div class="font-medium text-sm">${point.title || 'Route Point'}</div>
            <div class="text-xs text-gray-500 mt-1">
              ${index === 0 ? 'Start point' : 
                index === points.length - 1 ? 'End point' : 
                `Stop #${index + 1}`}
            </div>
          </div>
        `;
        
        routeMarker.bindPopup(popupContent);
      });
      
      // Draw direct lines between points
      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        
        if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
        
        const startLat = parseFloat(start.latitude);
        const startLng = parseFloat(start.longitude);
        const endLat = parseFloat(end.latitude);
        const endLng = parseFloat(end.longitude);
        
        if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
        
        // Draw direct line
        const line = window.L.polyline([[startLat, startLng], [endLat, endLng]], {
          color: '#10b981', // green, but a bit more muted for direct lines
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10',
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
                color: #10b981;
                border: 1px solid #d1fae5;
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
      
      // Handle zooming based on context
      if (allLatLngs.length > 0) {
        // Create bounds
        const bounds = window.L.latLngBounds(allLatLngs);
        
        // Only zoom if we're not maintaining the view and one of the following is true:
        // 1. This is a new route (2 points or less)
        // 2. The route extends beyond the current view
        if (!maintainView) {
          if (points.length <= 2) {
            // Always fit for new routes
            mapInstance.fitBounds(bounds, { padding: [50, 50] });
          } else {
            // For existing routes, only fit if route goes out of current view
            const currentBounds = mapInstance.getBounds();
            const paddedBounds = currentBounds.pad(-0.2); // -0.2 means 20% smaller bounds
            
            // Only fit bounds if the route isn't fully visible in the current view
            if (!paddedBounds.contains(bounds)) {
              mapInstance.fitBounds(bounds, { 
                padding: [50, 50],
                animate: true,
                duration: 0.5
              });
            }
          }
        }
      }
      
      // Store reference to this route
      routeLineRef.current = routeGroup;
      
      // Update the distance
      setRouteDistance(totalDistance);
      
      return { routeGroup, totalDistance };
    } catch (error) {
      console.error("Error creating direct route:", error);
      return null;
    }
  }, [mapInstance, formatDistance]);

  // Main function to draw walking route (using API if enabled)
  const drawWalkingRoute = useCallback(async (pointsForRoute, useRoadAPI = useRoadRouting, maintainView = false) => {
    if (!mapInstance || !window.L || !pointsForRoute || pointsForRoute.length < 2) {
      console.log("Cannot draw route: Map not loaded or insufficient points");
      return null;
    }
    
    // Clear existing route if present
    if (routeLineRef.current) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Skip API call and use direct route if road routing is disabled
    if (!useRoadAPI) {
      return drawDirectRoute(pointsForRoute, maintainView);
    }
    
    // We're using the API for road routing - show loading state
    setIsDrawingRoute(true);
    
    // Create a feature group to hold all route elements
    const routeGroup = window.L.featureGroup().addTo(mapInstance);
    
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
      
      let totalDistance = 0;
      const allCoordinates = [];
      
      // Process route in segments
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
                preference: 'recommended',
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
                  ${formatDistance(directDistance)} (direct)
                </div>
              `,
              iconSize: [80, 20],
              iconAnchor: [40, 10]
            })
          }).addTo(routeGroup);
        }
      }
      
      // Handle zooming based on maintainView and route context
      if (allCoordinates.length > 0 && !maintainView) {
        // Create bounds
        const bounds = window.L.latLngBounds(allCoordinates);
        
        if (pointsForRoute.length <= 2) {
          // Always fit for new routes (1-2 points)
          mapInstance.fitBounds(bounds, { padding: [50, 50] });
        } else {
          // For existing routes with 3+ points, only fit if route goes out of current view
          const currentBounds = mapInstance.getBounds();
          // Create smaller bounds (80% of current view) to determine if we need to zoom out
          const paddedBounds = currentBounds.pad(-0.2);
          
          // Only fit bounds if the route isn't fully visible in the current view
          if (!paddedBounds.contains(bounds)) {
            mapInstance.fitBounds(bounds, { 
              padding: [50, 50],
              animate: true,
              duration: 0.5
            });
          }
        }
      }
      
      // Store reference and update state
      routeLineRef.current = routeGroup;
      setRouteDistance(totalDistance);
      setIsDrawingRoute(false);
      
      return { routeGroup, totalDistance };
      
    } catch (error) {
      console.error("Error creating route:", error);
      setIsDrawingRoute(false);
      
      // Fallback to direct lines if everything fails
      return drawDirectRoute(pointsForRoute, maintainView);
    }
  }, [API_KEY, mapInstance, drawDirectRoute, formatDistance]);
  
  // Optimize route using nearest neighbor algorithm
  const optimizeRouteForWalking = useCallback(() => {
    if (!routePoints || routePoints.length < 3) {
      return routePoints;
    }
    
    try {
      // Simple nearest neighbor algorithm
      const start = routePoints[0];
      const end = routePoints[routePoints.length - 1];
      const middle = [...routePoints.slice(1, -1)];
      
      const optimizedMiddle = [];
      let current = start;
      
      // Find nearest point repeatedly
      while (middle.length > 0) {
        let bestIndex = 0;
        let bestDistance = Number.MAX_VALUE;
        
        for (let i = 0; i < middle.length; i++) {
          const startLat = parseFloat(current.latitude);
          const startLng = parseFloat(current.longitude);
          const endLat = parseFloat(middle[i].latitude);
          const endLng = parseFloat(middle[i].longitude);
          
          const distance = calculateDistance(startLat, startLng, endLat, endLng);
          
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = i;
          }
        }
        
        const nearest = middle.splice(bestIndex, 1)[0];
        optimizedMiddle.push(nearest);
        current = nearest;
      }
      
      // Create optimized route
      const optimized = [start, ...optimizedMiddle, end];
      
      // Draw the route - not maintaining view since optimization is an explicit user action
      drawingTimeoutRef.current = setTimeout(() => {
        drawWalkingRoute(optimized, useRoadRouting, false);
      }, 100);
      
      // Update state in parent via callback
      onRouteChange(optimized);
      
      return optimized;
    } catch (error) {
      console.error("Error optimizing route:", error);
      return routePoints;
    }
  }, [routePoints, drawWalkingRoute, onRouteChange, useRoadRouting]);
  
  // Clear route
  const clearRoute = useCallback(() => {
    if (routeLineRef.current && mapInstance) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
      setRouteDistance(0);
    }
  }, [mapInstance]);
  
  // Return the hook functions and state
  return {
    isDrawingRoute,
    routeDistance,
    drawWalkingRoute,
    drawDirectRoute,
    clearRoute,
    optimizeRouteForWalking,
    calculateRouteDistance,
    formatDistance,
    calculateWalkingTime
  };
};

export default useRouteManagement;