// src/components/map/hooks/useMapState.ts
import { useState, useCallback, useEffect } from 'react';
import { Plaque } from '@/types/plaque';

interface MapState {
  // View state
  center: [number, number];
  zoom: number;
  
  // Search & filters
  searchQuery: string;
  activeLocation: [number, number] | null;
  distanceFilter: number | null; // km radius
  
  // Selection
  selectedPlaque: Plaque | null;
  
  // Optional route (secondary feature)
  routeMode: boolean;
  routePoints: Plaque[];
  
  // UI state
  isSearching: boolean;
  mapStyle: 'street' | 'satellite' | 'terrain';
}

interface SearchResult {
  type: 'location' | 'plaque' | 'area';
  title: string;
  subtitle?: string;
  coordinates?: [number, number];
  data?: any;
}

const LONDON_CENTER: [number, number] = [51.505, -0.09];
const DEFAULT_ZOOM = 13;
const STORAGE_KEY = 'plaquer-map-state';

export const useMapState = (plaques: Plaque[] = []) => {
  // Core state
  const [state, setState] = useState<MapState>({
    center: LONDON_CENTER,
    zoom: DEFAULT_ZOOM,
    searchQuery: '',
    activeLocation: null,
    distanceFilter: null,
    selectedPlaque: null,
    routeMode: false,
    routePoints: [],
    isSearching: false,
    mapStyle: 'street'
  });

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          center: parsed.center || LONDON_CENTER,
          zoom: parsed.zoom || DEFAULT_ZOOM,
          mapStyle: parsed.mapStyle || 'street'
        }));
      }
    } catch (error) {
      console.warn('Failed to restore map state:', error);
    }
  }, []);

  // Persist key state changes
  const persistState = useCallback((updates: Partial<MapState>) => {
    const toPersist = {
      center: updates.center,
      zoom: updates.zoom,
      mapStyle: updates.mapStyle
    };
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...toPersist }));
    } catch (error) {
      console.warn('Failed to persist map state:', error);
    }
  }, []);

  // Actions
  const actions = {
    // View actions
    setCenter: useCallback((center: [number, number]) => {
      setState(prev => ({ ...prev, center }));
      persistState({ center });
    }, [persistState]),

    setZoom: useCallback((zoom: number) => {
      setState(prev => ({ ...prev, zoom }));
      persistState({ zoom });
    }, [persistState]),

    setMapStyle: useCallback((mapStyle: 'street' | 'satellite' | 'terrain') => {
      setState(prev => ({ ...prev, mapStyle }));
      persistState({ mapStyle });
    }, [persistState]),

    // Search actions
    setSearch: useCallback((searchQuery: string) => {
      setState(prev => ({ ...prev, searchQuery, isSearching: searchQuery.length > 0 }));
    }, []),

    clearSearch: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        searchQuery: '', 
        isSearching: false,
        activeLocation: null,
        distanceFilter: null 
      }));
    }, []),

    // Location & filtering actions
    setDistanceFilter: useCallback((location: [number, number], radius: number) => {
      setState(prev => ({ 
        ...prev, 
        activeLocation: location, 
        distanceFilter: radius 
      }));
    }, []),

    clearDistanceFilter: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        activeLocation: null, 
        distanceFilter: null 
      }));
    }, []),

    // Selection actions
    selectPlaque: useCallback((plaque: Plaque) => {
      setState(prev => ({ ...prev, selectedPlaque: plaque }));
    }, []),

    clearSelection: useCallback(() => {
      setState(prev => ({ ...prev, selectedPlaque: null }));
    }, []),

    // Route actions
    toggleRouteMode: useCallback(() => {
      setState(prev => {
        const newRouteMode = !prev.routeMode;
        return {
          ...prev,
          routeMode: newRouteMode,
          // Clear route when exiting route mode
          routePoints: newRouteMode ? prev.routePoints : []
        };
      });
    }, []),

    addToRoute: useCallback((plaque: Plaque) => {
      setState(prev => {
        // Don't add if already in route
        if (prev.routePoints.some(p => p.id === plaque.id)) {
          return prev;
        }
        return {
          ...prev,
          routePoints: [...prev.routePoints, plaque]
        };
      });
    }, []),

    removeFromRoute: useCallback((plaqueId: number) => {
      setState(prev => ({
        ...prev,
        routePoints: prev.routePoints.filter(p => p.id !== plaqueId)
      }));
    }, []),

    clearRoute: useCallback(() => {
      setState(prev => ({ ...prev, routePoints: [] }));
    }, []),

    reorderRoute: useCallback((startIndex: number, endIndex: number) => {
      setState(prev => {
        const newRoutePoints = [...prev.routePoints];
        const [removed] = newRoutePoints.splice(startIndex, 1);
        newRoutePoints.splice(endIndex, 0, removed);
        return { ...prev, routePoints: newRoutePoints };
      });
    }, [])
  };

  // Computed values
  const computed = {
    // Get plaques filtered by distance
    getFilteredPlaques: useCallback((): Plaque[] => {
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
    }, [plaques, state.activeLocation, state.distanceFilter]),

    // Get plaques that should be visible on map
    getVisiblePlaques: useCallback((): Plaque[] => {
      // If we have a distance filter, use filtered plaques
      if (state.activeLocation && state.distanceFilter) {
        return computed.getFilteredPlaques();
      }
      
      // Otherwise show all plaques
      return plaques;
    }, [plaques, state.activeLocation, state.distanceFilter]),

    // Search plaques by query
    searchPlaques: useCallback((query: string): Plaque[] => {
      if (!query.trim()) return [];
      
      const searchTerm = query.toLowerCase();
      
      return plaques.filter(plaque => 
        plaque.title?.toLowerCase().includes(searchTerm) ||
        plaque.inscription?.toLowerCase().includes(searchTerm) ||
        plaque.location?.toLowerCase().includes(searchTerm) ||
        plaque.address?.toLowerCase().includes(searchTerm) ||
        plaque.profession?.toLowerCase().includes(searchTerm)
      ).slice(0, 10); // Limit results for performance
    }, [plaques]),

    // Get route statistics
    getRouteStats: useCallback(() => {
      if (state.routePoints.length < 2) {
        return { distance: 0, duration: 0, stops: state.routePoints.length };
      }

      let totalDistance = 0;
      
      for (let i = 0; i < state.routePoints.length - 1; i++) {
        const start = state.routePoints[i];
        const end = state.routePoints[i + 1];
        
        if (start.latitude && start.longitude && end.latitude && end.longitude) {
          const startLat = parseFloat(start.latitude as string);
          const startLng = parseFloat(start.longitude as string);
          const endLat = parseFloat(end.latitude as string);
          const endLng = parseFloat(end.longitude as string);
          
          if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
            totalDistance += calculateDistance(startLat, startLng, endLat, endLng);
          }
        }
      }

      const walkingSpeedKmh = 5; // Average walking speed
      const durationMinutes = Math.round((totalDistance / walkingSpeedKmh) * 60);

      return {
        distance: totalDistance,
        duration: durationMinutes,
        stops: state.routePoints.length
      };
    }, [state.routePoints])
  };

  return {
    state,
    actions,
    ...computed
  };
};

// Helper function to calculate distance between two points using Haversine formula
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

export default useMapState;