// src/components/maps/hooks/useMapOperations.ts
import { useCallback, useState } from 'react';
import { Plaque } from '@/types/plaque';
import { toast } from 'sonner';
import { calculateRouteDistance } from '../utils/routeUtils';

export default function useMapOperations(
  mapInstance: any,
  plaques: Plaque[],
  maxDistance: number,
  setIsLoadingLocation: (loading: boolean) => void,
  setFilteredPlaquesCount: (count: number) => void,
  routePoints: Plaque[],
  setRoutePoints: React.Dispatch<React.SetStateAction<Plaque[]>>,
  setUserLocation?: React.Dispatch<React.SetStateAction<[number, number] | null>>
) {
  const [userLocationMarker, setUserLocationMarker] = useState<any>(null);
  const [accuracyCircle, setAccuracyCircle] = useState<any>(null);
  const [routeLine, setRouteLine] = useState<any>(null);
  const [distanceCircle, setDistanceCircle] = useState<any>(null);
  
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
          
          // Clear previous location markers if exist
          if (userLocationMarker) {
            mapInstance.removeLayer(userLocationMarker);
          }
          if (accuracyCircle) {
            mapInstance.removeLayer(accuracyCircle);
          }
          
          // Add user location marker
          const L = window.L;
          
          // Create pulse effect style
          const pulseStyle = document.createElement('style');
          pulseStyle.innerHTML = `
            .user-location-pulse {
              animation: pulse 1.5s infinite;
            }
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
          `;
          document.head.appendChild(pulseStyle);
          
          // Create fancy user location marker with pulse effect
          const newUserMarker = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="position: relative; width: 100%; height: 100%;">
                <div class="user-location-pulse" style="position: absolute; top: -14px; left: -14px; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.3);"></div>
                <div style="position: absolute; top: -8px; left: -8px; width: 16px; height: 16px; border-radius: 50%; background-color: #3b82f6; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);"></div>
              </div>
            `,
            iconSize: [0, 0],
          });
          
          const userMarker = L.marker([latitude, longitude], {
            icon: newUserMarker,
            zIndexOffset: 1000,
          }).addTo(mapInstance);
          
          // Add accuracy circle with better styling
          const newAccuracyCircle = L.circle([latitude, longitude], {
            radius: position.coords.accuracy,
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            color: '#3b82f6',
            weight: 1,
            opacity: 0.5
          }).addTo(mapInstance);
          
          // Store references
          setUserLocationMarker(userMarker);
          setAccuracyCircle(newAccuracyCircle);
          
          // Pan to location with smooth animation
          mapInstance.flyTo([latitude, longitude], 15, {
            animate: true,
            duration: 1
          });
          
          // Update user location state if callback provided
          if (setUserLocation) {
            setUserLocation([latitude, longitude]);
          }
          
          // Filter plaques by distance and update count
          const plaquesInRange = filterPlaquesInRange([latitude, longitude], maxDistance);
          setFilteredPlaquesCount(plaquesInRange.length);
          
          setIsLoadingLocation(false);
          toast.success("Location found! You can now use distance filtering.");
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          
          // Show appropriate error message based on error code
          if (error.code === 1) {
            toast.error("Location access denied. Please check your browser permissions.");
          } else if (error.code === 2) {
            toast.error("Your position is unavailable. Try again later.");
          } else if (error.code === 3) {
            toast.error("Location request timed out. Please try again.");
          } else {
            toast.error("Could not access your location. Please check your settings.");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  }, [mapInstance, maxDistance, setIsLoadingLocation, setFilteredPlaquesCount, userLocationMarker, accuracyCircle, setUserLocation]);

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
    if (distanceCircle) {
      mapInstance.removeLayer(distanceCircle);
    }
    
    // Create new circle with improved styling
    const circle = L.circle(center, {
      radius: radiusKm * 1000, // Convert km to meters
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      color: '#3b82f6',
      weight: 2,
      opacity: 0.6,
      dashArray: '5, 5',
    }).addTo(mapInstance);
    
    // Show distance as label
    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'distance-label',
        html: `<div class="px-2 py-1 bg-white rounded-full shadow-md text-xs text-blue-600 font-medium">${radiusKm} km</div>`,
        iconAnchor: [25, 0]
      })
    }).addTo(mapInstance);
    
    // Store references
    setDistanceCircle(circle);
    
    // Fit bounds to show entire filter area
    mapInstance.fitBounds(circle.getBounds(), {
      padding: [30, 30],
      maxZoom: 15,
      animate: true
    });
    
    return circle;
  }, [mapInstance, distanceCircle]);

  // Apply distance filter
  const applyDistanceFilter = useCallback(() => {
    if (!mapInstance || !navigator.geolocation) {
      toast.error("Location services are not available");
      return;
    }
    
    // Get current user location if already available
    if (userLocationMarker) {
      const latlng = userLocationMarker.getLatLng();
      const center: [number, number] = [latlng.lat, latlng.lng];
      
      // Draw distance circle
      drawDistanceCircle(center, maxDistance);
      
      // Filter plaques by distance
      const plaquesInRange = filterPlaquesInRange(center, maxDistance);
      setFilteredPlaquesCount(plaquesInRange.length);
      
      toast.success(`Found ${plaquesInRange.length} plaques within ${maxDistance} km`);
      return;
    }
    
    // Otherwise, get location first
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
  }, [mapInstance, maxDistance, drawDistanceCircle, filterPlaquesInRange, setFilteredPlaquesCount, userLocationMarker]);

  // Reset filters
  const resetFilters = useCallback(() => {
    if (!mapInstance) return;
    
    // Clear distance circle
    if (distanceCircle) {
      mapInstance.removeLayer(distanceCircle);
      setDistanceCircle(null);
    }
    
    // Reset filter count
    setFilteredPlaquesCount(0);
    
    toast.info("Distance filter has been reset");
  }, [mapInstance, distanceCircle, setFilteredPlaquesCount]);

  // Draw route on the map
  const drawRoute = useCallback((points: Plaque[]) => {
    if (!window.L || !mapInstance || points.length < 2) return;
    
    const L = window.L;
    
    // Clear existing route line
    if (routeLine) {
      mapInstance.removeLayer(routeLine);
    }
    
    // Get coordinates for each point
    const latLngs = points
      .filter(p => p.latitude && p.longitude)
      .map(p => [
        parseFloat(p.latitude as unknown as string),
        parseFloat(p.longitude as unknown as string)
      ]);
    
    if (latLngs.length < 2) return;
    
    // Create polyline with animated dash effect
    const routePolyline = L.polyline(latLngs, {
      color: '#10b981', // green-500
      weight: 4,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '10, 10',
      className: 'animated-dash'
    });
    
    // Add animated dash styling
    const style = document.createElement('style');
    style.innerHTML = `
      .animated-dash {
        animation: dash 30s linear infinite;
      }
      @keyframes dash {
        to {
          stroke-dashoffset: -1000;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add route markers
    const routeMarkers = points.map((p, index) => {
      if (!p.latitude || !p.longitude) return null;
      
      const lat = parseFloat(p.latitude as unknown as string);
      const lng = parseFloat(p.longitude as unknown as string);
      
      if (isNaN(lat) || isNaN(lng)) return null;
      
      // Create marker icon based on position in route
      let markerColor = '#10b981'; // green-500
      let markerLabel = `${index + 1}`;
      let iconSize = 24;
      
      if (index === 0) {
        markerColor = '#3b82f6'; // blue-500 for start
        markerLabel = 'S';
        iconSize = 28;
      } else if (index === points.length - 1) {
        markerColor = '#ef4444'; // red-500 for end
        markerLabel = 'E';
        iconSize = 28;
      }
      
      // Create custom marker icon
      const icon = L.divIcon({
        className: 'route-marker-icon',
        html: `
          <div style="width: ${iconSize}px; height: ${iconSize}px; display: flex; align-items: center; justify-content: center; background-color: ${markerColor}; color: white; border-radius: 50%; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${markerLabel}
          </div>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize/2, iconSize/2]
      });
      
      return L.marker([lat, lng], { icon });
    }).filter(Boolean);
    
    // Create a feature group for the route
    const routeGroup = L.featureGroup([routePolyline, ...routeMarkers]);
    routeGroup.addTo(mapInstance);
    
    // Store reference
    setRouteLine(routeGroup);
    
    // Fit map to show entire route with padding
    const bounds = routePolyline.getBounds();
    mapInstance.fitBounds(bounds, { 
      padding: [70, 70],
      maxZoom: 16,
      animate: true
    });
    
    // Add distance tooltip to polyline
    const distance = calculateRouteDistance(points);
    const center = routePolyline.getCenter();
    
    L.marker(center, {
      icon: L.divIcon({
        className: 'route-distance-label',
        html: `<div class="px-2 py-1 bg-white rounded-full shadow-md text-xs text-green-600 font-medium">${distance.toFixed(1)} km</div>`,
        iconAnchor: [30, 0]
      })
    }).addTo(routeGroup);
    
    return routeGroup;
  }, [mapInstance, routeLine]);

  // Clear route from map
  const clearRoute = useCallback((clearPoints = true) => {
    if (!mapInstance) return;
    
    // Remove route line if it exists
    if (routeLine) {
      mapInstance.removeLayer(routeLine);
      setRouteLine(null);
    }
    
    // Clear route points if requested
    if (clearPoints) {
      setRoutePoints([]);
    }
  }, [mapInstance, routeLine, setRoutePoints]);

  // Export route as GeoJSON
  const exportRoute = useCallback(() => {
    if (routePoints.length < 2) {
      toast.error("Add at least two points to export a route");
      return;
    }
    
    // Create GeoJSON data with more detailed properties
    const routeData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Plaque Route",
            description: `Route with ${routePoints.length} plaques`,
            distance: calculateRouteDistance(routePoints),
            points: routePoints.map(p => ({
              id: p.id,
              title: p.title,
              description: p.inscription || '',
              address: p.address || p.location || ''
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
        },
        // Add individual points as separate features
        ...routePoints.map((p, index) => ({
          type: "Feature",
          properties: {
            name: p.title,
            id: p.id,
            index: index + 1,
            description: p.inscription || '',
            address: p.address || p.location || '',
            type: index === 0 ? 'start' : (index === routePoints.length - 1 ? 'end' : 'waypoint')
          },
          geometry: {
            type: "Point",
            coordinates: [
              parseFloat(p.longitude as unknown as string),
              parseFloat(p.latitude as unknown as string)
            ]
          }
        }))
      ]
    };
    
    // Convert to JSON string with formatting
    const dataStr = JSON.stringify(routeData, null, 2);
    
    // Create download link
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `plaque-route-${new Date().toISOString().slice(0, 10)}.geojson`);
    a.click();
    
    toast.success("Route exported successfully as GeoJSON");
  }, [routePoints]);

  // Save route to localStorage
  const saveRoute = useCallback(() => {
    if (routePoints.length < 2) {
      toast.error("Add at least two points to save a route");
      return;
    }
    
    // Prompt for route name with better default
    const now = new Date();
    const defaultName = `Plaque Route - ${now.toLocaleDateString()} (${routePoints.length} stops)`;
    const routeName = prompt("Enter a name for this route:", defaultName);
    
    if (!routeName) return; // User cancelled
    
    // Get or initialize saved routes
    let savedRoutes;
    try {
      savedRoutes = JSON.parse(localStorage.getItem('plaqueRoutes') || '[]');
    } catch (e) {
      savedRoutes = [];
    }
    
    // Create route object with more details
    const route = {
      id: Date.now(),
      name: routeName,
      created: new Date().toISOString(),
      distance: calculateRouteDistance(routePoints),
      points: routePoints.map(p => ({
        id: p.id,
        title: p.title,
        lat: parseFloat(p.latitude as unknown as string),
        lng: parseFloat(p.longitude as unknown as string),
        address: p.address || p.location || '',
        color: p.color || 'blue'
      }))
    };
    
    // Add new route and save back to localStorage
    savedRoutes.push(route);
    localStorage.setItem('plaqueRoutes', JSON.stringify(savedRoutes));
    
    toast.success(`Route "${routeName}" saved successfully`);
  }, [routePoints]);

  // Search for a place by address using Nominatim (OpenStreetMap search API)
  const searchPlaceByAddress = useCallback(async (address: string): Promise<boolean> => {
    if (!address || !mapInstance || !window.L) return false;
    
    try {
      // Use OpenStreetMap's Nominatim service for geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Get first result
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        // Update user location
        if (setUserLocation) {
          setUserLocation([lat, lon]);
        }
        
        // Remove previous location markers if exist
        if (userLocationMarker) {
          mapInstance.removeLayer(userLocationMarker);
        }
        if (accuracyCircle) {
          mapInstance.removeLayer(accuracyCircle);
        }
        
        const L = window.L;
        
        // Create marker for search location
        const searchLocationMarker = L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'search-location-marker',
            html: `
              <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
                <div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(mapInstance);
        
        // Add popup with location info
        searchLocationMarker.bindPopup(`
          <div class="p-2">
            <div class="font-medium text-sm">${result.display_name}</div>
            <div class="text-xs text-gray-500 mt-1">Type: ${result.type}</div>
          </div>
        `).openPopup();
        
        // Add accuracy circle to show approximate area
        const searchAccuracyCircle = L.circle([lat, lon], {
          radius: 300, // Arbitrary radius for search results
          fillColor: '#ef4444',
          fillOpacity: 0.1,
          color: '#ef4444',
          weight: 1,
          opacity: 0.5
        }).addTo(mapInstance);
        
        // Store references
        setUserLocationMarker(searchLocationMarker);
        setAccuracyCircle(searchAccuracyCircle);
        
        // Fly to location
        mapInstance.flyTo([lat, lon], 15, {
          animate: true,
          duration: 1
        });
        
        // Calculate plaques in range
        const plaquesInRange = filterPlaquesInRange([lat, lon], maxDistance);
        setFilteredPlaquesCount(plaquesInRange.length);
        
        return true;
      } else {
        toast.error("Location not found. Please try a more specific address.");
        return false;
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      toast.error("Error searching for location. Please try again.");
      return false;
    }
  }, [mapInstance, maxDistance, userLocationMarker, accuracyCircle, setUserLocation, filterPlaquesInRange, setFilteredPlaquesCount]);

  return {
    findUserLocation,
    applyDistanceFilter,
    resetFilters,
    exportRoute,
    saveRoute,
    drawRoute,
    clearRoute,
    searchPlaceByAddress
  };
}