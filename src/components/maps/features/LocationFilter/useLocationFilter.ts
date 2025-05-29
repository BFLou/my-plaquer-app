// src/components/maps/features/LocationFilter/useLocationFilter.ts - ENHANCED
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface LocationResult {
  coordinates: [number, number];
  name: string;
  type: 'current' | 'search';
}

export const useLocationFilter = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const findMyLocation = useCallback(async (): Promise<[number, number] | null> => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return null;
    }

    setIsLocating(true);
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const coords: [number, number] = [
            position.coords.latitude, 
            position.coords.longitude
          ];
          toast.success('Location found successfully');
          resolve(coords);
        },
        (error) => {
          setIsLocating(false);
          let message = 'Could not get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }
          
          toast.error(message);
          resolve(null);
        },
        { 
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);
  
  const setManualLocation = useCallback(async (address: string): Promise<[number, number] | null> => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return null;
    }

    setIsSearching(true);
    
    try {
      // Enhanced search with London focus and better error handling
      const searchQuery = address.includes('London') ? address : `${address}, London, UK`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1&` +
        `countrycodes=gb&viewbox=-0.489,51.28,0.236,51.686&bounded=1`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const place = data[0];
        const coords: [number, number] = [
          parseFloat(place.lat),
          parseFloat(place.lon)
        ];
        
        // Validate coordinates are in London area
        if (coords[0] < 51.2 || coords[0] > 51.7 || coords[1] < -0.5 || coords[1] > 0.3) {
          toast.warning('Location found but outside London area');
        } else {
          toast.success(`Location found: ${place.display_name.split(',')[0]}`);
        }
        
        return coords;
      } else {
        toast.error('Location not found. Try a more specific address.');
        return null;
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      toast.error('Error searching for location. Please try again.');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Enhanced search with suggestions
  const searchWithSuggestions = useCallback(async (query: string): Promise<LocationResult[]> => {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const searchQuery = query.includes('London') ? query : `${query}, London`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&` +
        `countrycodes=gb&viewbox=-0.489,51.28,0.236,51.686&bounded=1`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      return data.map((place: any) => ({
        coordinates: [parseFloat(place.lat), parseFloat(place.lon)] as [number, number],
        name: place.display_name.split(',').slice(0, 2).join(', '),
        type: 'search' as const
      }));
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }, []);

  // Reverse geocoding for coordinate-to-address conversion
  const reverseGeocode = useCallback(async (coords: [number, number]): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=16&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        // Return a shorter, more readable address
        const parts = data.display_name.split(',');
        return parts.slice(0, 2).join(', ');
      }
      
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
    }
  }, []);

  // Validate if coordinates are in London area
  const isInLondon = useCallback((coords: [number, number]): boolean => {
    const [lat, lng] = coords;
    return lat >= 51.2 && lat <= 51.7 && lng >= -0.5 && lng <= 0.3;
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((
    coords1: [number, number], 
    coords2: [number, number]
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);
  
  return {
    isLocating,
    isSearching,
    findMyLocation,
    setManualLocation,
    searchWithSuggestions,
    reverseGeocode,
    isInLondon,
    calculateDistance
  };
};