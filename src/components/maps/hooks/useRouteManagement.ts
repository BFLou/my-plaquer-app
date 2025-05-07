// src/hooks/useRouteManagement.ts
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Plaque } from '@/types/plaque';
import { calculateDistance, calculateWalkingTime } from '../utils/routeUtils';

interface UseRouteManagementProps {
  mapInstance: any;
  routeMarkerGroup: any;
  routeLineRef: any;
  formatDistance: (distance: number) => string;
  calculateWalkingTime?: (distance: number) => string;
  onRouteChange?: (points: Plaque[]) => void;
}

export const useRouteManagement = ({
  mapInstance,
  routeMarkerGroup,
  routeLineRef,
  formatDistance,
  calculateWalkingTime: customWalkingTimeCalc,
  onRouteChange
}: UseRouteManagementProps) => {
  const [routePoints, setRoutePoints] = useState<Plaque[]>([]);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const lastRouteRef = useRef<string>('');

  // Use either custom walking time calculator or the imported one
  const getWalkingTime = useCallback((distance: number) => {
    if (customWalkingTimeCalc) {
      return customWalkingTimeCalc(distance);
    }
    return calculateWalkingTime(distance);
  }, [customWalkingTimeCalc]);

  // Add a point to the route
  const addPointToRoute = useCallback((plaque: Plaque) => {
    if (!plaque.latitude || !plaque.longitude) {
      toast.error("This plaque doesn't have valid coordinates");
      return;
    }
    
    // Check if plaque is already in route
    const existingIndex = routePoints.findIndex(p => p.id === plaque.id);
    if (existingIndex !== -1) {
      toast.info("This plaque is already in your route");
      return;
    }
    
    // Add plaque to route
    setRoutePoints(prev => {
      const updated = [...prev, plaque];
      // Inform parent component if callback provided
      if (onRouteChange) onRouteChange(updated);
      return updated;
    });
    
    toast.success(`Added ${plaque.title} to route`);
  }, [routePoints, onRouteChange]);
  
  // Remove a point from the route
  const removePointFromRoute = useCallback((plaqueId: number) => {
    // Prevent operations while route is being drawn
    if (isDrawingRoute) {
      toast.info("Please wait, route is being updated...");
      return;
    }
    
    // Set flag to prevent re-renders during update
    setIsDrawingRoute(true);
    
    // First, clear the existing route line
    if (routeLineRef.current && mapInstance) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Update route points
    setRoutePoints(prev => {
      const updated = prev.filter(p => p.id !== plaqueId);
      // Inform parent component if callback provided
      if (onRouteChange) onRouteChange(updated);
      return updated;
    });
    
    // Reset drawing flag after a delay to allow DOM updates
    setTimeout(() => {
      setIsDrawingRoute(false);
    }, 300);
    
    toast.info("Removed plaque from route");
  }, [isDrawingRoute, mapInstance, routeLineRef, onRouteChange]);
  
  // Clear the entire route
  const clearRoute = useCallback(() => {
    if (!mapInstance) {
      console.warn("Map not available for clearing route");
      return;
    }
    
    // Clear existing route line
    if (routeLineRef.current) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Clear all route markers
    if (routeMarkerGroup) {
      routeMarkerGroup.clearLayers();
    }
    
    // Reset route state
    setRoutePoints([]);
    if (onRouteChange) onRouteChange([]);
    lastRouteRef.current = '';
    
    toast.success("Route cleared");
  }, [mapInstance, routeLineRef, routeMarkerGroup, onRouteChange]);
  
  // Draw a walking route between points
  const drawWalkingRoute = useCallback((points: Plaque[]) => {
    if (!mapInstance || !window.L || points.length < 2) {
      console.log("Cannot draw route: Map not loaded or insufficient points");
      return null;
    }
    
    // Set drawing state to prevent re-renders during operation
    setIsDrawingRoute(true);
    
    try {
      // Clear any existing route
      if (routeLineRef.current) {
        mapInstance.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Filter valid points
      const validPoints = points
        .filter(p => p.latitude && p.longitude)
        .map(p => [
          parseFloat(p.latitude as unknown as string),
          parseFloat(p.longitude as unknown as string)
        ])
        .filter(coords => !isNaN(coords[0]) && !isNaN(coords[1]));
      
      if (validPoints.length < 2) {
        console.warn("Not enough valid points to draw route");
        setIsDrawingRoute(false);
        return null;
      }
      
      // Create route group
      const routeGroup = window.L.featureGroup().addTo(mapInstance);
      
      // Draw line segments between consecutive points with improved styling for walking routes
      for (let i = 0; i < validPoints.length - 1; i++) {
        const startPoint = validPoints[i];
        const endPoint = validPoints[i + 1];
        
        // Draw route segment with walking-appropriate styling (dashed line)
        const routeSegment = window.L.polyline([startPoint, endPoint], {
          color: '#10b981', // green
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '10, 10',
          className: 'animated-dash'
        }).addTo(routeGroup);
        
        // Add directional arrow for walking direction
        const arrowPoints = getArrowPoints(startPoint, endPoint);
        const arrow = window.L.polyline(arrowPoints, {
          color: '#10b981',
          weight: 3,
          opacity: 0.9
        }).addTo(routeGroup);
        
        // Calculate segment distance and walking time
        const segmentDistance = calculateDistance(
          startPoint[0], startPoint[1], endPoint[0], endPoint[1]
        );
        
        // Calculate walking time
        const walkTime = getWalkingTime(segmentDistance);
        
        // Add distance and time label at midpoint
        const midPoint = [
          (startPoint[0] + endPoint[0]) / 2,
          (startPoint[1] + endPoint[1]) / 2
        ];
        
        window.L.marker(midPoint, {
          icon: window.L.divIcon({
            className: 'distance-label',
            html: `
              <div class="route-distance-label">
                ${formatDistance(segmentDistance)} · ${walkTime}
              </div>
            `,
            iconSize: [80, 20],
            iconAnchor: [40, 10]
          })
        }).addTo(routeGroup);
      }
      
      // Fit to route bounds with better zoom control
      try {
        const bounds = window.L.latLngBounds(validPoints);
        if (bounds.isValid()) {
          mapInstance.flyToBounds(bounds, { 
            padding: [50, 50],
            duration: 0.75, // Shorter duration for smoother transition
            easeLinearity: 0.5 // More linear movement
          });
        }
      } catch (error) {
        console.warn("Non-critical error fitting to route bounds:", error);
      }
      
      // Store reference and update state
      routeLineRef.current = routeGroup;
      
      // Reset drawing state flag after all operations complete
      setTimeout(() => {
        setIsDrawingRoute(false);
      }, 300);
      
      return routeGroup;
    } catch (error) {
      console.error("Error drawing walking route:", error);
      setIsDrawingRoute(false);
      
      // Ensure we don't leave hanging references
      if (routeLineRef.current && mapInstance) {
        mapInstance.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      
      // Notify user of error
      toast.error("Couldn't draw the complete route. Using simplified view.");
      
      return null;
    }
  }, [mapInstance, routeLineRef, formatDistance, getWalkingTime]);
  
  // Optimize the route for walking
  const optimizeRouteForWalking = useCallback(() => {
    if (routePoints.length < 3) {
      toast.info("Need at least 3 stops to optimize for walking");
      return;
    }
    
    // Simple walking route optimization:
    // 1. Keep start and end points fixed
    // 2. Optimize middle points to minimize walking distance
    const start = routePoints[0];
    const end = routePoints[routePoints.length - 1];
    
    // Get middle points
    const middlePoints = routePoints.slice(1, -1);
    
    // Uses a greedy nearest-neighbor approach for simplicity
    // In a real app, you might use a more sophisticated algorithm
    const optimizedMiddle: Plaque[] = [];
    const remaining = [...middlePoints];
    
    let currentPoint = start;
    
    while (remaining.length > 0) {
      // Find closest point to current position
      let closestIdx = 0;
      let closestDist = Infinity;
      
      for (let i = 0; i < remaining.length; i++) {
        const dist = getDistanceBetweenPlaques(currentPoint, remaining[i]);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      
      // Add closest point to optimized route
      const nextPoint = remaining.splice(closestIdx, 1)[0];
      optimizedMiddle.push(nextPoint);
      currentPoint = nextPoint;
    }
    
    // Create optimized route
    const optimizedRoute = [start, ...optimizedMiddle, end];
    
    // Update route
    setRoutePoints(optimizedRoute);
    if (onRouteChange) onRouteChange(optimizedRoute);
    
    // Draw the optimized route
    drawWalkingRoute(optimizedRoute);
    
    toast.success("Route optimized for walking");
  }, [routePoints, drawWalkingRoute, onRouteChange]);
  
  // Helper function to calculate distance between two plaques
  const getDistanceBetweenPlaques = (plaque1: Plaque, plaque2: Plaque) => {
    if (!plaque1.latitude || !plaque1.longitude || !plaque2.latitude || !plaque2.longitude) {
      return Infinity;
    }
    
    const lat1 = parseFloat(plaque1.latitude as unknown as string);
    const lng1 = parseFloat(plaque1.longitude as unknown as string);
    const lat2 = parseFloat(plaque2.latitude as unknown as string);
    const lng2 = parseFloat(plaque2.longitude as unknown as string);
    
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      return Infinity;
    }
    
    return calculateDistance(lat1, lng1, lat2, lng2);
  };
  
  // Helper function to create arrow points for direction indicators
  const getArrowPoints = (start: number[], end: number[]) => {
    // Calculate the midpoint of the segment
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    
    // Calculate the direction vector
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    
    // Normalize the direction vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;
    
    // Calculate perpendicular vector
    const perpX = -unitY;
    const perpY = unitX;
    
    // Arrow size (adjust based on map zoom)
    const arrowSize = 0.0002;
    
    // Calculate arrow points
    return [
      [midX - unitX * arrowSize * 2 + perpX * arrowSize, midY - unitY * arrowSize * 2 + perpY * arrowSize],
      [midX, midY],
      [midX - unitX * arrowSize * 2 - perpX * arrowSize, midY - unitY * arrowSize * 2 - perpY * arrowSize]
    ];
  };
  
  return {
    routePoints,
    isDrawingRoute,
    isRoutingMode,
    setIsRoutingMode,
    addPointToRoute,
    removePointFromRoute,
    clearRoute,
    drawWalkingRoute,
    optimizeRouteForWalking
  };
};

export default useRouteManagement;