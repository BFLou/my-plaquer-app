// src/components/maps/hooks/useMapOperations.ts - Complete version with all fixes
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
  const [searchLocationMarker, setSearchLocationMarker] = useState<any>(null);
  const [accuracyCircle, setAccuracyCircle] = useState<any>(null);
  const [distanceCircle, setDistanceCircle] = useState<any>(null);
  const [activeLocation, setActiveLocation] = useState<[number, number] | null>(null);
  const [locationType, setLocationType] = useState<'user' | 'search' | null>(null);
  const routeLineRef = useRef<any>(null);
  
  // Clear all location-related overlays
  const clearLocationOverlays = useCallback(() => {
    if (userLocationMarker) {
      mapInstance.removeLayer(userLocationMarker);
      setUserLocationMarker(null);
    }
    if (searchLocationMarker) {
      mapInstance.removeLayer(searchLocationMarker);
      setSearchLocationMarker(null);
    }
    if (accuracyCircle) {
      mapInstance.removeLayer(accuracyCircle);
      setAccuracyCircle(null);
    }
    if (distanceCircle) {
      mapInstance.removeLayer(distanceCircle);
      setDistanceCircle(null);
    }
  }, [mapInstance, userLocationMarker, searchLocationMarker, accuracyCircle, distanceCircle]);
  
  // Clear only distance circle (for redraws)
  const clearDistanceCircle = useCallback(() => {
    if (distanceCircle) {
      mapInstance.removeLayer(distanceCircle);
      setDistanceCircle(null);
    }
  }, [mapInstance, distanceCircle]);
  
  // Find user's current location
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
          
          // Clear existing markers but keep search location if it exists
          if (userLocationMarker) {
            mapInstance.removeLayer(userLocationMarker);
          }
          if (accuracyCircle) {
            mapInstance.removeLayer(accuracyCircle);
          }
          
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
          
          // Add accuracy circle if reasonable (and not too large)
          if (position.coords.accuracy < 50) {
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
          setActiveLocation([latitude, longitude]);
          setLocationType('user');
          
          // Pan to location
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
    setUserLocation,
    userLocationMarker,
    accuracyCircle
  ]);

  // Set search location (from address search)
  const setSearchLocation = useCallback((coordinates: [number, number], address: string) => {
    if (!mapInstance || !window.L) return;
    
    const L = window.L;
    
    // Clear existing search marker
    if (searchLocationMarker) {
      mapInstance.removeLayer(searchLocationMarker);
    }
    
    // Create search location marker
    const searchMarker = L.marker(coordinates, {
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
    
    // Add popup with location info
    const popupContent = `
      <div class="p-3">
        <div class="font-medium text-sm">${address}</div>
        <div class="text-xs text-gray-500 mt-1">
          <span class="font-medium">Search Location</span>
        </div>
      </div>
    `;
    
    searchMarker.bindPopup(popupContent);
    
    // Store references
    setSearchLocationMarker(searchMarker);
    setActiveLocation(coordinates);
    setLocationType('search');
    
    // Update user location state
    if (setUserLocation) {
      setUserLocation(coordinates);
    }
    
    // Calculate nearby plaques
    const plaquesInRange = filterPlaquesInRange(coordinates, maxDistance);
    setFilteredPlaquesCount(plaquesInRange.length);
    
  }, [mapInstance, searchLocationMarker, maxDistance, setUserLocation, setFilteredPlaquesCount]);

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

  // Draw distance circle around active location - FIXED to prevent overlapping
  const drawDistanceCircle = useCallback((center: [number, number], radiusKm: number) => {
    if (!window.L || !mapInstance) return;
    
    const L = window.L;
    
    // ALWAYS remove existing distance circle first
    clearDistanceCircle();
    
    // Create new distance circle WITHOUT distance text
    const circle = L.circle(center, {
      radius: radiusKm * 1000, // Convert km to meters
      fillColor: '#10b981', // Green color
      fillOpacity: 0.15,
      color: '#10b981',
      weight: 2,
      opacity: 0.8,
      dashArray: '8, 4',
    }).addTo(mapInstance);
    
    // Store reference - NO LABEL/TEXT
    setDistanceCircle(circle);
    
    // Fit bounds to show entire filter area
    mapInstance.fitBounds(circle.getBounds(), {
      padding: [30, 30],
      maxZoom: 15,
      animate: true
    });
    
    return circle;
  }, [mapInstance, clearDistanceCircle]);

  // Apply distance filter using active location
  const applyDistanceFilter = useCallback(() => {
    if (!activeLocation) {
      console.log('No active location for distance filter');
      return;
    }
    
    // Draw distance circle around active location
    drawDistanceCircle(activeLocation, maxDistance);
    
    // Filter plaques by distance
    const plaquesInRange = filterPlaquesInRange(activeLocation, maxDistance);
    setFilteredPlaquesCount(plaquesInRange.length);
    
    console.log(`Applied ${maxDistance}km filter around ${locationType} location, found ${plaquesInRange.length} plaques`);
    
  }, [activeLocation, maxDistance, drawDistanceCircle, filterPlaquesInRange, setFilteredPlaquesCount, locationType]);

  // Reset filters
  const resetFilters = useCallback(() => {
    if (!mapInstance) return;
    
    // Clear distance circle only, keep location markers
    clearDistanceCircle();
    
    // Reset filter count
    setFilteredPlaquesCount(0);
  }, [mapInstance, clearDistanceCircle, setFilteredPlaquesCount]);

  // Search for a place by address with geocoding
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
        
        // Set search location
        setSearchLocation([lat, lon], result.display_name);
        
        // Pan to location
        mapInstance.flyTo([lat, lon], 15, {
          animate: true,
          duration: 1.5
        });
        
        return true;
      } else {
        return false;
      }
      
    } catch (error) {
      console.error('Error searching for location:', error);
      return false;
    }
  }, [mapInstance, setSearchLocation]);

  // Clear route
  const clearRoute = useCallback(() => {
    if (routeLineRef.current && mapInstance) {
      mapInstance.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  }, [mapInstance]);

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
    setSearchLocation,
    applyDistanceFilter,
    resetFilters,
    drawRoute,
    clearRoute,
    searchPlaceByAddress,
    activeLocation,
    locationType,
    filterPlaquesInRange  // Export this function so it can be used in the main component
  };
}