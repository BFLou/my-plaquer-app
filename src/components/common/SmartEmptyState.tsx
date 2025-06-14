// src/components/common/SmartEmptyState.tsx
import React from 'react';
import {
  Search,
  MapPin,
  Filter,
  Lightbulb,
  RefreshCw,
  Navigation,
  TrendingUp,
  Users,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FilterContext {
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
}

interface SmartEmptyStateProps {
  totalPlaques: number;
  filteredCount: number;
  filterContext: FilterContext;
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAllFilters: () => void;
  onSuggestAction: (action: string, params?: any) => void;
  className?: string;
}

export const SmartEmptyState: React.FC<SmartEmptyStateProps> = ({
  totalPlaques,
  filterContext,
  onRemoveFilter,
  onClearAllFilters,
  onSuggestAction,
  className = '',
}) => {
  // Analyze filter context to provide smart suggestions
  const getEmptyStateContent = () => {
    const hasFilters =
      filterContext.colors.length > 0 ||
      filterContext.postcodes.length > 0 ||
      filterContext.professions.length > 0 ||
      filterContext.organisations.length > 0 ||
      filterContext.onlyVisited ||
      filterContext.onlyFavorites ||
      filterContext.distanceFilter?.enabled ||
      filterContext.search;

    // No filters applied - genuine empty state
    if (!hasFilters) {
      return {
        title: 'No plaques available',
        description: "It looks like there's no plaque data loaded yet.",
        icon: <Map className="w-16 h-16 text-gray-400" />,
        suggestions: [
          {
            label: 'Refresh Data',
            action: () => onSuggestAction('refresh'),
            icon: <RefreshCw size={16} />,
            variant: 'default' as const,
          },
        ],
        tips: [],
      };
    }

    // Search with no results
    if (
      filterContext.search &&
      !filterContext.search.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i)
    ) {
      return {
        title: `No results for "${filterContext.search}"`,
        description: `We searched through ${totalPlaques} plaques but couldn't find matches for your search term.`,
        icon: <Search className="w-16 h-16 text-gray-400" />,
        suggestions: [
          {
            label: 'Clear Search',
            action: () => onRemoveFilter('search'),
            icon: <Search size={16} />,
            variant: 'outline' as const,
          },
          {
            label: 'Try Broader Terms',
            action: () => onSuggestAction('searchSuggestions'),
            icon: <Lightbulb size={16} />,
            variant: 'outline' as const,
          },
        ],
        tips: [
          'Try searching for names, professions, or locations',
          "Use broader terms like 'writer' instead of 'novelist'",
          'Check spelling and try different variations',
        ],
      };
    }

    // Postcode-specific search
    if (
      filterContext.search &&
      filterContext.search.match(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i)
    ) {
      return {
        title: `No plaques found in ${filterContext.search}`,
        description:
          "This postcode area doesn't have any recorded plaques in our database.",
        icon: <MapPin className="w-16 h-16 text-gray-400" />,
        suggestions: [
          {
            label: 'Search Nearby Areas',
            action: () =>
              onSuggestAction('expandPostcode', {
                postcode: filterContext.search,
              }),
            icon: <Navigation size={16} />,
            variant: 'default' as const,
          },
          {
            label: 'Clear Location',
            action: () => onRemoveFilter('search'),
            icon: <MapPin size={16} />,
            variant: 'outline' as const,
          },
        ],
        tips: [
          'Try searching for nearby postcodes',
          'Use the map view to explore surrounding areas',
          'Consider broadening your location search',
        ],
      };
    }

    // Too many restrictive filters
    if (
      filterContext.colors.length +
        filterContext.postcodes.length +
        filterContext.professions.length +
        filterContext.organisations.length >
      3
    ) {
      return {
        title: 'Filters are too restrictive',
        description: `Your current combination of ${getActiveFilterCount()} filters is too specific. Try removing some filters to see more results.`,
        icon: <Filter className="w-16 h-16 text-gray-400" />,
        suggestions: [
          {
            label: 'Remove Half the Filters',
            action: () => onSuggestAction('simplifyFilters'),
            icon: <Filter size={16} />,
            variant: 'default' as const,
          },
          {
            label: 'Start Fresh',
            action: onClearAllFilters,
            icon: <RefreshCw size={16} />,
            variant: 'outline' as const,
          },
        ],
        tips: [
          'Try using fewer filter categories at once',
          'Start with one or two main criteria',
          'You can always add more filters later',
        ],
      };
    }

    // Distance filter with no results
    if (
      filterContext.distanceFilter?.enabled &&
      filterContext.distanceFilter.locationName
    ) {
      const currentRadius = filterContext.distanceFilter.radius;
      const expandedRadius = Math.min(currentRadius * 2, 10);

      return {
        title: `No plaques near ${filterContext.distanceFilter.locationName}`,
        description: `We couldn't find any plaques within ${currentRadius}km of your selected location.`,
        icon: <Navigation className="w-16 h-16 text-gray-400" />,
        suggestions: [
          {
            label: `Expand to ${expandedRadius}km`,
            action: () =>
              onSuggestAction('expandDistance', {
                radius: expandedRadius,
              }),
            icon: <MapPin size={16} />,
            variant: 'default' as const,
          },
          {
            label: 'Remove Location Filter',
            action: () => onRemoveFilter('distanceFilter'),
            icon: <Navigation size={16} />,
            variant: 'outline' as const,
          },
        ],
        tips: [
          "London's plaques are concentrated in certain areas",
          'Try expanding your search radius',
          'Use the map view to explore nearby clusters',
        ],
      };
    }

    // Personal filters (visited/favorites) with no results
    if (filterContext.onlyVisited || filterContext.onlyFavorites) {
      const filterType = filterContext.onlyVisited ? 'visited' : 'favorite';
      return {
        title: `No ${filterType} plaques yet`,
        description: `Start exploring plaques and mark them as ${filterType} to build your personal collection.`,
        icon: filterContext.onlyVisited ? (
          <Users className="w-16 h-16 text-gray-400" />
        ) : (
          <TrendingUp className="w-16 h-16 text-gray-400" />
        ),
        suggestions: [
          {
            label: `Remove ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Filter`,
            action: () =>
              onRemoveFilter(
                filterContext.onlyVisited ? 'onlyVisited' : 'onlyFavorites'
              ),
            icon: filterContext.onlyVisited ? (
              <Users size={16} />
            ) : (
              <TrendingUp size={16} />
            ),
            variant: 'default' as const,
          },
          {
            label: 'Explore All Plaques',
            action: onClearAllFilters,
            icon: <Map size={16} />,
            variant: 'outline' as const,
          },
        ],
        tips: [
          `Browse all plaques to find ones to mark as ${filterType}`,
          'Use the map to discover plaques near you',
          'Try different categories to find interesting plaques',
        ],
      };
    }

    // Generic filtered empty state
    return {
      title: 'No plaques match your filters',
      description: `Your current filters don't match any of the ${totalPlaques} available plaques.`,
      icon: <Filter className="w-16 h-16 text-gray-400" />,
      suggestions: [
        {
          label: 'Relax Filters',
          action: () => onSuggestAction('relaxFilters'),
          icon: <Filter size={16} />,
          variant: 'default' as const,
        },
        {
          label: 'Clear All Filters',
          action: onClearAllFilters,
          icon: <RefreshCw size={16} />,
          variant: 'outline' as const,
        },
      ],
      tips: [
        'Try removing some of your selected filters',
        'Use broader categories or fewer restrictions',
        'Check if your filter combination is too specific',
      ],
    };
  };

  const getActiveFilterCount = () => {
    return (
      filterContext.colors.length +
      filterContext.postcodes.length +
      filterContext.professions.length +
      filterContext.organisations.length +
      (filterContext.onlyVisited ? 1 : 0) +
      (filterContext.onlyFavorites ? 1 : 0) +
      (filterContext.distanceFilter?.enabled ? 1 : 0) +
      (filterContext.search ? 1 : 0)
    );
  };

  const content = getEmptyStateContent();

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center max-w-2xl mx-auto ${className}`}
    >
      {/* Icon */}
      <div className="mb-6">{content.icon}</div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-3">{content.title}</h3>

      {/* Description */}
      <p className="text-gray-600 mb-6 text-lg">{content.description}</p>

      {/* Action Buttons */}
      {content.suggestions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {content.suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant={suggestion.variant}
              onClick={suggestion.action}
              className="gap-2"
            >
              {suggestion.icon}
              {suggestion.label}
            </Button>
          ))}
        </div>
      )}

      {/* Tips */}
      {content.tips.length > 0 && (
        <Alert className="max-w-md text-left">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">💡 Tips:</div>
            <ul className="text-sm space-y-1">
              {content.tips.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Current Filters ({getActiveFilterCount()}):
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {filterContext.search && (
              <Badge variant="outline" className="text-xs">
                Search: "{filterContext.search}"
              </Badge>
            )}
            {filterContext.colors.map((color) => (
              <Badge key={color} variant="outline" className="text-xs">
                Color: {color}
              </Badge>
            ))}
            {filterContext.postcodes.map((postcode) => (
              <Badge key={postcode} variant="outline" className="text-xs">
                Area: {postcode}
              </Badge>
            ))}
            {filterContext.professions.map((profession) => (
              <Badge key={profession} variant="outline" className="text-xs">
                {profession.length > 15
                  ? profession.slice(0, 15) + '...'
                  : profession}
              </Badge>
            ))}
            {filterContext.organisations.map((org) => (
              <Badge key={org} variant="outline" className="text-xs">
                {org.length > 15 ? org.slice(0, 15) + '...' : org}
              </Badge>
            ))}
            {filterContext.onlyVisited && (
              <Badge variant="outline" className="text-xs">
                Visited Only
              </Badge>
            )}
            {filterContext.onlyFavorites && (
              <Badge variant="outline" className="text-xs">
                Favorites Only
              </Badge>
            )}
            {filterContext.distanceFilter?.enabled &&
              filterContext.distanceFilter.locationName && (
                <Badge variant="outline" className="text-xs">
                  Near {filterContext.distanceFilter.locationName}
                </Badge>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
