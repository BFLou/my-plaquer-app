// src/components/maps/MapContainer.tsx - FIXED: Complete integration with distance filter and MapFilterButton
import React, { useReducer, useMemo, useCallback, useEffect } from 'react';
import { MapView } from './MapView';
import { SearchBar } from './features/Search/SearchBar';
import { RoutePanel } from './features/RouteBuilder/RoutePanel';
import { UnifiedControlPanel } from './features/UnifiedControlPanel';
import { Plaque } from '@/types/plaque';
import { calculateDistance } from './utils/routeUtils';
import { toast } from 'sonner';

interface MapState {
  // View state
  center: [number, number];
  zoom: number;
  
  // Search state
  searchQuery: string;
  selectedResult: any | null;
  
  // Enhanced filter state
  filterCenter: [number, number] | null;
  filterRadius: number;
  filterEnabled: boolean;
  filterLocation: string | null;
  
  // NEW: Standard filter state
  selectedColors: string[];
  selectedPostcodes: string[];
  selectedProfessions: string[];
  onlyVisited: boolean;
  onlyFavorites: boolean;
  
  // Route state
  routeMode: boolean;
  routePoints: Plaque[];
  
  // UI state
  showingDetails: Plaque | null;
}

type MapAction = 
  | { type: 'SET_VIEW'; center: [number, number]; zoom: number }
  | { type: 'SET_SEARCH'; query: string }
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
  | { type: 'ADD_TO_ROUTE'; plaque: Plaque }
  | { type: 'REMOVE_FROM_ROUTE'; plaqueId: number }
  | { type: 'REORDER_ROUTE'; fromIndex: number; toIndex: number }
  | { type: 'CLEAR_ROUTE' }
  | { type: 'SHOW_PLAQUE_DETAILS'; plaque: Plaque }
  | { type: 'HIDE_PLAQUE_DETAILS' };

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, center: action.center, zoom: action.zoom };
    
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };
    
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
      if (state.routePoints.find(p => p.id === action.plaque.id)) {
        toast.info('Already in route');
        return state;
      }
      toast.success(`Added "${action.plaque.title}" to route`);
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
  searchQuery: '',
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
  // Distance filter communication props
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
  // External filter functions
  isPlaqueVisited?: (id: number) => boolean;
  isFavorite?: (id: number) => boolean;
}

export const MapContainer: React.FC<MapContainerProps> = (props) => {
  const { 
    plaques, 
    onPlaqueClick,
    className = '',
    onDistanceFilterChange,
    distanceFilter,
    isPlaqueVisited,
    isFavorite
  } = props;

  const [state, dispatch] = useReducer(mapReducer, {
    ...initialState,
    // Initialize with external distance filter if provided
    filterCenter: distanceFilter?.center || null,
    filterRadius: distanceFilter?.radius || 1,
    filterEnabled: distanceFilter?.enabled || false,
    filterLocation: distanceFilter?.locationName || null,
  });

  // Filter plaques based on current state
  const visiblePlaques = useMemo(() => {
    let filtered = plaques;
    
    // Apply search filter (only when no distance filter is active)
    if (state.searchQuery && !state.filterEnabled) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query)
      );
    }
    
    // Apply distance filter (this overrides text search when active)
    if (state.filterEnabled && state.filterCenter) {
      filtered = plaques.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(
          state.filterCenter![0], 
          state.filterCenter![1],
          parseFloat(p.latitude as string), 
          parseFloat(p.longitude as string)
        );
        return distance <= state.filterRadius;
      });
    }
    
    // Apply standard filters
    filtered = filtered.filter(p => {
      // Color filter
      const matchesColor = state.selectedColors.length === 0 || 
        (p.color && state.selectedColors.includes(p.color.toLowerCase()));
      
      // Postcode filter
      const matchesPostcode = state.selectedPostcodes.length === 0 || 
        (p.postcode && state.selectedPostcodes.includes(p.postcode));
      
      // Profession filter
      const matchesProfession = state.selectedProfessions.length === 0 || 
        (p.profession && state.selectedProfessions.includes(p.profession));
      
      // Visited filter
      const matchesVisited = !state.onlyVisited || 
        p.visited || (isPlaqueVisited && isPlaqueVisited(p.id));
      
      // Favorites filter
      const matchesFavorites = !state.onlyFavorites || 
        (isFavorite && isFavorite(p.id));
      
      return matchesColor && matchesPostcode && matchesProfession && 
             matchesVisited && matchesFavorites;
    });
    
    return filtered;
  }, [
    plaques, 
    state.searchQuery, 
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

  const handlePlaqueClick = useCallback((plaque: Plaque) => {
    if (state.routeMode) {
      dispatch({ type: 'ADD_TO_ROUTE', plaque });
    } else if (onPlaqueClick) {
      onPlaqueClick(plaque);
    }
  }, [state.routeMode, onPlaqueClick]);

  const handleSearchSelect = useCallback((result: any) => {
    dispatch({ type: 'SELECT_RESULT', result });
    
    if (result.coordinates) {
      dispatch({ 
        type: 'SET_VIEW', 
        center: result.coordinates, 
        zoom: result.type === 'plaque' ? 16 : 14 
      });
    }
  }, []);

  // Enhanced location selection for distance filtering
  const handleLocationSelect = useCallback((result: any) => {
    dispatch({ type: 'SELECT_RESULT', result });
    
    if (result.coordinates) {
      // Clear any existing text search
      dispatch({ type: 'SET_SEARCH', query: '' });
      
      // Set view to the location
      dispatch({ 
        type: 'SET_VIEW', 
        center: result.coordinates, 
        zoom: result.type === 'postcode' ? 15 : 13
      });
      
      // Enable distance filter with default radius
      const defaultRadius = result.type === 'postcode' ? 0.5 : 1.5;
      dispatch({ 
        type: 'SET_LOCATION_FILTER', 
        center: result.coordinates, 
        radius: defaultRadius,
        location: result.title
      });
      
      // NEW: Notify parent component
      if (onDistanceFilterChange) {
        onDistanceFilterChange({
          enabled: true,
          center: result.coordinates,
          radius: defaultRadius,
          locationName: result.title
        });
      }
      
      // Show feedback
      const plaqueCount = plaques.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(
          result.coordinates[0], 
          result.coordinates[1],
          parseFloat(p.latitude as string), 
          parseFloat(p.longitude as string)
        );
        return distance <= defaultRadius;
      }).length;
      
      toast.success(
        `Found ${plaqueCount} plaque${plaqueCount !== 1 ? 's' : ''} within ${defaultRadius}km of ${result.title}`
      );
    }
  }, [plaques, onDistanceFilterChange]);

  // Handle location setting from redesigned LocationFilter
  const handleLocationFilterSet = useCallback(async (coords: [number, number]) => {
    // Clear any text search
    dispatch({ type: 'SET_SEARCH', query: '' });
    
    // Try to get a readable location name
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
    
    // Notify parent component of distance filter change
    if (onDistanceFilterChange) {
      onDistanceFilterChange({
        enabled: true,
        center: coords,
        radius: state.filterRadius,
        locationName
      });
    }
    
    // Center map on the location
    dispatch({ 
      type: 'SET_VIEW', 
      center: coords, 
      zoom: 14
    });
    
    // Show feedback with plaque count
    const plaqueCount = plaques.filter(p => {
      if (!p.latitude || !p.longitude) return false;
      const distance = calculateDistance(
        coords[0], coords[1],
        parseFloat(p.latitude as string), 
        parseFloat(p.longitude as string)
      );
      return distance <= state.filterRadius;
    }).length;
    
    toast.success(
      `Location set! Found ${plaqueCount} plaque${plaqueCount !== 1 ? 's' : ''} within ${state.filterRadius}km`
    );
  }, [state.filterRadius, plaques, onDistanceFilterChange]);

  // Handle radius changes from redesigned LocationFilter
  const handleRadiusChange = useCallback((radius: number) => {
    dispatch({ type: 'UPDATE_RADIUS', radius });
    
    // Notify parent component of radius change
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
          parseFloat(p.latitude as string), 
          parseFloat(p.longitude as string)
        );
        return distance <= radius;
      }).length;
      
      // Format radius for display
      const radiusText = radius < 1 ? `${Math.round(radius * 1000)}m` : `${radius}km`;
      
      toast.info(
        `${plaqueCount} plaque${plaqueCount !== 1 ? 's' : ''} within ${radiusText} of ${state.filterLocation}`
      );
    }
  }, [state.filterEnabled, state.filterCenter, state.filterLocation, plaques, onDistanceFilterChange]);

  // Handle clearing filter from redesigned LocationFilter
  const handleClearFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTER' });
    
    // Notify parent component of filter clear
    if (onDistanceFilterChange) {
      onDistanceFilterChange({
        enabled: false,
        center: null,
        radius: 1,
        locationName: null
      });
    }
    
    toast.info('Distance filter cleared - showing all plaques');
  }, [onDistanceFilterChange]);

  // Sync with external distance filter changes
  useEffect(() => {
    if (distanceFilter) {
      if (distanceFilter.enabled !== state.filterEnabled ||
          distanceFilter.radius !== state.filterRadius ||
          distanceFilter.locationName !== state.filterLocation) {
        
        // Update internal state to match external filter
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

  return (
    <div className={`relative h-[600px] w-full ${className}`}>
      {/* Enhanced Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-4">
        <SearchBar 
          plaques={plaques}
          value={state.searchQuery}
          onChange={(query) => dispatch({ type: 'SET_SEARCH', query })}
          onSelect={handleSearchSelect}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* NEW: Unified Control Panel */}
      <div className="absolute top-16 left-4 z-[1000]">
        <UnifiedControlPanel
          // Distance filter props
          distanceFilter={{
            enabled: state.filterEnabled,
            center: state.filterCenter,
            radius: state.filterRadius,
            locationName: state.filterLocation
          }}
          onSetLocation={handleLocationFilterSet}
          onRadiusChange={handleRadiusChange}
          onClearDistanceFilter={handleClearFilter}
          
          // Standard filter props
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
          
          // Route props
          routeMode={state.routeMode}
          onToggleRoute={() => dispatch({ type: 'TOGGLE_ROUTE_MODE' })}
          routePointsCount={state.routePoints.length}
          
          // Reset props
          onResetView={() => dispatch({ type: 'SET_VIEW', center: [51.505, -0.09], zoom: 13 })}
          
          // External functions
          isPlaqueVisited={isPlaqueVisited}
          isFavorite={isFavorite}
        />
      </div>

      {/* Route Panel - Positioned to avoid overlap with control panel */}
      {state.routeMode && (
        <div className="absolute left-56 top-16 z-[1000] w-80 max-w-[calc(100vw-14rem)]">
          <RoutePanel
            points={state.routePoints}
            onRemove={(id) => dispatch({ type: 'REMOVE_FROM_ROUTE', plaqueId: id })}
            onReorder={(from, to) => dispatch({ type: 'REORDER_ROUTE', fromIndex: from, toIndex: to })}
            onClear={() => dispatch({ type: 'CLEAR_ROUTE' })}
            onClose={() => dispatch({ type: 'TOGGLE_ROUTE_MODE' })}
          />
        </div>
      )}

      {/* Enhanced Status Bar */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{visiblePlaques.length}</span> of{' '}
          <span className="font-medium">{plaques.length}</span> plaques
          {state.filterEnabled && state.filterLocation && (
            <div className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              Within {state.filterRadius < 1 
                ? `${Math.round(state.filterRadius * 1000)}m` 
                : `${state.filterRadius}km`} of {state.filterLocation}
            </div>
          )}
          {state.searchQuery && !state.filterEnabled && (
            <div className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              Matching "{state.searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* The Map */}
      <MapView
        plaques={visiblePlaques}
        center={state.center}
        zoom={state.zoom}
        routeMode={state.routeMode}
        routePoints={state.routePoints}
        onPlaqueClick={handlePlaqueClick}
        filterCenter={state.filterCenter}
        filterRadius={state.filterRadius}
        filterEnabled={state.filterEnabled}
        filterLocationName={state.filterLocation}
      />
    </div>
  );
};