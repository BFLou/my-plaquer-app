// src/components/maps/hooks/useMapOperations.ts - Fixed double circle issue
import { useCallback, useState, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import { calculateDistance } from '../utils/routeUtils';

export default function useMapOperations(
  mapInstance: any,
  plaques: Plaque[],
  maxDistance: number,
  setIsLoadingLocation: (loading: boolean) => void,
  setFilteredPlaquesCount: (count: number) => void,
  routePoints: Plaque[],
  setUserLocation?: React.Dispatch<React.SetStateAction<[number, number] | null>>,
  useImperial: boolean = false
) {
  const [userLocationMarker, setUserLocationMarker] = useState<any>(null);
  const [accuracyCircle, setAccuracyCircle] = useState<any>(null);
  const [distanceCircle, setDistanceCircle] = useState<any>(null);
  const routeLineRef = useRef<any>(null);
  
  // Clear all location-related overlays
  const clearLocationOverlays = useCallback(() => {
    if (userLocationMarker) {
      mapInstance.removeLayer(userLocationMarker);
      setUserLocationMarker(null);
    }
    if (accuracyCircle) {
      mapInstance.removeLayer(accuracyCircle);
      setAccuracyCircle(null);
    }
    if (distanceCircle) {
      mapInstance.removeLayer(distanceCircle);
      setDistanceCircle(null);
    }
  }, [mapInstance, userLocationMarker, accuracyCircle, distanceCircle]);
  
  // Find user's location
  const findUserLocation = useCallback(() => {
    if (!mapInstance || !window.L) {
      console.log("Map or Leaflet not available for location");
      return;
    }
    
    setIsLoadingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Clear existing location overlays
          clearLocationOverlays();
          
          const L = window.L;
          
          // Add user location marker with improved styling
          const userMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: `
                <div style="position: relative; width: 100%; height: 100%;">
                  <div style="position: absolute; top: -14px; left: -14px; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.3); animation: pulse 1.5s infinite;"></div>
                  <div style="position: absolute; top: -8px; left: -8px; width: 16px; height: 16px; border-radius: 50%; background-color: #3b82f6; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);"></div>
                </div>
              `,
              iconSize: [0, 0],
            })
          }).addTo(mapInstance);
          
          // Only add accuracy circle if it's significantly different from the distance filter
          // and the accuracy is reasonable (less than 100m)
          if (position.coords.accuracy < 100) {
            const newAccuracyCircle = L.circle([latitude, longitude], {
              radius: position.coords.accuracy,
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              color: '#3b82f6',
              weight: 1,
              opacity: 0.3,
              dashArray: '2, 4'
            }).addTo(mapInstance);
            
            setAccuracyCircle(newAccuracyCircle);
          }
          
          // Store references
          setUserLocationMarker(userMarker);
          
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
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  }, [
    mapInstance, 
    maxDistance, 
    setIsLoadingLocation, 
    setFilteredPlaquesCount, 
    clearLocationOverlays,
    setUserLocation
  ]);

  // Filter plaques within a certain distance of a point
  const filterPlaquesInRange = useCallback((center: [number, number], radiusKm: number): Plaque[] => {
    return plaques.filter(plaque => {
      if (!plaque.latitude || !plaque.longitude) return false;
      
      const lat = parseFloat(plaque.latitude);
      const lng = parseFloat(plaque.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      const distance = calculateDistance(center[0], center[1], lat, lng);
      return distance <= radiusKm;
    });
  }, [plaques]);

  // Draw distance circle around user location - SINGLE CIRCLE ONLY
  const drawDistanceCircle = useCallback((center: [number, number], radiusKm: number) => {
    if (!window.L || !mapInstance) return;
    
    const L = window.L;
    
    // Remove existing distance circle
    if (distanceCircle) {
      mapInstance.removeLayer(distanceCircle);
    }
    
    // Create new distance circle with clear styling
    const circle = L.circle(center, {
      radius: radiusKm * 1000, // Convert km to meters
      fillColor: '#10b981', // Different color from accuracy circle
      fillOpacity: 0.15,
      color: '#10b981',
      weight: 2,
      opacity: 0.8,
      dashArray: '8, 4',
    }).addTo(mapInstance);
    
    // Show distance as label
    const displayDistance = useImperial 
      ? `${(radiusKm * 0.621371).toFixed(1)} mi`
      : `${radiusKm.toFixed(1)} km`;
      
    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'distance-label',
        html: `<div class="px-2 py-1 bg-white rounded-full shadow-md text-xs text-green-600 font-medium border border-green-200">${displayDistance}</div>`,
        iconAnchor: [25, -5]
      })
    }).addTo(mapInstance);
    
    // Store references (combine circle and label as a group)
    const distanceGroup = L.featureGroup([circle, label]);
    setDistanceCircle(distanceGroup);
    
    // Fit bounds to show entire filter area
    mapInstance.fitBounds(circle.getBounds(), {
      padding: [30, 30],
      maxZoom: 15,
      animate: true
    });
    
    return distanceGroup;
  }, [mapInstance, distanceCircle, useImperial]);

  // Apply distance filter
  const applyDistanceFilter = useCallback(() => {
    if (!mapInstance || !navigator.geolocation) {
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
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }, [
    mapInstance, 
    maxDistance, 
    drawDistanceCircle, 
    filterPlaquesInRange, 
    setFilteredPlaquesCount, 
    userLocationMarker
  ]);

  // Reset filters
  const resetFilters = useCallback(() => {
    if (!mapInstance) return;
    
    // Clear distance circle only, keep user location marker
    if (distanceCircle) {
      mapInstance.removeLayer(distanceCircle);
      setDistanceCircle(null);
    }
    
    // Reset filter count
    setFilteredPlaquesCount(0);
  }, [mapInstance, distanceCircle, setFilteredPlaquesCount]);

  // Enhanced search for a place by address with autocomplete results
  const searchPlaceByAddress = useCallback(async (address: string): Promise<boolean> => {
    if (!address.trim() || !mapInstance || !window.L) return false;
    
    try {
      // Use OpenStreetMap's Nominatim service for geocoding (London-focused)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', London, UK')}&limit=1&bounded=1&viewbox=-0.489,51.28,0.236,51.686`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to search for location: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        if (isNaN(lat) || isNaN(lon)) {
          throw new Error('Invalid coordinates returned from geocoding service');
        }
        
        // Update user location state
        if (setUserLocation) {
          setUserLocation([lat, lon]);
        }
        
        // Clear previous location overlays
        clearLocationOverlays();
        
        const L = window.L;
        
        // Create marker for search location
        const searchLocationMarker = L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'search-location-marker',
            html: `
              <div style="
                position: relative;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  position: absolute;
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  background-color: rgba(239, 68, 68, 0.2);
                  animation: pulse 2s infinite;
                "></div>
                <div style="
                  width: 16px;
                  height: 16px;
                  background-color: #ef4444;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  z-index: 1;
                "></div>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })
        }).addTo(mapInstance);
        
        // Format address for display
        const displayAddress = result.display_name.split(',').slice(0, 3).join(', ');
        
        // Add popup with location info
        const popupContent = `
          <div class="p-3">
            <div class="font-medium text-sm">${displayAddress}</div>
            <div class="text-xs text-gray-500 mt-1">
              <span class="font-medium">Type:</span> ${result.type || 'Location'}
            </div>
          </div>
        `;
        
        searchLocationMarker.bindPopup(popupContent).openPopup();
        
        // Store references
        setUserLocationMarker(searchLocationMarker);
        
        // Calculate zoom level based on location type
        let zoomLevel = 15;
        if (result.type === 'country') zoomLevel = 6;
        else if (result.type === 'state' || result.type === 'region') zoomLevel = 8;
        else if (result.type === 'county') zoomLevel = 10;
        else if (result.type === 'city' || result.type === 'town') zoomLevel = 12;
        else if (result.type === 'village' || result.type === 'suburb') zoomLevel = 14;
        else if (result.type === 'street' || result.type === 'road') zoomLevel = 16;
        else if (result.type === 'building' || result.type === 'house') zoomLevel = 18;
        
        // Fly to location
        mapInstance.flyTo([lat, lon], zoomLevel, {
          animate: true,
          duration: 1.5
        });
        
        // Calculate plaques in range
        const plaquesInRange = filterPlaquesInRange([lat, lon], maxDistance);
        setFilteredPlaquesCount(plaquesInRange.length);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      return false;
    }
  }, [
    mapInstance, 
    maxDistance, 
    clearLocationOverlays,
    setUserLocation, 
    filterPlaquesInRange, 
    setFilteredPlaquesCount
  ]);

  // Clear route
  const clearRoute = useCallback(() => {
    if (routeLineRef.current && mapInstance) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  }, [mapInstance]);

  // Draw basic route
// Draw basic route
  const drawRoute = useCallback((points: Plaque[]) => {
    if (!window.L || !mapInstance || points.length < 2) return;
    
    clearRoute();
    
    try {
      const L = window.L;
      const routeGroup = L.featureGroup().addTo(mapInstance);
      
      // Get coordinates for each point
      const latLngs = points
        .filter(p => p.latitude && p.longitude)
        .map(p => [
          parseFloat(p.latitude), 
          parseFloat(p.longitude)
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
      }).addTo(routeGroup);
      
      // Fit bounds to show entire route
      mapInstance.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
      
      // Store reference
      routeLineRef.current = routeGroup;
      
      return routeGroup;
    } catch (error) {
      console.error("Error creating route:", error);
      return null;
    }
  }, [mapInstance, clearRoute]);

  return {
    findUserLocation,
    applyDistanceFilter,
    resetFilters,
    drawRoute,
    clearRoute,
    searchPlaceByAddress
  };
}