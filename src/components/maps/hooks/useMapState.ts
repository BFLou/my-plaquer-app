// src/components/maps/hooks/useMapState.ts - Fixed version
import { useState, useCallback, useRef, useEffect } from 'react';

interface MapState {
  center: [number, number] | null;
  zoom: number;
  distanceFilter: {
    active: boolean;
    location: [number, number] | null;
    radius: number;
    visible: boolean;
  };
  userLocation: [number, number] | null;
  searchLocation: [number, number] | null;
}

interface MapStateManager {
  state: MapState;
  updateCenter: (center: [number, number]) => void;
  updateZoom: (zoom: number) => void;
  setDistanceFilter: (location: [number, number], radius: number, visible: boolean) => void;
  clearDistanceFilter: () => void;
  setUserLocation: (location: [number, number] | null) => void;
  setSearchLocation: (location: [number, number] | null) => void;
  getActiveLocation: () => [number, number] | null;
  persistState: () => void;
  restoreState: () => MapState | null;
  shouldRestoreDistanceCircle: () => boolean;
}

const MAP_STATE_STORAGE_KEY = 'discover-map-state';

export const useMapState = (): MapStateManager => {
  // FIXED: Memoize initial state creation
  const getInitialState = useCallback((): MapState => {
    try {
      const stored = localStorage.getItem(MAP_STATE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          center: parsed.center || null,
          zoom: parsed.zoom || 13,
          distanceFilter: {
            active: parsed.distanceFilter?.active || false,
            location: parsed.distanceFilter?.location || null,
            radius: parsed.distanceFilter?.radius || 1,
            visible: parsed.distanceFilter?.visible || false,
          },
          userLocation: parsed.userLocation || null,
          searchLocation: parsed.searchLocation || null,
        };
      }
    } catch (error) {
      console.warn('Failed to restore map state:', error);
    }
    
    return {
      center: null,
      zoom: 13,
      distanceFilter: {
        active: false,
        location: null,
        radius: 1,
        visible: false,
      },
      userLocation: null,
      searchLocation: null,
    };
  }, []); // FIXED: Empty dependency array to prevent recreation

  const [state, setState] = useState<MapState>(() => getInitialState());
  const persistenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // FIXED: Immediate persistence for important changes
  const persistStateImmediate = useCallback((newState: MapState) => {
    try {
      localStorage.setItem(MAP_STATE_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to persist map state:', error);
    }
  }, []);

  // FIXED: Debounced persistence to avoid excessive localStorage writes
  const persistState = useCallback(() => {
    if (persistenceTimeoutRef.current) {
      clearTimeout(persistenceTimeoutRef.current);
    }
    
    persistenceTimeoutRef.current = setTimeout(() => {
      persistStateImmediate(state);
    }, 500);
  }, [state, persistStateImmediate]);

  const updateCenter = useCallback((center: [number, number]) => {
    setState(prev => {
      const newState = { ...prev, center };
      // Persist immediately for important changes
      setTimeout(() => persistStateImmediate(newState), 100);
      return newState;
    });
  }, [persistStateImmediate]);

  const updateZoom = useCallback((zoom: number) => {
    setState(prev => {
      const newState = { ...prev, zoom };
      // Persist immediately for important changes
      setTimeout(() => persistStateImmediate(newState), 100);
      return newState;
    });
  }, [persistStateImmediate]);

  const setDistanceFilter = useCallback((location: [number, number], radius: number, visible: boolean) => {
    setState(prev => {
      const newState = {
        ...prev,
        distanceFilter: {
          active: true,
          location,
          radius,
          visible,
        }
      };
      // Persist immediately for important changes
      setTimeout(() => persistStateImmediate(newState), 100);
      return newState;
    });
  }, [persistStateImmediate]);

  const clearDistanceFilter = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        distanceFilter: {
          active: false,
          location: null,
          radius: 1,
          visible: false,
        }
      };
      // Persist immediately for important changes
      setTimeout(() => persistStateImmediate(newState), 100);
      return newState;
    });
  }, [persistStateImmediate]);

  const setUserLocation = useCallback((location: [number, number] | null) => {
    setState(prev => ({ ...prev, userLocation: location }));
  }, []);

  const setSearchLocation = useCallback((location: [number, number] | null) => {
    setState(prev => ({ ...prev, searchLocation: location }));
  }, []);

  const getActiveLocation = useCallback((): [number, number] | null => {
    return state.searchLocation || state.userLocation || state.distanceFilter.location;
  }, [state.searchLocation, state.userLocation, state.distanceFilter.location]);

  const restoreState = useCallback((): MapState | null => {
    try {
      const stored = localStorage.getItem(MAP_STATE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to restore map state:', error);
      return null;
    }
  }, []);

  const shouldRestoreDistanceCircle = useCallback((): boolean => {
    return state.distanceFilter.active && 
           state.distanceFilter.location !== null && 
           state.distanceFilter.visible;
  }, [state.distanceFilter.active, state.distanceFilter.location, state.distanceFilter.visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    updateCenter,
    updateZoom,
    setDistanceFilter,
    clearDistanceFilter,
    setUserLocation,
    setSearchLocation,
    getActiveLocation,
    persistState,
    restoreState,
    shouldRestoreDistanceCircle,
  };
};