// src/hooks/useRouteManagement.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

export const useRouteManagement = ({
  mapInstance,
  routeMarkerGroup,
  routeLineRef,
  formatDistance,
  calculateWalkingTime,
  onRouteChange
}) => {
  const [routePoints, setRoutePoints] = useState([]);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  
  // Refs to track state between renders
  const drawTimeoutRef = useRef(null);
  const drawingRef = useRef(false);
  const routeApiCache = useRef({});
  
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
    setRoutePoints(prev => {
      const newRoute = prev.filter(p => p.id !== plaqueId);
      if (onRouteChange) onRouteChange(newRoute);
      return newRoute;
    });
    
    toast.info("Removed plaque from route");
  }, [onRouteChange]);
  
  // Clear the entire route
  const clearRoute = useCallback(() => {
    // Cancel any ongoing operations
    if (drawTimeoutRef.current) {
      clearTimeout(drawTimeoutRef.current);
      drawTimeoutRef.current = null;
    }
    
    // Clear route line
    if (routeLineRef.current && mapInstance) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Clear route markers
    if (routeMarkerGroup) {
      routeMarkerGroup.clearLayers();
    }
    
    // Reset state
    setRoutePoints([]);
    if (onRouteChange) onRouteChange([]);
    
    // Reset drawing state
    drawingRef.current = false;
    setIsDrawingRoute(false);
    
    toast.success("Route cleared");
  }, [mapInstance, routeLineRef, routeMarkerGroup, onRouteChange]);
  
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
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
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
  }, [mapInstance, routeLineRef, routePoints, getCoords, calculateDistance, formatDistance, calculateWalkingTime]);
  
  // Draw walking route using either direct lines or routing API
  const drawWalkingRoute = useCallback((points = routePoints) => {
    // Prevent multiple concurrent draws
    if (drawingRef.current || !mapInstance || !window.L || points.length < 2) {
      return null;
    }
    
    // Set drawing state
    drawingRef.current = true;
    setIsDrawingRoute(true);
    
    try {
      // For now, just draw direct lines for stability
      const route = drawSimpleRoute();
      
      // Reset drawing state after a delay
      drawTimeoutRef.current = setTimeout(() => {
        drawingRef.current = false;
        setIsDrawingRoute(false);
      }, 500);
      
      return route;
    } catch (e) {
      console.error("Error drawing walking route:", e);
      
      // Reset drawing state
      drawingRef.current = false;
      setIsDrawingRoute(false);
      
      return null;
    }
  }, [mapInstance, drawSimpleRoute]);
  
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
    };
  }, []);
  
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