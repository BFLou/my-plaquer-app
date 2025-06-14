// src/components/maps/MapContainer.tsx - COMPLETE FIXED: Route saving completion and auto-centering
import React, {
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { MapView } from './MapView';
import { EnhancedRoutePanel } from './features/RouteBuilder/EnhancedRoutePanel';
import { UnifiedControlPanel } from './features/UnifiedControlPanel';
import { Plaque } from '@/types/plaque';
import { calculateDistance } from './utils/routeUtils';
import { toast } from 'sonner';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useRoutes } from '@/hooks/useRoutes';
import { calculateMultiWaypointRoute } from '@/services/WalkingDistanceService';

// Helper function for safe coordinate conversion
function parseCoordinate(coord: string | number | undefined): number {
  if (coord === undefined || coord === null) return 0;
  return typeof coord === 'string' ? parseFloat(coord) : coord;
}

interface MapState {
  center: [number, number];
  zoom: number;
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
  | {
      type: 'SET_LOCATION_FILTER';
      center: [number, number];
      radius: number;
      location: string;
    }
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
  | {
      type: 'REORDER_ROUTE';
      fromIndex: number;
      toIndex: number;
      suppressToast?: boolean;
    }
  | { type: 'CLEAR_ROUTE'; suppressToast?: boolean }
  | { type: 'SHOW_PLAQUE_DETAILS'; plaque: Plaque }
  | { type: 'HIDE_PLAQUE_DETAILS' };

// Reducer that only handles state changes - no side effects
function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, center: action.center, zoom: action.zoom };

    case 'SET_LOCATION_FILTER':
      return {
        ...state,
        filterCenter: action.center,
        filterRadius: action.radius,
        filterLocation: action.location,
        filterEnabled: true,
      };

    case 'UPDATE_RADIUS':
      return { ...state, filterRadius: action.radius };

    case 'CLEAR_FILTER':
      return {
        ...state,
        filterCenter: null,
        filterLocation: null,
        filterEnabled: false,
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
        onlyFavorites: false,
      };

    case 'TOGGLE_ROUTE_MODE':
      return {
        ...state,
        routeMode: !state.routeMode,
        // Clear route when exiting route mode
        routePoints: !state.routeMode ? state.routePoints : [],
      };

    case 'ADD_TO_ROUTE':
      const existingPlaque = state.routePoints.find(
        (p) => p.id === action.plaque.id
      );
      if (existingPlaque) {
        return state;
      }
      return { ...state, routePoints: [...state.routePoints, action.plaque] };

    case 'REMOVE_FROM_ROUTE':
      return {
        ...state,
        routePoints: state.routePoints.filter((p) => p.id !== action.plaqueId),
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
  showingDetails: null,
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
  initialCenter?: [number, number];
  initialZoom?: number;
  forceCenter?: boolean;
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
    onRouteAction,
    initialCenter,
    initialZoom,
    forceCenter,
  } = props;

  // Route saving hook
  const { createRouteWithWalkingData } = useRoutes();

  // Mobile detection and responsive setup
  const mobile = isMobile();

  const [state, dispatch] = useReducer(mapReducer, {
    ...initialState,
    center: initialCenter || initialState.center,
    zoom: initialZoom || initialState.zoom,
    filterCenter: distanceFilter?.center || null,
    filterRadius: distanceFilter?.radius || 1,
    filterEnabled: distanceFilter?.enabled || false,
    filterLocation: distanceFilter?.locationName || null,
  });

  // Toast management
  const toastTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastActionTime = useRef<Map<string, number>>(new Map());

  const showToastOnce = useCallback(
    (
      key: string,
      message: string,
      type: 'success' | 'info' | 'error' = 'info'
    ) => {
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
    },
    []
  );

  // Filter plaques based on current state
  const visiblePlaques = useMemo(() => {
    let filtered = plaques;

    // Distance filter
    if (state.filterEnabled && state.filterCenter) {
      filtered = plaques.filter((p) => {
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
    filtered = filtered.filter((p) => {
      const matchesColor =
        state.selectedColors.length === 0 ||
        (p.color && state.selectedColors.includes(p.color.toLowerCase()));

      const matchesPostcode =
        state.selectedPostcodes.length === 0 ||
        (p.postcode && state.selectedPostcodes.includes(p.postcode));

      const matchesProfession =
        state.selectedProfessions.length === 0 ||
        (p.profession && state.selectedProfessions.includes(p.profession));

      const matchesVisited =
        !state.onlyVisited ||
        p.visited ||
        (isPlaqueVisited && isPlaqueVisited(p.id));

      const matchesFavorites =
        !state.onlyFavorites || (isFavorite && isFavorite(p.id));

      return (
        matchesColor &&
        matchesPostcode &&
        matchesProfession &&
        matchesVisited &&
        matchesFavorites
      );
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
    isFavorite,
  ]);

  // Enhanced route mode toggle with smart feedback
  const handleToggleRouteMode = useCallback(() => {
    console.log('🗺️ MapContainer: Toggling route mode');

    if (mobile) triggerHapticFeedback('medium');

    if (state.routeMode) {
      // Exiting route mode
      if (state.routePoints.length > 0) {
        showToastOnce('route-exit', 'Route mode disabled', 'info');
      } else {
        showToastOnce('route-exit', 'Route mode disabled', 'info');
      }
    } else {
      // Entering route mode
      showToastOnce(
        'route-enter',
        'Route mode active - click plaques to add them to your route',
        'success'
      );
    }

    dispatch({ type: 'TOGGLE_ROUTE_MODE' });
  }, [state.routeMode, state.routePoints.length, mobile, showToastOnce]);

  // Handle plaque clicks - enhanced for route mode
  const handlePlaqueClick = useCallback(
    (plaque: Plaque) => {
      console.log(
        '🗺️ MapContainer: Plaque clicked:',
        plaque.title,
        'Route mode:',
        state.routeMode
      );

      if (mobile) triggerHapticFeedback('selection');

      if (state.routeMode) {
        // In route mode, add to route instead of showing details
        handleAddToRoute(plaque);
      } else {
        // Normal mode, show details or call external handler
        if (onPlaqueClick) {
          onPlaqueClick(plaque);
        } else {
          dispatch({ type: 'SHOW_PLAQUE_DETAILS', plaque });
        }
      }
    },
    [state.routeMode, onPlaqueClick, mobile]
  );

  // Add to route with enhanced feedback
  const handleAddToRoute = useCallback(
    (plaque: Plaque) => {
      console.log('➕ MapContainer: Adding to route:', plaque.title);

      const alreadyExists = state.routePoints.find((p) => p.id === plaque.id);

      if (alreadyExists) {
        showToastOnce(
          `duplicate-${plaque.id}`,
          `"${plaque.title}" is already in your route`,
          'info'
        );
        if (mobile) triggerHapticFeedback('error');
        return;
      }

      dispatch({ type: 'ADD_TO_ROUTE', plaque });
      showToastOnce(
        `added-${plaque.id}`,
        `Added "${plaque.title}" to route`,
        'success'
      );
      if (mobile) triggerHapticFeedback('success');
    },
    [state.routePoints, showToastOnce, mobile]
  );

  // Location filter handlers
  const handleLocationFilterSet = useCallback(
    async (coords: [number, number]) => {
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
        location: locationName,
      });

      if (onDistanceFilterChange) {
        onDistanceFilterChange({
          enabled: true,
          center: coords,
          radius: state.filterRadius,
          locationName,
        });
      }

      dispatch({
        type: 'SET_VIEW',
        center: coords,
        zoom: 14,
      });

      const plaqueCount = plaques.filter((p) => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(
          coords[0],
          coords[1],
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
    },
    [state.filterRadius, plaques, onDistanceFilterChange, showToastOnce]
  );

  const handleRadiusChange = useCallback(
    (radius: number) => {
      dispatch({ type: 'UPDATE_RADIUS', radius });

      if (onDistanceFilterChange && state.filterEnabled && state.filterCenter) {
        onDistanceFilterChange({
          enabled: true,
          center: state.filterCenter,
          radius: radius,
          locationName: state.filterLocation,
        });
      }

      if (state.filterEnabled && state.filterCenter) {
        const plaqueCount = plaques.filter((p) => {
          if (!p.latitude || !p.longitude) return false;
          const distance = calculateDistance(
            state.filterCenter![0],
            state.filterCenter![1],
            parseCoordinate(p.latitude),
            parseCoordinate(p.longitude)
          );
          return distance <= radius;
        }).length;

        const radiusText =
          radius < 1 ? `${Math.round(radius * 1000)}m` : `${radius}km`;

        showToastOnce(
          'radius-update',
          `${plaqueCount} plaque${plaqueCount !== 1 ? 's' : ''} within ${radiusText} of ${state.filterLocation}`,
          'info'
        );
      }
    },
    [
      state.filterEnabled,
      state.filterCenter,
      state.filterLocation,
      plaques,
      onDistanceFilterChange,
      showToastOnce,
    ]
  );

  const handleClearFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTER' });

    if (onDistanceFilterChange) {
      onDistanceFilterChange({
        enabled: false,
        center: null,
        radius: 1,
        locationName: null,
      });
    }

    showToastOnce(
      'filter-cleared',
      'Distance filter cleared - showing all plaques',
      'info'
    );
  }, [onDistanceFilterChange, showToastOnce]);

  // Route handlers with enhanced feedback
  const handleRemoveFromRoute = useCallback(
    (id: number) => {
      const plaque = state.routePoints.find((p) => p.id === id);
      dispatch({ type: 'REMOVE_FROM_ROUTE', plaqueId: id });

      if (mobile) triggerHapticFeedback('light');

      if (plaque) {
        showToastOnce(
          `removed-${id}`,
          `Removed "${plaque.title}" from route`,
          'info'
        );
      }
    },
    [state.routePoints, showToastOnce, mobile]
  );

  const handleReorderRoute = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex !== toIndex) {
        dispatch({ type: 'REORDER_ROUTE', fromIndex, toIndex });
        if (mobile) triggerHapticFeedback('light');
        showToastOnce('route-reordered', 'Route reordered', 'info');
      }
    },
    [showToastOnce, mobile]
  );

  const handleClearRoute = useCallback(() => {
    if (state.routePoints.length > 0) {
      dispatch({ type: 'CLEAR_ROUTE' });
      if (mobile) triggerHapticFeedback('medium');
      showToastOnce('route-cleared', 'Route cleared', 'info');
    }
  }, [state.routePoints.length, showToastOnce, mobile]);

  // FIXED: Enhanced route action handler that properly saves and dismisses loading state
  const handleRouteAction = useCallback(
    async (routeData: any) => {
      console.log('🗺️ MapContainer: Route action triggered:', routeData);

      if (mobile) triggerHapticFeedback('success');

      // CRITICAL: Show specific loading toast that can be dismissed
      const loadingToastId = toast.loading('Saving route...', {
        duration: Infinity, // Keep it until we dismiss it
      });

      try {
        // Calculate real walking data first
        let walkingData;
        try {
          console.log(
            '🚶 Calculating walking routes for',
            state.routePoints.length,
            'points'
          );
          walkingData = await calculateMultiWaypointRoute(state.routePoints);
          console.log('🚶 Walking data calculated:', walkingData);
        } catch (error) {
          console.warn(
            'Failed to calculate walking data, using fallback:',
            error
          );
          // Use fallback distance calculation
          let fallbackDistance = 0;
          for (let i = 0; i < state.routePoints.length - 1; i++) {
            const start = state.routePoints[i];
            const end = state.routePoints[i + 1];

            if (
              start.latitude &&
              start.longitude &&
              end.latitude &&
              end.longitude
            ) {
              const startLat = parseCoordinate(start.latitude);
              const startLng = parseCoordinate(start.longitude);
              const endLat = parseCoordinate(end.latitude);
              const endLng = parseCoordinate(end.longitude);

              // Haversine distance * walking factor
              const R = 6371000;
              const dLat = ((endLat - startLat) * Math.PI) / 180;
              const dLng = ((endLng - startLng) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((startLat * Math.PI) / 180) *
                  Math.cos((endLat * Math.PI) / 180) *
                  Math.sin(dLng / 2) *
                  Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;

              fallbackDistance += distance * 1.4; // Walking factor
            }
          }

          walkingData = {
            totalDistance: fallbackDistance,
            totalDuration: fallbackDistance / 1.39, // 5 km/h walking speed
            segments: [],
          };
        }

        // Save route using the useRoutes hook
        console.log('💾 Saving route to Firebase...');
        const savedRoute = await createRouteWithWalkingData(
          routeData.name,
          routeData.description || '',
          state.routePoints,
          walkingData
        );

        // CRITICAL: Dismiss the loading toast immediately
        toast.dismiss(loadingToastId);

        if (savedRoute) {
          // Show success message
          showToastOnce(
            'route-saved',
            'Route saved successfully to your library!',
            'success'
          );

          // Clear the route after successful save
          dispatch({ type: 'CLEAR_ROUTE' });

          // Exit route mode
          dispatch({ type: 'TOGGLE_ROUTE_MODE' });

          console.log('✅ Route saved successfully:', savedRoute);
        } else {
          throw new Error('Failed to save route - no route returned');
        }
      } catch (error) {
        console.error('❌ Error saving route:', error);

        // CRITICAL: Dismiss the loading toast on error too
        toast.dismiss(loadingToastId);

        // Show error message
        toast.error('Failed to save route. Please try again.');
      }

      // Call the original handler for backward compatibility if provided
      if (onRouteAction) {
        onRouteAction(routeData);
      }
    },
    [
      state.routePoints,
      createRouteWithWalkingData,
      showToastOnce,
      mobile,
      onRouteAction,
    ]
  );

  // CRITICAL FIX: Auto-center when distance filter is enabled or changes
  useEffect(() => {
    // Auto-center map when distance filter is enabled or location changes
    if (distanceFilter?.enabled && distanceFilter.center) {
      console.log('🗺️ MapContainer: Auto-centering on distance filter:', {
        center: distanceFilter.center,
        location: distanceFilter.locationName,
        radius: distanceFilter.radius
      });
      
      // Calculate appropriate zoom based on radius
      let autoZoom = 14;
      if (distanceFilter.radius <= 0.5) autoZoom = 15;
      else if (distanceFilter.radius <= 1) autoZoom = 14;
      else if (distanceFilter.radius <= 2) autoZoom = 13;
      else if (distanceFilter.radius <= 5) autoZoom = 12;
      else autoZoom = 11;
      
      // Update map view to center on the filter location
      dispatch({ 
        type: 'SET_VIEW', 
        center: distanceFilter.center, 
        zoom: autoZoom
      });
      
      // Show brief feedback for user location
      if (distanceFilter.locationName === 'Your Location') {
        setTimeout(() => {
          console.log('🗺️ Map successfully centered on your location');
          
          // Optional: Dispatch custom event for additional effects
          window.dispatchEvent(new CustomEvent('forceMapCenter', {
            detail: {
              center: distanceFilter.center,
              zoom: autoZoom,
              showMarker: true // Show the location marker
            }
          }));
        }, 300);
      }
    }
  }, [distanceFilter?.enabled, distanceFilter?.center, distanceFilter?.locationName, distanceFilter?.radius]);

  // ADDITIONAL: Handle force center prop
  useEffect(() => {
    if (forceCenter && initialCenter) {
      console.log('🗺️ MapContainer: Force centering to:', initialCenter);
      dispatch({ 
        type: 'SET_VIEW', 
        center: initialCenter, 
        zoom: initialZoom || 14 
      });
    }
  }, [forceCenter, initialCenter, initialZoom]);

  // Sync with external distance filter changes
  useEffect(() => {
    if (distanceFilter) {
      if (
        distanceFilter.enabled !== state.filterEnabled ||
        distanceFilter.radius !== state.filterRadius ||
        distanceFilter.locationName !== state.filterLocation
      ) {
        if (distanceFilter.enabled && distanceFilter.center) {
          dispatch({
            type: 'SET_LOCATION_FILTER',
            center: distanceFilter.center,
            radius: distanceFilter.radius,
            location: distanceFilter.locationName || 'Unknown Location',
          });
        } else {
          dispatch({ type: 'CLEAR_FILTER' });
        }
      }
    }
  }, [
    distanceFilter,
    state.filterEnabled,
    state.filterRadius,
    state.filterLocation,
  ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Unified Control Panel - Desktop Sidebar or Mobile Bottom Sheet */}
      <UnifiedControlPanel
        distanceFilter={{
          enabled: state.filterEnabled,
          center: state.filterCenter,
          radius: state.filterRadius,
          locationName: state.filterLocation,
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
        onPostcodesChange={(postcodes) =>
          dispatch({ type: 'SET_POSTCODES', postcodes })
        }
        onProfessionsChange={(professions) =>
          dispatch({ type: 'SET_PROFESSIONS', professions })
        }
        onVisitedChange={(onlyVisited) =>
          dispatch({ type: 'SET_ONLY_VISITED', onlyVisited })
        }
        onFavoritesChange={(onlyFavorites) =>
          dispatch({ type: 'SET_ONLY_FAVORITES', onlyFavorites })
        }
        onResetStandardFilters={() =>
          dispatch({ type: 'RESET_STANDARD_FILTERS' })
        }
        routeMode={state.routeMode}
        onToggleRoute={handleToggleRouteMode}
        routePointsCount={state.routePoints.length}
        onResetView={() =>
          dispatch({ type: 'SET_VIEW', center: [51.505, -0.09], zoom: 13 })
        }
        isPlaqueVisited={isPlaqueVisited}
        isFavorite={isFavorite}
        className="unified-control-panel"
      />

      {/* Enhanced Route Panel - Google Maps Style */}
      {state.routeMode && (
        <EnhancedRoutePanel
          points={state.routePoints}
          onRemove={handleRemoveFromRoute}
          onReorder={handleReorderRoute}
          onClear={handleClearRoute}
          onClose={handleToggleRouteMode}
          onRouteAction={handleRouteAction} // Now properly handles toast dismissal
          className="enhanced-route-panel"
        />
      )}

      {/* Status Bar - Positioned properly for both mobile and desktop */}
      {(!mobile || !state.routeMode) && (
        <div
          className={`absolute ${
            mobile ? 'bottom-2 left-2 right-2' : 'bottom-4 right-4'
          } z-[900] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-sm ${
            mobile ? 'w-auto' : ''
          }`}
        >
          <div
            className={`flex items-center ${mobile ? 'justify-center' : 'gap-2'} ${mobile ? 'flex-wrap' : ''}`}
          >
            <span className="font-medium">{visiblePlaques.length}</span> of{' '}
            <span className="font-medium">{plaques.length}</span> plaques
            {state.filterEnabled && state.filterLocation && (
              <div
                className={`${mobile ? 'mt-1 w-full text-center' : 'ml-2'} px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs`}
              >
                Within{' '}
                {state.filterRadius < 1
                  ? `${Math.round(state.filterRadius * 1000)}m`
                  : `${state.filterRadius}km`}{' '}
                of {state.filterLocation}
              </div>
            )}
            {state.routeMode && (
              <div
                className={`${mobile ? 'mt-1 w-full text-center' : 'ml-2'} px-2 py-1 bg-green-50 text-green-700 rounded text-xs`}
              >
                Route Mode: {state.routePoints.length} stops
              </div>
            )}
          </div>
        </div>
      )}

      {/* The Map - Full height and width with PROPER WALKING ROUTES */}
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
        // CRITICAL: Pass flag to enable walking routes
        useWalkingRoutes={true}
      />
    </div>
  );
};