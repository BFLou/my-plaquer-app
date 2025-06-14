// src/components/collections/CollectionStats.tsx
import { useState } from 'react';
import {
  CheckCircle,
  User,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { capitalizeWords } from '@/utils/stringUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// FIXED: Added proper TypeScript interfaces
interface Collection {
  id: string;
  name: string;
  description?: string;
  [key: string]: any; // Allow other properties
}

interface Plaque {
  id: string | number;
  profession?: string;
  color?: string;
  postcode?: string;
  area?: string;
  address?: string;
  visited?: boolean;
  [key: string]: any; // Allow other properties
}

interface UserVisit {
  plaque_id: string | number;
  [key: string]: any; // Allow other properties
}

interface StatItem {
  profession?: string;
  color?: string;
  location?: string;
  count: number;
}

interface CollectionStatsProps {
  collection: Collection;
  plaques: Plaque[];
  userVisits?: UserVisit[];
  className?: string;
}

export const CollectionStats: React.FC<CollectionStatsProps> = ({
  plaques,
  userVisits = [],
  className = '',
}) => {
  // Add state for expanded/collapsed sections
  const [isExpanded, setIsExpanded] = useState(true);

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate visit statistics
  const getVisitedStats = () => {
    if (!plaques.length) return { visitedCount: 0, visitedPercentage: 0 };

    // Count plaques with visited=true property
    const visitedByProperty = plaques.filter(
      (plaque: Plaque) => plaque.visited === true
    ).length;

    // Also count plaques that exist in userVisits array
    const visitedPlaqueIds = userVisits
      ? userVisits.map((visit: UserVisit) => visit.plaque_id)
      : [];
    const visitedInArray = plaques.filter((plaque: Plaque) =>
      visitedPlaqueIds.includes(plaque.id)
    ).length;

    // Use the greater of the two counts (should be the same in properly synced state)
    const visitedCount = Math.max(visitedByProperty, visitedInArray);

    const visitedPercentage = Math.round((visitedCount / plaques.length) * 100);

    return { visitedCount, visitedPercentage };
  };

  // Calculate profession statistics - FIXED: Proper typing for object accumulator
  const getProfessionStats = (): StatItem[] => {
    if (!plaques.length) return [];

    const professionCounts: Record<string, number> = {};

    plaques.forEach((plaque: Plaque) => {
      if (!plaque.profession) {
        professionCounts['Unknown'] = (professionCounts['Unknown'] || 0) + 1;
        return;
      }

      // Capitalize the profession before adding to counts
      const capitalizedProfession = capitalizeWords(plaque.profession);
      professionCounts[capitalizedProfession] =
        (professionCounts[capitalizedProfession] || 0) + 1;
    });

    return Object.entries(professionCounts)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  };

  // Calculate color statistics - FIXED: Proper typing for object accumulator
  const getColorStats = (): StatItem[] => {
    if (!plaques.length) return [];

    const colorCounts: Record<string, number> = {};

    plaques.forEach((plaque: Plaque) => {
      if (!plaque.color) {
        colorCounts['Unknown'] = (colorCounts['Unknown'] || 0) + 1;
        return;
      }

      // Capitalize the color before adding to counts
      const capitalizedColor = capitalizeWords(plaque.color);
      colorCounts[capitalizedColor] = (colorCounts[capitalizedColor] || 0) + 1;
    });

    return Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  };

  // Get location statistics - prioritize postcode if area is missing - FIXED: Proper typing
  const getLocationStats = (): StatItem[] => {
    if (!plaques.length) return [];

    const locationCounts: Record<string, number> = {};

    plaques.forEach((plaque: Plaque) => {
      // First try to get postcode (if it exists and isn't just a generic "Unknown")
      let location =
        plaque.postcode && plaque.postcode !== 'Unknown'
          ? plaque.postcode
          : null;

      // If no valid postcode, try area
      if (!location) {
        location =
          plaque.area && plaque.area !== 'Unknown' ? plaque.area : null;
      }

      // If no area either, try to extract postal district from address
      if (!location && plaque.address) {
        // Extract postal district (e.g., SW1, NW3) from address
        const postcodeMatch = plaque.address.match(
          /\b([A-Z]{1,2}[0-9][0-9A-Z]?)\b/i
        );
        if (postcodeMatch) {
          location = postcodeMatch[0].toUpperCase();
        }
      }

      // Use "Unknown" as fallback
      const finalLocation = location || 'Unknown';

      // Add to counts
      locationCounts[finalLocation] = (locationCounts[finalLocation] || 0) + 1;
    });

    return Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  };

  // Get stats
  const { visitedCount, visitedPercentage } = getVisitedStats();
  const professionStats = getProfessionStats();
  const colorStats = getColorStats();
  const locationStats = getLocationStats();

  return (
    <div
      className={`${className} bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all`}
    >
      {/* Header with collapse toggle */}
      <div
        className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={toggleExpanded}
      >
        <h3 className="font-medium text-lg flex items-center gap-2">
          <span>Collection Stats</span>
          {!isExpanded && plaques.length > 0 && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              {plaques.length} plaques
            </Badge>
          )}
        </h3>
        <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Button>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="p-4">
          {/* Main stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Plaques */}
            <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center">
              <div className="p-3 bg-blue-100 rounded-full mb-2">
                <MapPin className="text-blue-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {plaques.length}
              </div>
              <div className="text-blue-700 text-sm">Total Plaques</div>
            </div>

            {/* Visited */}
            <div className="bg-green-50 p-4 rounded-lg flex flex-col items-center">
              <div className="p-3 bg-green-100 rounded-full mb-2">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {visitedCount}
                <span className="text-sm font-normal text-green-500 ml-1">
                  ({visitedPercentage}%)
                </span>
              </div>
              <div className="text-green-700 text-sm">Visited</div>
            </div>

            {/* Most Common Profession - FIXED: Safe property access */}
            <div className="bg-purple-50 p-4 rounded-lg flex flex-col items-center">
              <div className="p-3 bg-purple-100 rounded-full mb-2">
                <User className="text-purple-600" size={24} />
              </div>
              <div className="text-lg font-bold text-purple-600 text-center truncate max-w-full">
                {professionStats.length > 0
                  ? professionStats[0].profession || 'Unknown'
                  : 'None'}
              </div>
              <div className="text-purple-700 text-sm">Top Profession</div>
            </div>

            {/* Most Common Color - FIXED: Safe property access */}
            <div className="bg-amber-50 p-4 rounded-lg flex flex-col items-center">
              <div className="p-3 bg-amber-100 rounded-full mb-2">
                <Star className="text-amber-600" size={24} />
              </div>
              <div className="text-lg font-bold text-amber-600 text-center truncate max-w-full">
                {colorStats.length > 0
                  ? colorStats[0].color || 'Unknown'
                  : 'None'}
              </div>
              <div className="text-amber-700 text-sm">Most Common Color</div>
            </div>
          </div>

          {/* Additional stats displayed by default */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Professions - FIXED: Safe count access */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <h4 className="font-medium mb-3">Top Professions</h4>
              {professionStats.length > 0 ? (
                <div className="space-y-2">
                  {professionStats.slice(0, 5).map((item, index) => (
                    <div
                      key={item.profession || index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="truncate">
                        {item.profession || 'Unknown'}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{
                              width: `${(item.count / plaques.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-gray-500 w-6 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No profession data available
                </p>
              )}
            </div>

            {/* Locations - FIXED: Safe count access */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <h4 className="font-medium mb-3">Locations</h4>
              {locationStats.length > 0 ? (
                <div className="space-y-2">
                  {locationStats.slice(0, 5).map((item, index) => (
                    <div
                      key={item.location || index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="truncate">
                        {item.location || 'Unknown'}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{
                              width: `${(item.count / plaques.length) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-gray-500 w-6 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No location data available
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionStats;
