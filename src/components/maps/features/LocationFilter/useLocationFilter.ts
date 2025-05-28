// src/components/maps/features/LocationFilter/useLocationFilter.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useLocationFilter = () => {
  const [isLocating, setIsLocating] = useState(false);
  
  const findMyLocation = useCallback(async (): Promise<[number, number] | null> => {
    setIsLocating(true);
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          setIsLocating(false);
          toast.error('Could not get your location');
          resolve(null);
        },
        { timeout: 10000 }
      );
    });
  }, []);
  
  const setManualLocation = useCallback(async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(address + ', London')}&limit=1`
      );
      const [place] = await response.json();
      
      if (place) {
        return [parseFloat(place.lat), parseFloat(place.lon)];
      }
      
      toast.error('Location not found');
      return null;
    } catch (error) {
      toast.error('Error searching for location');
      return null;
    }
  }, []);
  
  return {
    isLocating,
    findMyLocation,
    setManualLocation
  };
};