// src/components/map/hooks/useMapOperations.ts
import { useState, useCallback } from 'react';
import { Plaque } from '@/types/plaque';

interface MapState {
  center: [number, number];
  zoom: number;
  searchQuery: string;
  activeLocation: [number, number] | null;
  distanceFilter: number | null;
  selectedPlaque: Plaque | null;
  routeMode: boolean;
  routePoints: Plaque[];
  isSearching: boolean;
  mapStyle: 'street' | 'satellite' | 'terrain';
}

export const useMapOperations = (
  mapInstance: any,
  plaques: Plaque[],
  state: MapState
) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Find user's current location
  const findUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapInstance) {
          mapInstance.setView([latitude, longitude], 15);
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [mapInstance]);

  // Search for a location by address
  const searchLocation = useCallback(async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', London, UK')}&limit=1&bounded=1&viewbox=-0.489,51.28,0.236,51.686`
      );
      
      if (!response.ok) throw new Error('Location search failed');
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const coordinates: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
        
        if (mapInstance) {
          mapInstance.setView(coordinates, 15);
        }
        
        return coordinates;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching for location:', error);
      return null;
    }
  }, [mapInstance]);

  // Get plaques filtered by distance
  const getFilteredPlaques = useCallback((): Plaque[] => {
    if (!state.activeLocation || !state.distanceFilter) {
      return plaques;
    }

    return plaques.filter(plaque => {
      if (!plaque.latitude || !plaque.longitude) return false;
      
      const lat = parseFloat(plaque.latitude as string);
      const lng = parseFloat(plaque.longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      const distance = calculateDistance(
        state.activeLocation![0], 
        state.activeLocation![1], 
        lat, 
        lng
      );
      
      return distance <= state.distanceFilter!;
    });
  }, [plaques, state.activeLocation, state.distanceFilter]);

  // Get plaques that should be visible on map
  const getVisiblePlaques = useCallback((): Plaque[] => {
    // If we have a distance filter, use filtered plaques
    if (state.activeLocation && state.distanceFilter) {
      return getFilteredPlaques();
    }
    
    // If we have a search query, filter by that
    if (state.searchQuery.trim()) {
      const searchTerm = state.searchQuery.toLowerCase();
      return plaques.filter(plaque => 
        plaque.title?.toLowerCase().includes(searchTerm) ||
        plaque.inscription?.toLowerCase().includes(searchTerm) ||
        plaque.location?.toLowerCase().includes(searchTerm) ||
        plaque.address?.toLowerCase().includes(searchTerm) ||
        plaque.profession?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Otherwise show all plaques
    return plaques;
  }, [plaques, state.activeLocation, state.distanceFilter, state.searchQuery, getFilteredPlaques]);

  // Calculate distance between two geographic points
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Get nearby plaques for a given plaque
  const getNearbyPlaques = useCallback((targetPlaque: Plaque, radius: number = 1): Plaque[] => {
    if (!targetPlaque.latitude || !targetPlaque.longitude) return [];
    
    const targetLat = parseFloat(targetPlaque.latitude as string);
    const targetLng = parseFloat(targetPlaque.longitude as string);
    
    if (isNaN(targetLat) || isNaN(targetLng)) return [];

    return plaques
      .filter(plaque => {
        if (plaque.id === targetPlaque.id) return false;
        if (!plaque.latitude || !plaque.longitude) return false;
        
        const lat = parseFloat(plaque.latitude as string);
        const lng = parseFloat(plaque.longitude as string);
        
        if (isNaN(lat) || isNaN(lng)) return false;
        
        const distance = calculateDistance(targetLat, targetLng, lat, lng);
        return distance <= radius;
      })
      .sort((a, b) => {
        // Sort by distance, then by profession match, then by name
        const aDist = calculateDistance(
          targetLat, targetLng,
          parseFloat(a.latitude as string),
          parseFloat(a.longitude as string)
        );
        const bDist = calculateDistance(
          targetLat, targetLng,
          parseFloat(b.latitude as string),
          parseFloat(b.longitude as string)
        );
        
        if (Math.abs(aDist - bDist) < 0.1) { // If distances are very similar
          // Prefer same profession
          if (a.profession === targetPlaque.profession && b.profession !== targetPlaque.profession) return -1;
          if (b.profession === targetPlaque.profession && a.profession !== targetPlaque.profession) return 1;
          
          // Then prefer same postcode
          if (a.postcode === targetPlaque.postcode && b.postcode !== targetPlaque.postcode) return -1;
          if (b.postcode === targetPlaque.postcode && a.postcode !== targetPlaque.postcode) return 1;
        }
        
        return aDist - bDist;
      })
      .slice(0, 5); // Limit to 5 nearby plaques
  }, [plaques, calculateDistance]);

  // Fit map to show multiple plaques
  const fitToPlaques = useCallback((plaquesToFit: Plaque[]) => {
    if (!mapInstance || plaquesToFit.length === 0) return;

    const validPlaques = plaquesToFit.filter(p => p.latitude && p.longitude);
    if (validPlaques.length === 0) return;

    if (validPlaques.length === 1) {
      // Single plaque - center and zoom
      const plaque = validPlaques[0];
      const lat = parseFloat(plaque.latitude as string);
      const lng = parseFloat(plaque.longitude as string);
      mapInstance.setView([lat, lng], 16);
    } else {
      // Multiple plaques - fit bounds
      const coordinates = validPlaques.map(p => [
        parseFloat(p.latitude as string),
        parseFloat(p.longitude as string)
      ]);
      
      const L = (window as any).L;
      if (L) {
        const bounds = L.latLngBounds(coordinates);
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [mapInstance]);

  // Check if a point is within the current map bounds
  const isInViewport = useCallback((lat: number, lng: number): boolean => {
    if (!mapInstance) return true;
    
    const bounds = mapInstance.getBounds();
    return bounds.contains([lat, lng]);
  }, [mapInstance]);

  // Get map center and zoom for state management
  const getMapView = useCallback((): { center: [number, number]; zoom: number } => {
    if (!mapInstance) {
      return { center: [51.505, -0.09], zoom: 13 };
    }
    
    const center = mapInstance.getCenter();
    return {
      center: [center.lat, center.lng],
      zoom: mapInstance.getZoom()
    };
  }, [mapInstance]);

  // Move map to specific location
  const moveToLocation = useCallback((coordinates: [number, number], zoom?: number) => {
    if (!mapInstance) return;
    
    const targetZoom = zoom || mapInstance.getZoom();
    mapInstance.setView(coordinates, targetZoom);
  }, [mapInstance]);

  // Get current map bounds
  const getMapBounds = useCallback(() => {
    if (!mapInstance) return null;
    
    const bounds = mapInstance.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  }, [mapInstance]);

  return {
    // Location operations
    isLoadingLocation,
    findUserLocation,
    searchLocation,
    moveToLocation,
    
    // Plaque filtering and display
    getFilteredPlaques,
    getVisiblePlaques,
    getNearbyPlaques,
    
    // Map viewport operations
    fitToPlaques,
    isInViewport,
    getMapView,
    getMapBounds,
    
    // Utility functions
    calculateDistance
  };
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default useMapOperations;