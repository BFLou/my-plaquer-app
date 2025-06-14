// src/services/LocationService.ts - Mobile-optimized location handling

export interface LocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  error?: string;
  errorCode?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
}

export class LocationService {
  private static instance: LocationService;
  private lastKnownPosition: GeolocationPosition | null = null;
  
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get current location with mobile optimizations
   */
  async getCurrentLocation(options?: {
    timeout?: number;
    enableHighAccuracy?: boolean;
    maximumAge?: number;
    showPrompt?: boolean;
  }): Promise<LocationResult> {
    const {
      timeout = 15000,
      enableHighAccuracy = true,
      maximumAge = 60000, // 1 minute cache
    } = options || {};

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      return {
        success: false,
        error: 'Geolocation is not supported by this browser',
        errorCode: 'NOT_SUPPORTED'
      };
    }

    // Check for cached location first
    if (this.lastKnownPosition && maximumAge > 0) {
      const timeDiff = Date.now() - this.lastKnownPosition.timestamp;
      if (timeDiff < maximumAge) {
        console.log('🌍 Using cached location');
        return {
          success: true,
          latitude: this.lastKnownPosition.coords.latitude,
          longitude: this.lastKnownPosition.coords.longitude,
          accuracy: this.lastKnownPosition.coords.accuracy
        };
      }
    }

    return new Promise((resolve) => {
      console.log('🌍 Requesting current location...');
      
      const successCallback = (position: GeolocationPosition) => {
        console.log('🌍 ✅ Location obtained:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: `${Math.round(position.coords.accuracy)}m`
        });
        
        // Cache the position
        this.lastKnownPosition = position;
        
        resolve({
          success: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      };

      const errorCallback = (error: GeolocationPositionError) => {
        console.error('🌍 ❌ Location error:', error);
        
        let errorMessage = 'Could not determine your location.';
        let errorCode: LocationResult['errorCode'] = 'POSITION_UNAVAILABLE';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            errorCode = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS settings.';
            errorCode = 'POSITION_UNAVAILABLE';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            errorCode = 'TIMEOUT';
            break;
        }
        
        resolve({
          success: false,
          error: errorMessage,
          errorCode
        });
      };

      // Mobile-optimized geolocation options
      const geoOptions: PositionOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge
      };

      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        geoOptions
      );
    });
  }

  /**
   * Watch position changes (useful for live tracking)
   */
  watchPosition(callback: (result: LocationResult) => void): number | null {
    if (!navigator.geolocation) {
      callback({
        success: false,
        error: 'Geolocation not supported',
        errorCode: 'NOT_SUPPORTED'
      });
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        this.lastKnownPosition = position;
        callback({
          success: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        callback({
          success: false,
          error: error.message,
          errorCode: 'POSITION_UNAVAILABLE'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

  /**
   * Stop watching position
   */
  clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  /**
   * Check if location permission is already granted (Chrome/Edge only)
   */
  async checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state;
      } catch (error) {
        console.debug('Permission API not supported');
      }
    }
    return 'unknown';
  }

  /**
   * Get user-friendly error message with actionable advice
   */
  getErrorAdvice(errorCode: LocationResult['errorCode']): {
    message: string;
    actions: string[];
  } {
    switch (errorCode) {
      case 'PERMISSION_DENIED':
        return {
          message: 'Location access is blocked',
          actions: [
            'Click the location icon in your browser\'s address bar',
            'Select "Always allow" for this site',
            'Refresh the page and try again'
          ]
        };
      case 'POSITION_UNAVAILABLE':
        return {
          message: 'Location unavailable',
          actions: [
            'Make sure GPS/Location Services are enabled',
            'Try moving to an area with better signal',
            'Use WiFi instead of mobile data if possible'
          ]
        };
      case 'TIMEOUT':
        return {
          message: 'Location request timed out',
          actions: [
            'Try again in a moment',
            'Check your internet connection',
            'Make sure location services are enabled'
          ]
        };
      case 'NOT_SUPPORTED':
        return {
          message: 'Location not supported',
          actions: [
            'Try using a modern browser like Chrome or Safari',
            'Search by postcode instead',
            'Browse all plaques without location filter'
          ]
        };
      default:
        return {
          message: 'Location error',
          actions: ['Try searching by postcode instead']
        };
    }
  }

  /**
   * Clear cached location
   */
  clearCache(): void {
    this.lastKnownPosition = null;
  }

  /**
   * Get distance between two points (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();