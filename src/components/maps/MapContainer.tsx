// src/components/maps/MapContainer.tsx - COMPLETE FIXED VERSION

import React, { useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { MapView } from './MapView';
import { SearchBar } from './features/Search/SearchBar';
import { EnhancedRoutePanel } from './features/RouteBuilder/EnhancedRoutePanel';
import { UnifiedControlPanel } from './features/UnifiedControlPanel';
import { Plaque } from '@/types/plaque';
import { calculateDistance } from './utils/routeUtils';
import { toast } from 'sonner';
import { isMobile } from '@/utils/mobileUtils';

// Helper function for safe coordinate conversion
function parseCoordinate(coord: string | number | undefined): number {
  if (coord === undefined || coord === null) return 0;
  return typeof coord === 'string' ? parseFloat(coord) : coord;
}

interface MapState {
  center: [number, number];
  zoom: number;
  selectedResult: any | null;
  filterCenter: [number, number] | null;
  filterRadius: number;
  filterEnabled: boolean;
  filterLocation: string | null;
  selectedColors: string[];
  selectedPostcodes: string[];
  selectedProfessions: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
  routeMode: boolean;
  routePoints: Plaque[];
  showingDetails: Plaque | null;
}

type MapAction = 
  | { type: 'SET_VIEW'; center: [number, number]; zoom: number }
  | { type: 'SELECT_RESULT'; result: any }
  | { type: 'SET_LOCATION_FILTER'; center: [number, number]; radius: number; location: string }
  | { type: 'UPDATE_RADIUS'; radius: number }
  | { type: 'CLEAR_FILTER' }
  | { type: 'SET_COLORS'; colors: string[] }
  | { type: 'SET_POSTCODES'; postcodes: string[] }
  | { type: 'SET_PROFESSIONS'; professions: string[] }
  | { type: 'SET_ONLY_VISITED'; onlyVisited: boolean }
  | { type: 'SET_ONLY_FAVORITES'; onlyFavorites: boolean }
  | { type: 'RESET_STANDARD_FILTERS' }
  | { type: 'TOGGLE_ROUTE_MODE' }
  | { type: 'ADD_TO_ROUTE'; plaque: Plaque; suppressToast?: boolean }
  | { type: 'REMOVE_FROM_ROUTE'; plaqueId: number; suppressToast?: boolean }
  | { type: 'REORDER_ROUTE'; fromIndex: number; toIndex: number; suppressToast?: boolean }
  | { type: 'CLEAR_ROUTE'; suppressToast?: boolean }
  | { type: 'SHOW_PLAQUE_DETAILS'; plaque: Plaque }
  | { type: 'HIDE_PLAQUE_DETAILS' };

// Reducer that only handles state changes - no side effects
function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, center: action.center, zoom: action.zoom };
    
    case 'SELECT_RESULT':
      return { ...state, selectedResult: action.result };
    
    case 'SET_LOCATION_FILTER':
      return { 
        ...state, 
        filterCenter: action.center,
        filterRadius: action.radius,
        filterLocation: action.location,
        filterEnabled: true 
      };
    
    case 'UPDATE_RADIUS':
      return { ...state, filterRadius: action.radius };
    
    case 'CLEAR_FILTER':
      return { 
        ...state, 
        filterCenter: null,
        filterLocation: null,
        filterEnabled: false 
      };
    
    case 'SET_COLORS':
      return { ...state, selectedColors: action.colors };
    
    case 'SET_POSTCODES':
      return { ...state, selectedPostcodes: action.postcodes };
    
    case 'SET_PROFESSIONS':
      return { ...state, selectedProfessions: action.professions };
    
    case 'SET_ONLY_VISITED':
      return { ...state, onlyVisited: action.onlyVisited };
    
    case 'SET_ONLY_FAVORITES':
      return { ...state, onlyFavorites: action.onlyFavorites };
    
    case 'RESET_STANDARD_FILTERS':
      return { 
        ...state, 
        selectedColors: [],
        selectedPostcodes: [],
        selectedProfessions: [],
        onlyVisited: false,
        onlyFavorites: false
      };
    
    case 'TOGGLE_ROUTE_MODE':
      return { 
        ...state, 
        routeMode: !state.routeMode,
        routePoints: state.routeMode ? [] : state.routePoints 
      };
    
    case 'ADD_TO_ROUTE':
      const existingPlaque = state.routePoints.find(p => p.id === action.plaque.id);
      if (existingPlaque) {
        return state;
      }
      return { ...state, routePoints: [...state.routePoints, action.plaque] };
    
    case 'REMOVE_FROM_ROUTE':
      return { 
        ...state, 
        routePoints: state.routePoints.filter(p => p.id !== action.plaqueId) 
      };
    
    case 'REORDER_ROUTE':
      const newPoints = [...state.routePoints];
      const [removed] = newPoints.splice(action.fromIndex, 1);
      newPoints.splice(action.toIndex, 0, removed);
      return { ...state, routePoints: newPoints };
    
    case 'CLEAR_ROUTE':
      return { ...state, routePoints: [] };
    
    case 'SHOW_PLAQUE_DETAILS':
      return { ...state, showingDetails: action.plaque };
    
    case 'HIDE_PLAQUE_DETAILS':
      return { ...state, showingDetails: null };
    
    default:
      return state;
  }
}

const initialState: MapState = {
  center: [51.505, -0.09],
  zoom: 13,
  selectedResult: null,
  filterCenter: null,
  filterRadius: 1,
  filterEnabled: false,
  filterLocation: null,
  selectedColors: [],
  selectedPostcodes: [],
  selectedProfessions: [],
  onlyVisited: false,
  onlyFavorites: false,
  routeMode: false,
  routePoints: [],
  showingDetails: null
};

interface MapContainerProps {
  plaques: Plaque[];
  onPlaqueClick?: (plaque: Plaque) => void;
  className?: string;
  onDistanceFilterChange?: (filter: {
    enabled: boolean;
    center: [number, number] | null;
    radius: number;
    locationName: string | null;
  }) => void;
  distanceFilter?: {
    enabled: boolean;
    center: [number, number] | null;
    radius: number;
    locationName: string | null;
  };
  isPlaqueVisited?: (id: number) => boolean;
  isFavorite?: (id: number) => boolean;
  onRouteAction?: (routeData: any) => void;
}

export const MapContainer: React.FC<MapContainerProps> = (props) => {
  const { 
    plaques, 
    onPlaqueClick,
    className = '',
    onDistanceFilterChange,
    distanceFilter,
    isPlaqueVisited,
    isFavorite,
    onRouteAction
  } = props;

  // Mobile detection and responsive setup
  const mobile = isMobile();

  const [state, dispatch] = useReducer(mapReducer, {
    ...initialState,
    filterCenter: distanceFilter?.center || null,
    filterRadius: distanceFilter?.radius || 1,
    filterEnabled: distanceFilter?.enabled || false,
    filterLocation: distanceFilter?.locationName || null,
  });

  // Toast management
  const toastTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastActionTime = useRef<Map<string, number>>(new Map());

  const showToastOnce = useCallback((key: string, message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const now = Date.now();
    const lastTime = lastActionTime.current.get(key) || 0;
    
    if (now - lastTime < 2000) {
      console.log(`🔇 Suppressed duplicate toast: ${key}`);
      return;
    }
    
    const existingTimeout = toastTimeouts.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    lastActionTime.current.set(key, now);
    
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      default:
        toast.info(message);
    }
    
    console.log(`🔊 Showed toast: ${key} - ${message}`);
    
    const timeout = setTimeout(() => {
      lastActionTime.current.delete(key);
      toastTimeouts.current.delete(key);
    }, 2000);
    
    toastTimeouts.current.set(key, timeout);
  }, []);

  // Filter plaques based on current state
  const visiblePlaques = useMemo(() => {
    let filtered = plaques;
    
    // Distance filter
    if (state.filterEnabled && state.filterCenter) {
      filtered = plaques.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(
          state.filterCenter![0], 
          state.filterCenter![1],
          parseCoordinate(p.latitude),
          parseCoordinate(p.longitude)
        );
        return distance <= state.filterRadius;
      });
    }
    
    // Standard filters
    filtered = filtered.filter(p => {
      const matchesColor = state.selectedColors.length === 0 || 
        (p.color && state.selectedColors.includes(p.color.toLowerCase()));
      
      const matchesPostcode = state.selectedPostcodes.length === 0 || 
        (p.postcode && state.selectedPostcodes.includes(p.postcode));
      
      const matchesProfession = state.selectedProfessions.length === 0 || 
        (p.profession && state.selectedProfessions.includes(p.profession));
      
      const matchesVisited = !state.onlyVisited || 
        p.visited || (isPlaqueVisited && isPlaqueVisited(p.id));
      
      const matchesFavorites = !state.onlyFavorites || 
        (isFavorite && isFavorite(p.id));
      
      return matchesColor && matchesPostcode && matchesProfession && 
             matchesVisited && matchesFavorites;
    });
    
    return filtered;
  }, [
    plaques, 
    state.filterEnabled, 
    state.filterCenter, 
    state.filterRadius,
    state.selectedColors,
    state.selectedPostcodes,
    state.selectedProfessions,
    state.onlyVisited,
    state.onlyFavorites,
    isPlaqueVisited,
    isFavorite
  ]);

  // Handle plaque clicks
  const handlePlaqueClick = useCallback((plaque: Plaque) => {
    console.log('🗺️ MapContainer: Plaque clicked:', plaque.title, 'Route mode:', state.routeMode);
    
    if (onPlaqueClick) {
      onPlaqueClick(plaque);
    } else {
      dispatch({ type: 'SHOW_PLAQUE_DETAILS', plaque });
    }
  }, [state.routeMode, onPlaqueClick]);

  // Add to route with proper toast management
  const handleAddToRoute = useCallback((plaque: Plaque) => {
    console.log('➕ MapContainer: Adding to route:', plaque.title);
    
    const alreadyExists = state.routePoints.find(p => p.id === plaque.id);
    
    if (alreadyExists) {
      showToastOnce(`duplicate-${plaque.id}`, `"${plaque.title}" is already in your route`, 'info');
      return;
    }
    
    dispatch({ type: 'ADD_TO_ROUTE', plaque });
    showToastOnce(`added-${plaque.id}`, `Added "${plaque.title}" to route`, 'success');
  }, [state.routePoints, showToastOnce]);

  // FIXED: Search handler for plaque results
  const handleSearchSelect = useCallback((result: any) => {
    console.log('🔍 Search result selected:', result);
    dispatch({ type: 'SELECT_RESULT', result });
    
    if (result.type === 'plaque' && result.plaque) {
      // Handle plaque selection - zoom to plaque and show details
      if (result.coordinates) {
        dispatch({ 
          type: 'SET_VIEW', 
          center: result.coordinates, 
          zoom: 16 
        });
      }
      
      // Trigger plaque click to show details
      if (onPlaqueClick) {
        onPlaqueClick(result.plaque);
      } else {
        dispatch({ type: 'SHOW_PLAQUE_DETAILS', plaque: result.plaque });
      }
    } else if (result.coordinates) {
      // Handle general coordinate-based results
      dispatch({ 
        type: 'SET_VIEW', 
        center: result.coordinates, 
        zoom: result.type === 'plaque' ? 16 : 14 
      });
    }
  }, [onPlaqueClick]);

  // Location filter handlers
  const handleLocationFilterSet = useCallback(async (coords: [number, number]) => {
    let locationName = 'Selected Location';
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=16&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        locationName = parts.slice(0, 2).join(', ');
      }
    } catch (error) {
      console.error('Error getting location name:', error);
      locationName = 'My Location';
    }
    
    dispatch({ 
      type: 'SET_LOCATION_FILTER', 
      center: coords, 
      radius: state.filterRadius,
      location: locationName
    });
    
    if (onDistanceFilterChange) {
      onDistanceFilterChange({
        enabled: true,
        center: coords,
        radius: state.filterRadius,
        locationName
      });
    }
    
    dispatch({ 
      type: 'SET_VIEW', 
      center: coords, 
      zoom: 14
    });
    
    const plaqueCount = plaques.filter(p => {
      if (!p.latitude || !p.longitude) return false;
      const distance = calculateDistance(
        coords[0], coords[1],
        parseCoordinate(p.latitude),
        parseCoordinate(p.longitude)
      );
      return distance <= state.filterRadius;
    }).length;
    
    showToastOnce(
      'manual-location-set',
      `Location set! Found ${plaqueCount} plaque${plaqueCount !== 1 ? 's' : ''} within ${state.filterRadius}km`,
      'success'
    );
  }, [state.filterRadius, plaques, onDistanceFilterChange, showToastOnce]);

  const handleRadiusChange = useCallback((radius: number) => {
    dispatch({ type: 'UPDATE_RADIUS', radius });
    
    if (onDistanceFilterChange && state.filterEnabled && state.filterCenter) {
      onDistanceFilterChange({
        enabled: true,
        center: state.filterCenter,
        radius: radius,
        locationName: state.filterLocation
      });
    }
    
    if (state.filterEnabled && state.filterCenter) {
      const plaqueCount = plaques.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(
          state.filterCenter![0], 
          state.filterCenter![1],
          parseCoordinate(p.latitude),
          parseCoordinate(p.longitude)
        );
        return distance <= radius;
      }).length;
      
      const radiusText = radius < 1 ? `${Math.round(radius * 1000)}m` : `${radius}km`;
      
      showToastOnce(
        'radius-update',
        `${plaqueCount} plaque${plaqueCount !== 1 ? 's' : ''} within ${radiusText} of ${state.filterLocation}`,
        'info'
      );
    }
  }, [state.filterEnabled, state.filterCenter, state.filterLocation, plaques, onDistanceFilterChange, showToastOnce]);

  const handleClearFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTER' });
    
    if (onDistanceFilterChange) {
      onDistanceFilterChange({
        enabled: false,
        center: null,
        radius: 1,
        locationName: null
      });
    }
    
    showToastOnce('filter-cleared', 'Distance filter cleared - showing all plaques', 'info');
  }, [onDistanceFilterChange, showToastOnce]);

  // Route handlers
  const handleRemoveFromRoute = useCallback((id: number) => {
    const plaque = state.routePoints.find(p => p.id === id);
    dispatch({ type: 'REMOVE_FROM_ROUTE', plaqueId: id });
    
    if (plaque) {
      showToastOnce(`removed-${id}`, `Removed "${plaque.title}" from route`, 'info');
    }
  }, [state.routePoints, showToastOnce]);

  const handleReorderRoute = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      dispatch({ type: 'REORDER_ROUTE', fromIndex, toIndex });
      showToastOnce('route-reordered', 'Route reordered', 'info');
    }
  }, [showToastOnce]);

  const handleClearRoute = useCallback(() => {
    if (state.routePoints.length > 0) {
      dispatch({ type: 'CLEAR_ROUTE' });
      showToastOnce('route-cleared', 'Route cleared', 'info');
    }
  }, [state.routePoints.length, showToastOnce]);

  // Sync with external distance filter changes
  useEffect(() => {
    if (distanceFilter) {
      if (distanceFilter.enabled !== state.filterEnabled ||
          distanceFilter.radius !== state.filterRadius ||
          distanceFilter.locationName !== state.filterLocation) {
        
        if (distanceFilter.enabled && distanceFilter.center) {
          dispatch({
            type: 'SET_LOCATION_FILTER',
            center: distanceFilter.center,
            radius: distanceFilter.radius,
            location: distanceFilter.locationName || 'Unknown Location'
          });
        } else {
          dispatch({ type: 'CLEAR_FILTER' });
        }
      }
    }
  }, [distanceFilter, state.filterEnabled, state.filterRadius, state.filterLocation]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`} style={{ isolation: 'isolate' }}>
      {/* CRITICAL: SearchBar with maximum z-index and forced positioning */}
      <div 
        className="search-bar-container"
        style={{ 
          position: 'absolute',
          zIndex: 99999, // Maximum z-index
          isolation: 'isolate',
          pointerEvents: 'auto',
          transform: 'translateZ(0)', // Force GPU layer
          // Responsive positioning
          ...(mobile ? {
            top: '12px',
            left: '12px',
            right: '12px',
            width: 'auto'
          } : {
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%) translateZ(0)',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)'
          })
        }}
      >
        <SearchBar 
          plaques={plaques}
          onSelect={handleSearchSelect}
          className="w-full"
        />
      </div>

      {/* Unified Control Panel */}
      <UnifiedControlPanel
        distanceFilter={{
          enabled: state.filterEnabled,
          center: state.filterCenter,
          radius: state.filterRadius,
          locationName: state.filterLocation
        }}
        onSetLocation={handleLocationFilterSet}
        onRadiusChange={handleRadiusChange}
        onClearDistanceFilter={handleClearFilter}
        
        plaques={plaques}
        visiblePlaques={visiblePlaques}
        selectedColors={state.selectedColors}
        selectedPostcodes={state.selectedPostcodes}
        selectedProfessions={state.selectedProfessions}
        onlyVisited={state.onlyVisited}
        onlyFavorites={state.onlyFavorites}
        onColorsChange={(colors) => dispatch({ type: 'SET_COLORS', colors })}
        onPostcodesChange={(postcodes) => dispatch({ type: 'SET_POSTCODES', postcodes })}
        onProfessionsChange={(professions) => dispatch({ type: 'SET_PROFESSIONS', professions })}
        onVisitedChange={(onlyVisited) => dispatch({ type: 'SET_ONLY_VISITED', onlyVisited })}
        onFavoritesChange={(onlyFavorites) => dispatch({ type: 'SET_ONLY_FAVORITES', onlyFavorites })}
        onResetStandardFilters={() => dispatch({ type: 'RESET_STANDARD_FILTERS' })}
        
        routeMode={state.routeMode}
        onToggleRoute={() => dispatch({ type: 'TOGGLE_ROUTE_MODE' })}
        routePointsCount={state.routePoints.length}
        
        onResetView={() => dispatch({ type: 'SET_VIEW', center: [51.505, -0.09], zoom: 13 })}
        
        isPlaqueVisited={isPlaqueVisited}
        isFavorite={isFavorite}
        className="unified-control-panel"
      />

      {/* Enhanced Route Panel */}
      {state.routeMode && (
        <div className={`absolute ${
          mobile 
            ? 'bottom-0 left-0 right-0' 
            : 'right-4 top-20 bottom-20'
        } z-[1000] ${
          mobile 
            ? 'w-full' 
            : 'w-80 max-w-[calc(100vw-14rem)]'
        }`}>
          <EnhancedRoutePanel
            points={state.routePoints}
            onRemove={handleRemoveFromRoute}
            onReorder={handleReorderRoute}
            onClear={handleClearRoute}
            onClose={() => dispatch({ type: 'TOGGLE_ROUTE_MODE' })}
            onRouteAction={onRouteAction}
            className={mobile ? 'w-full mobile-route-panel' : ''}
          />
        </div>
      )}

      {/* Status Bar */}
      {(!mobile || !state.routeMode) && (
        <div className={`absolute ${
          mobile 
            ? 'bottom-2 left-2 right-2' 
            : 'bottom-4 right-4'
        } z-[900] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-sm ${
          mobile ? 'w-auto' : ''
        }`}>
          <div className={`flex items-center ${mobile ? 'justify-center' : 'gap-2'} ${mobile ? 'flex-wrap' : ''}`}>
            <span className="font-medium">{visiblePlaques.length}</span> of{' '}
            <span className="font-medium">{plaques.length}</span> plaques
            {state.filterEnabled && state.filterLocation && (
              <div className={`${mobile ? 'mt-1 w-full text-center' : 'ml-2'} px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs`}>
                Within {state.filterRadius < 1 
                  ? `${Math.round(state.filterRadius * 1000)}m` 
                  : `${state.filterRadius}km`} of {state.filterLocation}
              </div>
            )}
            {state.routeMode && (
              <div className={`${mobile ? 'mt-1 w-full text-center' : 'ml-2'} px-2 py-1 bg-green-50 text-green-700 rounded text-xs`}>
                Route Mode: {state.routePoints.length} stops
              </div>
            )}
          </div>
        </div>
      )}

      {/* The Map */}
      <MapView
        plaques={visiblePlaques}
        center={state.center}
        zoom={state.zoom}
        routeMode={state.routeMode}
        routePoints={state.routePoints}
        onPlaqueClick={handlePlaqueClick}
        onAddToRoute={handleAddToRoute}
        filterCenter={state.filterCenter}
        filterRadius={state.filterRadius}
        filterEnabled={state.filterEnabled}
        filterLocationName={state.filterLocation || undefined}
      />
    </div>
  );
};