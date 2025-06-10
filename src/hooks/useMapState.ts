// src/hooks/useMapState.ts - Map state management for distance filtering and location
import { useState, useCallback } from 'react';

interface DistanceFilter {
  location: [number, number] | null;
  radius: number;
  visible: boolean;
}

interface MapState {
  center: [number, number];
  zoom: number;
  distanceFilter: DistanceFilter;
  searchLocation: [number, number] | null;
}

const initialState: MapState = {
  center: [51.505, -0.09], // Default to London
  zoom: 13,
  distanceFilter: {
    location: null,
    radius: 1,
    visible: false,
  },
  searchLocation: null,
};

export const useMapState = () => {
  const [state, setState] = useState<MapState>(initialState);

  // Set map center and zoom
  const setMapView = useCallback((center: [number, number], zoom: number) => {
    setState(prev => ({
      ...prev,
      center,
      zoom,
    }));
  }, []);

  // Set distance filter
  const setDistanceFilter = useCallback((
    location: [number, number],
    radius: number,
    visible: boolean = true
  ) => {
    setState(prev => ({
      ...prev,
      distanceFilter: {
        location,
        radius,
        visible,
      },
    }));
  }, []);

  // Update just the radius of the distance filter
  const updateDistanceRadius = useCallback((radius: number) => {
    setState(prev => ({
      ...prev,
      distanceFilter: {
        ...prev.distanceFilter,
        radius,
      },
    }));
  }, []);

  // Toggle distance filter visibility
  const toggleDistanceFilterVisibility = useCallback(() => {
    setState(prev => ({
      ...prev,
      distanceFilter: {
        ...prev.distanceFilter,
        visible: !prev.distanceFilter.visible,
      },
    }));
  }, []);

  // Clear distance filter
  const clearDistanceFilter = useCallback(() => {
    setState(prev => ({
      ...prev,
      distanceFilter: {
        location: null,
        radius: 1,
        visible: false,
      },
    }));
  }, []);

  // Set search location (for location-based searches)
  const setSearchLocation = useCallback((location: [number, number]) => {
    setState(prev => ({
      ...prev,
      searchLocation: location,
      center: location, // Update map center to the search location
      zoom: 14, // Zoom in when setting a search location
    }));
  }, []);

  // Clear search location
  const clearSearchLocation = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchLocation: null,
    }));
  }, []);

  // Reset map to default state
  const resetMapState = useCallback(() => {
    setState(initialState);
  }, []);

  // Get distance filter status
  const isDistanceFilterActive = useCallback(() => {
    return state.distanceFilter.location !== null && state.distanceFilter.visible;
  }, [state.distanceFilter]);

  // Get current map bounds (approximate)
  const getMapBounds = useCallback(() => {
    const { center, zoom } = state;
    
    // Approximate bounds calculation based on zoom level
    // This is a rough estimation - for precise bounds, you'd need the actual map instance
    const latDelta = 180 / Math.pow(2, zoom);
    const lngDelta = 360 / Math.pow(2, zoom);
    
    return {
      north: center[0] + latDelta / 2,
      south: center[0] - latDelta / 2,
      east: center[1] + lngDelta / 2,
      west: center[1] - lngDelta / 2,
    };
  }, [state.center, state.zoom]);

  // Create map state manager object for easy access
  const mapStateManager = {
    // State
    state,
    
    // Map view methods
    setMapView,
    resetMapState,
    getMapBounds,
    
    // Distance filter methods
    setDistanceFilter,
    updateDistanceRadius,
    toggleDistanceFilterVisibility,
    clearDistanceFilter,
    isDistanceFilterActive,
    
    // Search location methods
    setSearchLocation,
    clearSearchLocation,
    
    // Computed properties
    get center() { return state.center; },
    get zoom() { return state.zoom; },
    get distanceFilter() { return state.distanceFilter; },
    get searchLocation() { return state.searchLocation; },
  };

  return mapStateManager;
};