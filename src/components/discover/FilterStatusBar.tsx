// src/components/discover/FilterStatusBar.tsx
import React from 'react';
import { X, MapPin, Filter, Clock, Star } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterStatusBarProps {
  activeFilters: {
    search?: string;
    colors: string[];
    postcodes: string[];
    professions: string[];
    organisations: string[];
    onlyVisited: boolean;
    onlyFavorites: boolean;
    distanceFilter?: {
      enabled: boolean;
      locationName: string;
      radius: number;
    };
  };
  resultCount: number;
  totalCount: number;
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
  onOpenFilters: () => void;
  className?: string;
}

export const FilterStatusBar: React.FC<FilterStatusBarProps> = ({
  activeFilters,
  resultCount,
  totalCount,
  onRemoveFilter,
  onClearAll,
  className
}) => {
  const hasActiveFilters = 
    activeFilters.colors.length > 0 ||
    activeFilters.postcodes.length > 0 ||
    activeFilters.professions.length > 0 ||
    activeFilters.organisations.length > 0 ||
    activeFilters.onlyVisited ||
    activeFilters.onlyFavorites ||
    activeFilters.distanceFilter?.enabled ||
    activeFilters.search;

  if (!hasActiveFilters) return null;

  const getFilterBadgeColor = (type: string) => {
    const colors = {
      search: 'bg-blue-100 text-blue-800 border-blue-200',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      postcode: 'bg-green-100 text-green-800 border-green-200',
      profession: 'bg-orange-100 text-orange-800 border-orange-200',
      organisation: 'bg-pink-100 text-pink-800 border-pink-200',
      visited: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      favorites: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      distance: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderFilterBadge = (
    type: string,
    label: string,
    value?: string,
    icon?: React.ReactNode
  ) => (
    <Badge
      key={`${type}-${value || 'toggle'}`}
      variant="secondary"
      className={cn(
        "gap-1 pr-1 transition-all hover:scale-105",
        getFilterBadgeColor(type)
      )}
    >
      {icon && <span className="text-xs">{icon}</span>}
      <span className="text-xs font-medium">{label}</span>
      <button
        onClick={() => onRemoveFilter(type, value)}
        className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X size={12} />
      </button>
    </Badge>
  );

  return (
    <div className={cn(
      "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-3 rounded-lg shadow-sm",
      className
    )}>
      {/* Results Summary */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="text-blue-600" size={16} />
          <span className="text-sm font-medium text-gray-800">
            {resultCount} of {totalCount} plaques
          </span>
          {resultCount !== totalCount && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              Filtered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      <div className="flex flex-wrap gap-1.5">
        {/* Search Filter */}
        {activeFilters.search && renderFilterBadge(
          'search',
          `"${activeFilters.search.length > 20 ? activeFilters.search.slice(0, 20) + '...' : activeFilters.search}"`,
          'search'
        )}

        {/* Distance Filter */}
        {activeFilters.distanceFilter?.enabled && renderFilterBadge(
          'distance',
          `${activeFilters.distanceFilter.locationName} (${activeFilters.distanceFilter.radius}km)`,
          'distance',
          <MapPin size={10} />
        )}

        {/* Color Filters */}
        {activeFilters.colors.map(color => renderFilterBadge(
          'color',
          color.charAt(0).toUpperCase() + color.slice(1),
          color,
          <div className={cn(
            "w-2 h-2 rounded-full",
            color === 'blue' ? 'bg-blue-500' :
            color === 'green' ? 'bg-green-500' :
            color === 'brown' ? 'bg-amber-700' :
            color === 'black' ? 'bg-gray-800' :
            color === 'red' ? 'bg-red-500' :
            'bg-gray-500'
          )} />
        ))}

        {/* Postcode Filters */}
        {activeFilters.postcodes.map(postcode => renderFilterBadge(
          'postcode',
          postcode,
          postcode,
          <MapPin size={10} />
        ))}

        {/* Profession Filters */}
        {activeFilters.professions.map(profession => renderFilterBadge(
          'profession',
          profession.length > 15 ? profession.slice(0, 15) + '...' : profession,
          profession
        ))}

        {/* Organisation Filters */}
        {activeFilters.organisations.map(org => renderFilterBadge(
          'organisation',
          org.length > 20 ? org.slice(0, 20) + '...' : org,
          org
        ))}

        {/* Toggle Filters */}
        {activeFilters.onlyVisited && renderFilterBadge(
          'visited',
          'Visited Only',
          'visited',
          <Clock size={10} />
        )}

        {activeFilters.onlyFavorites && renderFilterBadge(
          'favorites',
          'Favorites Only',
          'favorites',
          <Star size={10} />
        )}
      </div>
    </div>
  );
};