// src/components/maps/hooks/useMapOperations.ts
import { useCallback, useState, useRef } from 'react';
import { Plaque } from '@/types/plaque';
import { calculateDistance } from '../utils/routeUtils';

/**
 * Custom hook for map operations like location finding, filtering, etc.
 */
export default function useMapOperations(
  mapInstance: any,
  plaques: Plaque[],
  maxDistance: number,
  setIsLoadingLocation: (loading: boolean) => void,
  setFilteredPlaquesCount: (count: number) => void,
  routePoints: Plaque[],
  setUserLocation?: React.Dispatch<React.SetStateAction<[number, number] | null>>
) {
  const [userLocationMarker, setUserLocationMarker] = useState<any>(null);
  const [accuracyCircle, setAccuracyCircle] = useState<any>(null);
  const [distanceCircle, setDistanceCircle] = useState<any>(null);
  const routeLineRef = useRef<any>(null);
  
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
          
          // Clear previous location markers if exist
          if (userLocationMarker) {
            mapInstance.removeLayer(userLocationMarker);
          }
          if (accuracyCircle) {
            mapInstance.removeLayer(accuracyCircle);
          }
          
          // Add user location marker
          const L = window.L;
          
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
    userLocationMarker, 
    accuracyCircle, 
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
    
    // Clear distance circle
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
      // Use OpenStreetMap's Nominatim service for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to search for location: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Get first result
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
        
        // Remove previous location markers if they exist
        if (userLocationMarker) {
          mapInstance.removeLayer(userLocationMarker);
        }
        if (accuracyCircle) {
          mapInstance.removeLayer(accuracyCircle);
        }
        
        const L = window.L;
        
        // Create marker for search location with improved styling
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
        
        // Add popup with improved location info
        const popupContent = `
          <div class="p-3">
            <div class="font-medium text-sm">${displayAddress}</div>
            <div class="text-xs text-gray-500 mt-1">
              <span class="font-medium">Type:</span> ${result.type || 'Location'}
            </div>
            ${result.boundingbox ? `
              <div class="text-xs text-gray-500 mt-1">
                <span class="font-medium">Area:</span> ${Math.round((result.boundingbox[2] - result.boundingbox[0]) * 111)} × ${Math.round((result.boundingbox[3] - result.boundingbox[1]) * 111)} km
              </div>
            ` : ''}
          </div>
        `;
        
        searchLocationMarker.bindPopup(popupContent).openPopup();
        
        // Create accuracy circle with animation
        const searchAccuracyCircle = L.circle([lat, lon], {
          radius: result.importance ? Math.max(300, Math.min(2000, 2000 * (1 - result.importance))) : 300, // Scale radius based on importance
          fillColor: '#ef4444',
          fillOpacity: 0.08,
          color: '#ef4444',
          weight: 2,
          opacity: 0.5
        }).addTo(mapInstance);
        
        // Store references
        setUserLocationMarker(searchLocationMarker);
        setAccuracyCircle(searchAccuracyCircle);
        
        // Calculate a good zoom level based on the type of location
        let zoomLevel = 15; // Default zoom level
        
        if (result.type === 'country') zoomLevel = 6;
        else if (result.type === 'state' || result.type === 'region') zoomLevel = 8;
        else if (result.type === 'county') zoomLevel = 10;
        else if (result.type === 'city' || result.type === 'town') zoomLevel = 12;
        else if (result.type === 'village' || result.type === 'suburb') zoomLevel = 14;
        else if (result.type === 'street' || result.type === 'road') zoomLevel = 16;
        else if (result.type === 'building' || result.type === 'house') zoomLevel = 18;
        
        // Use bounds if available for better view
        if (result.boundingbox) {
          try {
            const bbox = result.boundingbox.map(parseFloat);
            const bounds = L.latLngBounds([
              [bbox[0], bbox[2]], // Southwest
              [bbox[1], bbox[3]]  // Northeast
            ]);
            
            if (bounds.isValid()) {
              mapInstance.fitBounds(bounds, { padding: [50, 50] });
            } else {
              mapInstance.flyTo([lat, lon], zoomLevel, {
                animate: true,
                duration: 1.5
              });
            }
          } catch (e) {
            // Fallback to simple flyTo if bounds parsing fails
            mapInstance.flyTo([lat, lon], zoomLevel, {
              animate: true,
              duration: 1.5
            });
          }
        } else {
          // No bounds available, use flyTo
          mapInstance.flyTo([lat, lon], zoomLevel, {
            animate: true,
            duration: 1.5
          });
        }
        
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
    userLocationMarker, 
    accuracyCircle, 
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

  // Draw basic route (without API - this is a simplified version)
  const drawRoute = useCallback((points: Plaque[]) => {
    if (!window.L || !mapInstance || points.length < 2) return;
    
    // Clear existing route
    if (routeLineRef.current) {
      mapInstance.removeLayer(routeLineRef.current);
    }
    
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
  }, [mapInstance]);

  return {
    findUserLocation,
    applyDistanceFilter,
    resetFilters,
    drawRoute,
    clearRoute,
    searchPlaceByAddress
  };
}