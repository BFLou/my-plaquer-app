// src/components/maps/hooks/useRouteManagement.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateDistance, formatDistance as formatDistanceUtil } from '../utils/routeUtils';

export const useRouteManagement = ({
  mapInstance,
  routePoints,
  useImperial = false,
  API_KEY,
  onRouteChange = () => {}
}) => {
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [routeDistance, setRouteDistance] = useState(0);
  const routeLineRef = useRef(null);
  const drawingTimeoutRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (drawingTimeoutRef.current) {
        clearTimeout(drawingTimeoutRef.current);
      }
      clearRoute();
    };
  }, [mapInstance]);
  
  // Auto-draw route when points change
  useEffect(() => {
    if (routePoints && routePoints.length >= 2 && mapInstance) {
      drawWalkingRoute(routePoints, false);
    } else if (routePoints && routePoints.length < 2) {
      clearRoute();
    }
  }, [routePoints, mapInstance]);
  
  const formatDistance = useCallback((distanceKm) => {
    return formatDistanceUtil(distanceKm, useImperial);
  }, [useImperial]);
  
  const calculateWalkingTime = useCallback((distanceKm) => {
    if (distanceKm <= 0) return "0 min";
    
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
  
  const clearRoute = useCallback(() => {
    if (routeLineRef.current && mapInstance) {
      try {
        mapInstance.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
        setRouteDistance(0);
      } catch (e) {
        console.warn("Error clearing route:", e);
      }
    }
  }, [mapInstance]);
  
  // Walking route using OpenRouteService API
  const drawWalkingRoute = useCallback(async (pointsForRoute, maintainView = false) => {
    if (!mapInstance || !window.L || !pointsForRoute || pointsForRoute.length < 2) {
      return null;
    }
    
    clearRoute();
    setIsDrawingRoute(true);
    
    const routeGroup = window.L.featureGroup().addTo(mapInstance);
    
    try {
      // Add route markers first
      pointsForRoute.forEach((point, index) => {
        if (!point.latitude || !point.longitude) return;
        
        const lat = parseFloat(point.latitude);
        const lng = parseFloat(point.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        let markerColor, markerLabel, markerClass;
        
        if (index === 0) {
          markerLabel = 'A';
          markerColor = '#22c55e'; // green-500
          markerClass = 'route-marker-start';
        } else if (index === pointsForRoute.length - 1) {
          markerLabel = 'B';
          markerColor = '#ef4444'; // red-500
          markerClass = 'route-marker-end';
        } else {
          markerLabel = String.fromCharCode(65 + index); // A, B, C, etc.
          markerColor = '#3b82f6'; // blue-500
          markerClass = 'route-marker-waypoint';
        }
        
        const routeMarker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            className: `route-marker ${markerClass}`,
            html: `
              <div style="
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: ${markerColor};
                color: white;
                border-radius: 50%;
                font-weight: bold;
                font-size: 16px;
                border: 3px solid white;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              ">
                ${markerLabel}
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          }),
          zIndexOffset: 1000
        }).addTo(routeGroup);
        
        const popupContent = `
          <div class="p-3">
            <div class="font-medium text-sm">${point.title || 'Route Point'}</div>
            <div class="text-xs text-gray-500 mt-1">
              ${index === 0 ? 'Starting point' : 
                index === pointsForRoute.length - 1 ? 'Destination' : 
                `Stop ${markerLabel}`}
            </div>
          </div>
        `;
        
        routeMarker.bindPopup(popupContent);
      });
      
      let totalDistance = 0;
      const allCoordinates = [];
      
      // Process route segments using OpenRouteService
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
          // Call OpenRouteService API for walking directions
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
                  [startLng, startLat],
                  [endLng, endLat]
                ],
                preference: 'recommended',
                instructions: false,
                language: 'en'
              })
            }
          );
          
          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!data.features || data.features.length === 0) {
            throw new Error('No walking route found');
          }
          
          const route = data.features[0];
          const segmentDistance = route.properties.summary.distance / 1000; // Convert to km
          totalDistance += segmentDistance;
          
          // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          allCoordinates.push(...coordinates);
          
          // Draw the walking path
          const routeSegment = window.L.polyline(coordinates, {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(routeGroup);
          
        } catch (error) {
          console.warn(`Failed to get walking route for segment ${i}:`, error);
          
          // Fallback to direct line with warning style
          const directLine = window.L.polyline([[startLat, startLng], [endLat, endLng]], {
            color: '#f59e0b', // amber for fallback
            weight: 4,
            opacity: 0.6,
            dashArray: '8, 12',
            lineCap: 'round'
          }).addTo(routeGroup);
          
          const directDistance = calculateDistance(startLat, startLng, endLat, endLng);
          totalDistance += directDistance;
          allCoordinates.push([startLat, startLng], [endLat, endLng]);
        }
      }
      
      // Fit bounds if not maintaining view
      if (allCoordinates.length > 0 && !maintainView) {
        const bounds = window.L.latLngBounds(allCoordinates);
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }
      
      routeLineRef.current = routeGroup;
      setRouteDistance(totalDistance);
      setIsDrawingRoute(false);
      
      return { routeGroup, totalDistance };
      
    } catch (error) {
      console.error("Error creating walking route:", error);
      setIsDrawingRoute(false);
      
      // Complete fallback to direct lines
      return drawFallbackRoute(pointsForRoute, maintainView);
    }
  }, [API_KEY, mapInstance, clearRoute]);
  
  // Fallback direct route
  const drawFallbackRoute = useCallback((points, maintainView = false) => {
    if (!mapInstance || !window.L || points.length < 2) return null;
    
    const routeGroup = window.L.featureGroup().addTo(mapInstance);
    let totalDistance = 0;
    
    // Draw direct lines with warning styling
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
      
      const startLat = parseFloat(start.latitude);
      const startLng = parseFloat(start.longitude);
      const endLat = parseFloat(end.latitude);
      const endLng = parseFloat(end.longitude);
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
      
      const line = window.L.polyline([[startLat, startLng], [endLat, endLng]], {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.7,
        dashArray: '8, 12',
        lineCap: 'round'
      }).addTo(routeGroup);
      
      totalDistance += calculateDistance(startLat, startLng, endLat, endLng);
    }
    
    routeLineRef.current = routeGroup;
    setRouteDistance(totalDistance);
    
    return { routeGroup, totalDistance };
  }, [mapInstance]);
  
  return {
    isDrawingRoute,
    routeDistance,
    drawWalkingRoute,
    clearRoute,
    calculateRouteDistance,
    formatDistance,
    calculateWalkingTime
  };
};

export default useRouteManagement;