// src/components/discover/FilterSuggestions.tsx
import React, { useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Users,
  Clock,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Plaque {
  id: number;
  profession?: string;
  postcode?: string;
  color?: string;
  organisations?: string;
}

interface FilterSuggestionsProps {
  plaques: Plaque[];
  currentFilters: {
    search: string;
    colors: string[];
    postcodes: string[];
    professions: string[];
    organisations: string[];
    onlyVisited: boolean;
    onlyFavorites: boolean;
  };
  onApplySuggestion: (suggestion: any) => void;
  className?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: any;
  count: number;
  priority: number;
  category: 'popular' | 'related' | 'nearby' | 'trending';
}

export const FilterSuggestions: React.FC<FilterSuggestionsProps> = ({
  plaques,
  currentFilters,
  onApplySuggestion,
  className,
}) => {
  const suggestions = useMemo(() => {
    const allSuggestions: Suggestion[] = [];

    // Helper to safely parse organisations
    const parseOrganisations = (orgString: string): string[] => {
      if (!orgString || orgString === 'Unknown' || orgString === '[]')
        return [];
      try {
        const parsed = JSON.parse(orgString);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [orgString];
      } catch {
        return [orgString];
      }
    };

    // Calculate popular professions not currently selected
    const professionCounts: Record<string, number> = {};
    plaques.forEach((plaque) => {
      if (plaque.profession && plaque.profession !== 'Unknown') {
        professionCounts[plaque.profession] =
          (professionCounts[plaque.profession] || 0) + 1;
      }
    });

    const popularProfessions = Object.entries(professionCounts)
      .filter(
        ([profession]) => !currentFilters.professions.includes(profession)
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    popularProfessions.forEach(([profession, count], index) => {
      allSuggestions.push({
        id: `profession-${profession}`,
        title: `${profession}s`,
        description: `Explore ${count} plaques`,
        icon: <Users className="w-4 h-4" />,
        action: { type: 'add-profession', value: profession },
        count,
        priority: 100 - index * 10,
        category: 'popular',
      });
    });

    // Calculate popular postcodes/areas
    const postcodeCounts: Record<string, number> = {};
    plaques.forEach((plaque) => {
      if (plaque.postcode && plaque.postcode !== 'Unknown') {
        const area = plaque.postcode.split(' ')[0]; // Get area code (e.g., "SW1" from "SW1A 1AA")
        postcodeCounts[area] = (postcodeCounts[area] || 0) + 1;
      }
    });

    const popularAreas = Object.entries(postcodeCounts)
      .filter(
        ([area]) => !currentFilters.postcodes.some((p) => p.startsWith(area))
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    popularAreas.forEach(([area, count], index) => {
      allSuggestions.push({
        id: `area-${area}`,
        title: `${area} Area`,
        description: `${count} plaques in this area`,
        icon: <MapPin className="w-4 h-4" />,
        action: { type: 'add-postcode-area', value: area },
        count,
        priority: 80 - index * 10,
        category: 'popular',
      });
    });

    // Suggest related professions based on current selections
    if (currentFilters.professions.length > 0) {
      const relatedProfessions = new Set<string>();

      // Define profession relationships
      const professionRelations: Record<string, string[]> = {
        poet: ['novelist', 'writer', 'author', 'playwright'],
        novelist: ['poet', 'writer', 'author'],
        writer: ['poet', 'novelist', 'author', 'playwright'],
        artist: ['painter', 'sculptor'],
        painter: ['artist', 'sculptor'],
        composer: ['musician', 'conductor'],
        musician: ['composer', 'singer', 'conductor'],
        architect: ['civil engineer', 'engineer'],
        engineer: ['architect', 'civil engineer', 'inventor'],
        doctor: ['physician', 'surgeon'],
        physician: ['doctor', 'surgeon'],
      };

      currentFilters.professions.forEach((profession) => {
        const related = professionRelations[profession.toLowerCase()] || [];
        related.forEach((rel) => {
          if (
            !currentFilters.professions.includes(rel) &&
            professionCounts[rel] > 0
          ) {
            relatedProfessions.add(rel);
          }
        });
      });

      Array.from(relatedProfessions)
        .slice(0, 2)
        .forEach((profession, index) => {
          allSuggestions.push({
            id: `related-${profession}`,
            title: `Add ${profession}s`,
            description: `Related to your current selection`,
            icon: <Sparkles className="w-4 h-4" />,
            action: { type: 'add-profession', value: profession },
            count: professionCounts[profession] || 0,
            priority: 70 - index * 5,
            category: 'related',
          });
        });
    }

    // Suggest color combinations
    if (currentFilters.colors.length === 0) {
      const colorCounts: Record<string, number> = {};
      plaques.forEach((plaque) => {
        if (plaque.color && plaque.color !== 'Unknown') {
          colorCounts[plaque.color.toLowerCase()] =
            (colorCounts[plaque.color.toLowerCase()] || 0) + 1;
        }
      });

      const popularColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

      popularColors.forEach(([color, count], index) => {
        allSuggestions.push({
          id: `color-${color}`,
          title: `${color.charAt(0).toUpperCase() + color.slice(1)} Plaques`,
          description: `${count} ${color} plaques available`,
          icon: (
            <div
              className={`w-4 h-4 rounded-full ${
                color === 'blue'
                  ? 'bg-blue-500'
                  : color === 'green'
                    ? 'bg-green-500'
                    : color === 'brown'
                      ? 'bg-amber-700'
                      : color === 'red'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
              }`}
            />
          ),
          action: { type: 'add-color', value: color },
          count,
          priority: 60 - index * 5,
          category: 'trending',
        });
      });
    }

    // Suggest popular organisations
    if (currentFilters.organisations.length === 0) {
      const orgCounts: Record<string, number> = {};
      plaques.forEach((plaque) => {
        if (plaque.organisations) {
          const orgs = parseOrganisations(plaque.organisations);
          orgs.forEach((org) => {
            if (org.trim()) {
              orgCounts[org] = (orgCounts[org] || 0) + 1;
            }
          });
        }
      });

      const popularOrgs = Object.entries(orgCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

      popularOrgs.forEach(([org, count], index) => {
        allSuggestions.push({
          id: `org-${org}`,
          title: org,
          description: `${count} plaques from this organisation`,
          icon: <TrendingUp className="w-4 h-4" />,
          action: { type: 'add-organisation', value: org },
          count,
          priority: 50 - index * 5,
          category: 'trending',
        });
      });
    }

    // Sort by priority and return top suggestions
    return allSuggestions.sort((a, b) => b.priority - a.priority).slice(0, 6);
  }, [plaques, currentFilters]);

  if (suggestions.length === 0) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'popular':
        return <TrendingUp className="w-3 h-3" />;
      case 'related':
        return <Sparkles className="w-3 h-3" />;
      case 'nearby':
        return <MapPin className="w-3 h-3" />;
      case 'trending':
        return <Clock className="w-3 h-3" />;
      default:
        return <Filter className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'popular':
        return 'text-blue-600 bg-blue-50';
      case 'related':
        return 'text-purple-600 bg-purple-50';
      case 'nearby':
        return 'text-green-600 bg-green-50';
      case 'trending':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-sm">Suggested Filters</h3>
        </div>

        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              variant="ghost"
              size="sm"
              className="w-full justify-between h-auto p-2 hover:bg-gray-50"
              onClick={() => onApplySuggestion(suggestion.action)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {suggestion.icon}
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">
                    {suggestion.title}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0.5 ${getCategoryColor(suggestion.category)}`}
                >
                  {getCategoryIcon(suggestion.category)}
                </Badge>
                <span className="text-xs text-gray-400 min-w-[30px] text-right">
                  {suggestion.count}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
