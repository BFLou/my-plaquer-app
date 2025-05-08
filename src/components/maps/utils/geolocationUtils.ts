// src/components/maps/utils/geolocationUtils.ts

/**
 * Options for the getCurrentPosition function
 */
interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }
  
  /**
   * Result of the getCurrentPosition function
   */
  interface GeolocationResult {
    success: boolean;
    coords?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      altitude?: number | null;
      altitudeAccuracy?: number | null;
      heading?: number | null;
      speed?: number | null;
    };
    error?: {
      code: number;
      message: string;
      PERMISSION_DENIED?: boolean;
      POSITION_UNAVAILABLE?: boolean;
      TIMEOUT?: boolean;
    };
  }
  
  /**
   * Get current position with a Promise API
   * @param options - Geolocation options
   * @returns Promise that resolves with the geolocation result
   */
  export const getCurrentPosition = (options: GeolocationOptions = {}): Promise<GeolocationResult> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: {
            code: 0,
            message: 'Geolocation is not supported by this browser'
          }
        });
        return;
      }
      
      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      
      const geolocationOptions = { ...defaultOptions, ...options };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            }
          });
        },
        (error) => {
          resolve({
            success: false,
            error: {
              code: error.code,
              message: error.message,
              PERMISSION_DENIED: error.code === 1,
              POSITION_UNAVAILABLE: error.code === 2,
              TIMEOUT: error.code === 3
            }
          });
        },
        geolocationOptions
      );
    });
  };
  
  /**
   * Check if geolocation permission has been granted
   * @returns Promise that resolves with true if permission granted, false otherwise
   */
  export const checkGeolocationPermission = async (): Promise<boolean> => {
    // For browsers that support the Permissions API
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return result.state === 'granted';
      } catch (e) {
        console.error('Error checking geolocation permission:', e);
      }
    }
    
    // Fallback for browsers without Permissions API support
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 3000, maximumAge: 86400000 } // 24 hours
      );
    });
  };
  
  /**
   * Convert coordinates to a human-readable address using Nominatim
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Promise that resolves with the address or null
   */
  export const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to reverse geocode');
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };
  
  /**
   * Format coordinates for display
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Formatted coordinates string
   */
  export const formatCoordinates = (latitude: number, longitude: number): string => {
    const lat = Math.abs(latitude).toFixed(6) + (latitude >= 0 ? '°N' : '°S');
    const lng = Math.abs(longitude).toFixed(6) + (longitude >= 0 ? '°E' : '°W');
    return `${lat}, ${lng}`;
  };
  
  export default { getCurrentPosition, checkGeolocationPermission, reverseGeocode, formatCoordinates };