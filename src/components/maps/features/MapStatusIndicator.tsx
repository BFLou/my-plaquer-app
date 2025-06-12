// src/components/maps/features/MapStatusIndicator.tsx
import React, { useMemo } from 'react';
import { MapPin, Filter, Route, Eye, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

interface DistanceFilter {
  enabled: boolean;
  center: [number, number] | null;
  radius: number;
  locationName: string | null;
}

interface MapStatusIndicatorProps {
  // Filter state
  distanceFilter: DistanceFilter;
  searchQuery?: string;
  activeFiltersCount: number;
  
  // Data state
  totalPlaques: number;
  visiblePlaques: number;
  
  // Route state
  routeMode: boolean;
  routePointsCount: number;
  
  // View state
  viewMode?: 'map' | 'grid' | 'list';
  isLoading?: boolean;
  
  // Actions
  onClearDistanceFilter?: () => void;
  onClearSearch?: () => void;
  onClearAllFilters?: () => void;
  onToggleRouteMode?: () => void;
  
  // Display options
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
  className?: string;
}

export const MapStatusIndicator: React.FC<MapStatusIndicatorProps> = ({
  distanceFilter,
  searchQuery = '',
  activeFiltersCount,
  totalPlaques,
  visiblePlaques,
  routeMode,
  routePointsCount,
  viewMode = 'map',
  isLoading = false,
  onClearDistanceFilter,
  onClearSearch,
  onClearAllFilters,
  onToggleRouteMode,
  position = 'bottom-right',
  compact = false,
  className = ''
}) => {
  const mobile = isMobile();
  
  // Calculate filter summary
  const filterSummary = useMemo(() => {
    const activeFilters = [];
    
    if (distanceFilter.enabled && distanceFilter.locationName) {
      activeFilters.push({
        type: 'distance',
        label: `${distanceFilter.radius < 1 
          ? `${Math.round(distanceFilter.radius * 1000)}m` 
          : `${distanceFilter.radius}km`} from ${distanceFilter.locationName}`,
        icon: MapPin,
        onClear: onClearDistanceFilter
      });
    }
    
    if (searchQuery.trim()) {
      activeFilters.push({
        type: 'search',
        label: `"${searchQuery.length > 20 ? searchQuery.slice(0, 20) + '...' : searchQuery}"`,
        icon: Search,
        onClear: onClearSearch
      });
    }
    
    const otherFiltersCount = activeFiltersCount - (distanceFilter.enabled ? 1 : 0) - (searchQuery.trim() ? 1 : 0);
    if (otherFiltersCount > 0) {
      activeFilters.push({
        type: 'other',
        label: `${otherFiltersCount} other filter${otherFiltersCount > 1 ? 's' : ''}`,
        icon: Filter,
        onClear: undefined
      });
    }
    
    return activeFilters;
  }, [distanceFilter, searchQuery, activeFiltersCount, onClearDistanceFilter, onClearSearch]);

  // Get position classes
  const getPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };
    return positions[position];
  };

  // Don't render if no meaningful status to show
  if (!isLoading && filterSummary.length === 0 && !routeMode && visiblePlaques === totalPlaques) {
    return null;
  }

  const handleClearAction = (action?: () => void) => {
    if (mobile) triggerHapticFeedback('light');
    action?.();
  };

  return (
    <div className={`
      fixed z-[900] ${getPositionClasses()} 
      ${mobile ? 'max-w-[calc(100vw-2rem)]' : 'max-w-sm'}
      ${className}
    `}>
      <div className={`
        bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50
        ${compact ? 'p-2' : 'p-3'}
        ${mobile ? 'min-w-0' : ''}
      `}>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="text-sm text-gray-600">Updating map...</span>
          </div>
        )}
        
        {/* Results Summary */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Eye size={14} className="text-gray-500 flex-shrink-0" />
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-800 truncate`}>
              {visiblePlaques.toLocaleString()} of {totalPlaques.toLocaleString()} plaques
            </span>
            {visiblePlaques !== totalPlaques && (
              <Badge variant="secondary" className="text-xs px-1 h-4">
                Filtered
              </Badge>
            )}
          </div>
          
          {/* Clear all filters button */}
          {(filterSummary.length > 1 || activeFiltersCount > 1) && onClearAllFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearAction(onClearAllFilters)}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {filterSummary.length > 0 && (
          <div className="space-y-1.5">
            {filterSummary.map((filter, index) => (
              <div 
                key={`${filter.type}-${index}`}
                className={`
                  flex items-center gap-2 px-2 py-1 rounded
                  ${filter.type === 'distance' ? 'bg-green-50 border border-green-200' : ''}
                  ${filter.type === 'search' ? 'bg-blue-50 border border-blue-200' : ''}
                  ${filter.type === 'other' ? 'bg-gray-50 border border-gray-200' : ''}
                `}
              >
                <filter.icon 
                  size={12} 
                  className={`
                    flex-shrink-0
                    ${filter.type === 'distance' ? 'text-green-600' : ''}
                    ${filter.type === 'search' ? 'text-blue-600' : ''}
                    ${filter.type === 'other' ? 'text-gray-600' : ''}
                  `} 
                />
                <span className={`
                  ${compact ? 'text-xs' : 'text-sm'} 
                  ${filter.type === 'distance' ? 'text-green-800' : ''}
                  ${filter.type === 'search' ? 'text-blue-800' : ''}
                  ${filter.type === 'other' ? 'text-gray-700' : ''}
                  flex-1 min-w-0 truncate
                `}>
                  {filter.label}
                </span>
                
                {filter.onClear && (
                  <button
                    onClick={() => handleClearAction(filter.onClear)}
                    className={`
                      flex-shrink-0 hover:bg-black/10 rounded-full p-0.5 transition-colors
                      ${mobile ? 'min-w-[24px] min-h-[24px] flex items-center justify-center' : ''}
                    `}
                    aria-label={`Clear ${filter.type} filter`}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Route Mode Status */}
        {routeMode && (
          <div className={`
            ${filterSummary.length > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}
          `}>
            <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 border border-purple-200 rounded">
              <Route size={12} className="text-purple-600 flex-shrink-0" />
              <span className={`
                ${compact ? 'text-xs' : 'text-sm'} text-purple-800 flex-1
              `}>
                Route Mode: {routePointsCount} stop{routePointsCount !== 1 ? 's' : ''}
              </span>
              
              {onToggleRouteMode && (
                <button
                  onClick={() => handleClearAction(onToggleRouteMode)}
                  className={`
                    flex-shrink-0 hover:bg-black/10 rounded-full p-0.5 transition-colors
                    ${mobile ? 'min-w-[24px] min-h-[24px] flex items-center justify-center' : ''}
                  `}
                  aria-label="Exit route mode"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Performance indicator for large datasets */}
        {visiblePlaques > 1000 && (
          <div className={`
            ${(filterSummary.length > 0 || routeMode) ? 'mt-2 pt-2 border-t border-gray-100' : ''}
          `}>
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Large dataset - some features may be limited
            </div>
          </div>
        )}

        {/* Helpful hints for mobile */}
        {mobile && viewMode === 'map' && filterSummary.length === 0 && !routeMode && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              Tap markers to explore • Use controls to filter
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced version with animation support
export const AnimatedMapStatusIndicator: React.FC<MapStatusIndicatorProps & {
  animateChanges?: boolean;
  slideDirection?: 'up' | 'down' | 'left' | 'right';
}> = ({
  animateChanges = true,
  slideDirection = 'up',
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    if (animateChanges) {
      setIsVisible(true);
    }
  }, [animateChanges]);

  const getSlideClasses = () => {
    if (!animateChanges) return '';
    
    const directions = {
      up: isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      down: isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
      left: isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
      right: isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
    };
    
    return `transition-all duration-300 ease-out ${directions[slideDirection]}`;
  };

  return (
    <div className={getSlideClasses()}>
      <MapStatusIndicator {...props} />
    </div>
  );
};

export default MapStatusIndicator;