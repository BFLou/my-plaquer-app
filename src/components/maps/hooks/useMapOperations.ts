import { useCallback } from 'react';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner'; // Assuming you're using Sonner for toast notifications

export default function useMapOperations(
  mapInstance: any,
  plaques: Plaque[],
  maxDistance: number,
  setIsLoadingLocation: (loading: boolean) => void,
  setFilteredPlaquesCount: (count: number) => void,
  routePoints: Plaque[],
  setRoutePoints: React.Dispatch<React.SetStateAction<Plaque[]>>
) {
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  }, []);

  // Find user location on the map
  const findUserLocation = useCallback(() => {
    if (!window.L || !mapInstance) return;
    
    setIsLoadingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Add user location marker
          const L = window.L;
          
          // Create user location marker
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
          
          // Pan to location
          mapInstance.panTo([latitude, longitude]);
          
          // Filter plaques by distance and update count
          const plaquesInRange = filterPlaquesInRange([latitude, longitude], maxDistance);
          setFilteredPlaquesCount(plaquesInRange.length);
          
          setIsLoadingLocation(false);
          toast.success("Location found!");
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          toast.error("Could not access your location. Please check your browser settings.");
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  }, [mapInstance, maxDistance, setIsLoadingLocation, setFilteredPlaquesCount]);

  // Filter plaques within a certain distance of a point
  const filterPlaquesInRange = useCallback((center: [number, number], radiusKm: number): Plaque[] => {
    return plaques.filter(plaque => {
      if (!plaque.latitude || !plaque.longitude) return false;
      
      const lat = parseFloat(plaque.latitude as unknown as string);
      const lng = parseFloat(plaque.longitude as unknown as string);
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      const distance = calculateDistance(center[0], center[1], lat, lng);
      return distance <= radiusKm;
    });
  }, [plaques, calculateDistance]);

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
    
    return circle;
  }, [mapInstance]);

  // Apply distance filter
  const applyDistanceFilter = useCallback(() => {
    if (!mapInstance || !navigator.geolocation) {
      toast.error("Location services are not available");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Draw distance circle
        drawDistanceCircle([latitude, longitude], maxDistance);
        
        // Filter plaques by distance
        const plaquesInRange = filterPlaquesInRange([latitude, longitude], maxDistance);
        setFilteredPlaquesCount(plaquesInRange.length);
        
        toast.success(`Found ${plaquesInRange.length} plaques within ${maxDistance} km`);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error("Could not access your location for filtering.");
      }
    );
  }, [mapInstance, maxDistance, drawDistanceCircle, filterPlaquesInRange, setFilteredPlaquesCount]);

  // Reset filters
  const resetFilters = useCallback(() => {
    if (!mapInstance) return;
    
    // Clear distance circle
    if (mapInstance._distanceCircle) {
      mapInstance.removeLayer(mapInstance._distanceCircle);
    }
    
    // Reset filter count
    setFilteredPlaquesCount(0);
    
    toast.info("Filters have been reset");
  }, [mapInstance, setFilteredPlaquesCount]);

  // Export route as GeoJSON
  const exportRoute = useCallback(() => {
    if (routePoints.length < 2) {
      toast.error("Add at least two points to export a route");
      return;
    }
    
    // Create GeoJSON data
    const routeData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Plaque Route",
            description: `Route with ${routePoints.length} plaques`,
            points: routePoints.map(p => ({
              id: p.id,
              title: p.title
            }))
          },
          geometry: {
            type: "LineString",
            coordinates: routePoints
              .filter(p => p.latitude && p.longitude)
              .map(p => [
                parseFloat(p.longitude as unknown as string), 
                parseFloat(p.latitude as unknown as string)
              ])
          }
        }
      ]
    };
    
    // Convert to JSON string
    const dataStr = JSON.stringify(routeData, null, 2);
    
    // Create download link
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'plaque-route.geojson');
    a.click();
    
    toast.success("Route exported successfully");
  }, [routePoints]);

  // Save route to localStorage
  const saveRoute = useCallback(() => {
    if (routePoints.length < 2) {
      toast.error("Add at least two points to save a route");
      return;
    }
    
    // Prompt for route name
    const routeName = prompt("Enter a name for this route:", `Plaque Route (${routePoints.length} stops)`);
    
    if (!routeName) return; // User cancelled
    
    // Create route object
    const route = {
      id: Date.now(), // Use timestamp as ID
      name: routeName,
      created: new Date().toISOString(),
      points: routePoints.map(p => ({
        id: p.id,
        title: p.title,
        lat: parseFloat(p.latitude as unknown as string),
        lng: parseFloat(p.longitude as unknown as string)
      }))
    };
    
    // Get existing routes from localStorage
    let savedRoutes;
    try {
      savedRoutes = JSON.parse(localStorage.getItem('plaqueRoutes') || '[]');
    } catch (e) {
      savedRoutes = [];
    }
    
    // Add new route and save back to localStorage
    savedRoutes.push(route);
    localStorage.setItem('plaqueRoutes', JSON.stringify(savedRoutes));
    
    toast.success(`Route "${routeName}" saved successfully`);
  }, [routePoints]);

  // Clear current route
  const clearRoute = useCallback(() => {
    if (!mapInstance) return;
    
    // Remove route line if it exists
    if (mapInstance._routeLine) {
      mapInstance.removeLayer(mapInstance._routeLine);
      mapInstance._routeLine = null;
    }
    
    // Clear route points
    setRoutePoints([]);
    
    toast.info("Route cleared");
  }, [mapInstance, setRoutePoints]);

  return {
    findUserLocation,
    applyDistanceFilter,
    resetFilters,
    exportRoute,
    saveRoute,
    clearRoute
  };
}