// src/components/maps/MapContainer.tsx - Enhanced with location-based search and distance filtering
import React, { useReducer, useMemo, useCallback } from 'react';
import { MapView } from './MapView';
import { SearchBar } from './features/Search/SearchBar';
import { LocationFilter } from './features/LocationFilter/LocationFilter';
import { RoutePanel } from './features/RouteBuilder/RoutePanel';
import { MapControls } from './features/Controls/MapControls';
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
  filterLocation: string | null; // Store the location name
  
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
  routeMode: false,
  routePoints: [],
  showingDetails: null
};

interface MapContainerProps {
  plaques: Plaque[];
  onPlaqueClick?: (plaque: Plaque) => void;
  className?: string;
}

export const MapContainer: React.FC<MapContainerProps> = ({ 
  plaques, 
  onPlaqueClick,
  className = '' 
}) => {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  // Filter plaques based on current state
  const visiblePlaques = useMemo(() => {
    let filtered = plaques;
    
    // Apply search filter (only for plaque text searches when no distance filter is active)
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
    
    return filtered;
  }, [plaques, state.searchQuery, state.filterEnabled, state.filterCenter, state.filterRadius]);

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

  // New handler for location-based searches (replaces both search and filter)
  const handleLocationSelect = useCallback((result: any) => {
    dispatch({ type: 'SELECT_RESULT', result });
    
    if (result.coordinates) {
      // Clear any existing text search when selecting a location
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
      
      toast.success(`Found ${plaqueCount} plaques within ${defaultRadius}km of ${result.title}`);
    }
  }, [plaques]);

  // Updated location set handler - this should only work when manually setting location
  const handleManualLocationSet = useCallback((coords: [number, number]) => {
    // Clear any text search
    dispatch({ type: 'SET_SEARCH', query: '' });
    
    dispatch({ 
      type: 'SET_LOCATION_FILTER', 
      center: coords, 
      radius: state.filterRadius,
      location: 'My Location'
    });
    
    // Center map on the location
    dispatch({ 
      type: 'SET_VIEW', 
      center: coords, 
      zoom: 14
    });
    
    toast.success('Location set! Showing plaques within your selected radius.');
  }, [state.filterRadius]);

  const handleRadiusChange = useCallback((radius: number) => {
    dispatch({ type: 'UPDATE_RADIUS', radius });
    
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
      
      toast.info(`${plaqueCount} plaques within ${radius}km of ${state.filterLocation}`);
    }
  }, [state.filterEnabled, state.filterCenter, state.filterLocation, plaques]);

  const handleClearFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTER' });
    toast.info('Distance filter cleared - showing all plaques');
  }, []);

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

      {/* Location Filter - Only for setting distance filters */}
      <div className="absolute top-4 right-4 z-[1000]">
        <LocationFilter
          enabled={state.filterEnabled}
          center={state.filterCenter}
          radius={state.filterRadius}
          locationName={state.filterLocation}
          onSetLocation={handleManualLocationSet}
          onRadiusChange={handleRadiusChange}
          onClear={handleClearFilter}
        />
      </div>

      {/* Route Panel */}
      {state.routeMode && (
        <div className="absolute left-4 top-20 z-[1000] w-80 max-w-[calc(100vw-2rem)]">
          <RoutePanel
            points={state.routePoints}
            onRemove={(id) => dispatch({ type: 'REMOVE_FROM_ROUTE', plaqueId: id })}
            onReorder={(from, to) => dispatch({ type: 'REORDER_ROUTE', fromIndex: from, toIndex: to })}
            onClear={() => dispatch({ type: 'CLEAR_ROUTE' })}
            onClose={() => dispatch({ type: 'TOGGLE_ROUTE_MODE' })}
          />
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <MapControls
          routeMode={state.routeMode}
          onToggleRoute={() => dispatch({ type: 'TOGGLE_ROUTE_MODE' })}
          onResetView={() => dispatch({ type: 'SET_VIEW', center: [51.505, -0.09], zoom: 13 })}
        />
      </div>

      {/* Enhanced Status Bar */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-3 py-2 text-sm status-bar-enhanced">
        <div className="flex items-center gap-2">
          <span className="font-medium">{visiblePlaques.length}</span> of{' '}
          <span className="font-medium">{plaques.length}</span> plaques
          {state.filterEnabled && state.filterLocation && (
            <div className="status-location-info ml-2">
              Within {state.filterRadius}km of {state.filterLocation}
            </div>
          )}
          {state.searchQuery && !state.filterEnabled && (
            <div className="status-location-info ml-2">
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
      />
    </div>
  );
};