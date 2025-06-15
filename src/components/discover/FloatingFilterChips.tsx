// src/components/discover/FloatingFilterChips.tsx
import React, { useRef, useEffect } from 'react';
import { X, MapPin, Filter, Search, User, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';

interface FilterChip {
  id: string;
  type: 'distance' | 'search' | 'color' | 'postcode' | 'profession' | 'organisation' | 'visited' | 'favorites';
  label: string;
  value?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald' | 'yellow';
  onRemove: () => void;
}

interface FloatingFilterChipsProps {
  filters: FilterChip[];
  maxVisible?: number;
  onClearAll?: () => void;
  className?: string;
  position?: 'top' | 'bottom';
}

export const FloatingFilterChips: React.FC<FloatingFilterChipsProps> = ({
  filters,
  maxVisible = 3,
  onClearAll,
  className = '',
  position = 'top'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const safeArea = useSafeArea();
  const mobile = isMobile();

  // Auto-scroll to show new chips
  useEffect(() => {
    if (scrollRef.current && filters.length > 0) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [filters.length]);

  if (filters.length === 0) return null;



  const visibleFilters = filters.slice(0, maxVisible);
  const hiddenCount = Math.max(0, filters.length - maxVisible);


  const topOffset = position === 'top' 
    ? `${16 + safeArea.top}px` 
    : 'auto';

  const bottomOffset = position === 'bottom'
    ? `${16 + safeArea.bottom}px`
    : 'auto';

  return (
    <div 
      className={`fixed left-4 right-4 z-[995] ${className}`}
      style={{
        top: topOffset,
        bottom: bottomOffset
      }}
    >
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Individual filter chips */}
        {visibleFilters.map((filter) => (
          <FilterChipComponent
            key={filter.id}
            filter={filter}
            onRemove={() => {
              if (mobile) triggerHapticFeedback('light');
              filter.onRemove();
            }}
          />
        ))}

        {/* Hidden filters indicator */}
        {hiddenCount > 0 && (
          <Badge 
            variant="secondary" 
            className="flex-shrink-0 h-8 px-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-full flex items-center gap-1"
          >
            <Filter size={12} />
            <span className="text-xs font-medium">+{hiddenCount} more</span>
          </Badge>
        )}

        {/* Clear all button */}
        {filters.length > 1 && onClearAll && (
          <button
            onClick={() => {
              if (mobile) triggerHapticFeedback('medium');
              onClearAll();
            }}
            className="flex-shrink-0 h-8 px-3 bg-red-100 text-red-700 border border-red-200 rounded-full flex items-center gap-1 hover:bg-red-200 transition-colors"
            style={{
              minHeight: mobile ? '44px' : '32px',
              height: mobile ? '44px' : '32px'
            }}
          >
            <X size={12} />
            <span className="text-xs font-medium">Clear All</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Individual filter chip component
interface FilterChipComponentProps {
  filter: FilterChip;
  onRemove: () => void;
}

const FilterChipComponent: React.FC<FilterChipComponentProps> = ({ filter, onRemove }) => {
  const mobile = isMobile();

  return (
    <div 
      className={`flex-shrink-0 h-8 px-3 border rounded-full flex items-center gap-2 backdrop-blur-sm ${getChipColorClasses(filter.color)} shadow-sm`}
      style={{
        minHeight: mobile ? '44px' : '32px',
        height: mobile ? '44px' : '32px'
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getChipIcon(filter.type)}
      </div>

      {/* Label */}
      <span className="text-xs font-medium truncate max-w-32">
        {filter.label}
      </span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        style={{
          minWidth: mobile ? '20px' : '16px',
          minHeight: mobile ? '20px' : '16px'
        }}
        aria-label={`Remove ${filter.label} filter`}
      >
        <X size={mobile ? 12 : 10} />
      </button>
    </div>
  );
};

// Helper function to get color classes (moved outside component for performance)
const getChipColorClasses = (color: FilterChip['color']) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  return colorMap[color];
};

// Helper function to get chip icons (moved outside component for performance)
const getChipIcon = (type: FilterChip['type']) => {
  switch (type) {
    case 'distance':
      return <MapPin size={12} />;
    case 'search':
      return <Search size={12} />;
    case 'profession':
      return <User size={12} />;
    case 'organisation':
      return <Building size={12} />;
    default:
      return <Filter size={12} />;
  }
};

// Hook for managing filter chips state
export const useFilterChips = (
  distanceFilter: { enabled: boolean; locationName?: string; radius?: number },
  searchQuery: string,
  selectedColors: string[],
  selectedPostcodes: string[],
  selectedProfessions: string[],
  selectedOrganisations: string[],
  onlyVisited: boolean,
  onlyFavorites: boolean,
  onRemoveFilter: (type: string, value?: string) => void,
  onClearAll: () => void
) => {
  const filterChips: FilterChip[] = [];

  // Distance filter chip
  if (distanceFilter.enabled && distanceFilter.locationName) {
    const radiusText = distanceFilter.radius 
      ? distanceFilter.radius < 1 
        ? `${Math.round(distanceFilter.radius * 1000)}m`
        : `${distanceFilter.radius}km`
      : '';
    
    filterChips.push({
      id: 'distance',
      type: 'distance',
      label: `${radiusText} from ${distanceFilter.locationName}`,
      color: 'green',
      onRemove: () => onRemoveFilter('distance')
    });
  }

  // Search filter chip
  if (searchQuery.trim()) {
    filterChips.push({
      id: 'search',
      type: 'search',
      label: `"${searchQuery.length > 20 ? searchQuery.slice(0, 20) + '...' : searchQuery}"`,
      color: 'blue',
      onRemove: () => onRemoveFilter('search')
    });
  }

  // Color filter chips
  selectedColors.forEach(color => {
    filterChips.push({
      id: `color-${color}`,
      type: 'color',
      label: color.charAt(0).toUpperCase() + color.slice(1),
      value: color,
      color: 'purple',
      onRemove: () => onRemoveFilter('color', color)
    });
  });

  // Postcode filter chips
  selectedPostcodes.forEach(postcode => {
    filterChips.push({
      id: `postcode-${postcode}`,
      type: 'postcode',
      label: postcode,
      value: postcode,
      color: 'orange',
      onRemove: () => onRemoveFilter('postcode', postcode)
    });
  });

  // Profession filter chips
  selectedProfessions.forEach(profession => {
    filterChips.push({
      id: `profession-${profession}`,
      type: 'profession',
      label: profession.length > 15 ? profession.slice(0, 15) + '...' : profession,
      value: profession,
      color: 'blue',
      onRemove: () => onRemoveFilter('profession', profession)
    });
  });

  // Organisation filter chips
  selectedOrganisations.forEach(org => {
    filterChips.push({
      id: `organisation-${org}`,
      type: 'organisation',
      label: org.length > 20 ? org.slice(0, 20) + '...' : org,
      value: org,
      color: 'purple',
      onRemove: () => onRemoveFilter('organisation', org)
    });
  });

  // Toggle filter chips
  if (onlyVisited) {
    filterChips.push({
      id: 'visited',
      type: 'visited',
      label: 'Visited Only',
      color: 'emerald',
      onRemove: () => onRemoveFilter('visited')
    });
  }

  if (onlyFavorites) {
    filterChips.push({
      id: 'favorites',
      type: 'favorites',
      label: 'Favorites Only',
      color: 'yellow',
      onRemove: () => onRemoveFilter('favorites')
    });
  }

  return {
    filterChips,
    hasFilters: filterChips.length > 0,
    filterCount: filterChips.length,
    clearAll: onClearAll
  };
};