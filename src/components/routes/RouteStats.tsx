// src/components/routes/RouteStats.tsx
import React from 'react';
import { 
  MapPin, 
  Clock, 
  Route as RouteIcon, 
  TrendingUp,
  Target
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { RouteData } from '@/hooks/useRoutes';
import { Plaque } from '@/types/plaque';

interface RouteStatsProps {
  route: RouteData;
  plaques: Plaque[];
  className?: string;
}

export const RouteStats: React.FC<RouteStatsProps> = ({
  route,
  plaques,
  className = ''
}) => {
  // Calculate route statistics
  const totalDistance = route.total_distance;
  const totalWaypoints = route.points.length;
  const estimatedTime = Math.ceil(totalDistance * 12); // 12 minutes per km
  const estimatedCalories = Math.round(totalDistance * 50); // Rough estimate
  
  // Calculate difficulty based on distance and waypoints
  const getDifficulty = () => {
    if (totalDistance < 2 && totalWaypoints < 5) return { level: 'Easy', color: 'bg-green-100 text-green-800' };
    if (totalDistance < 5 && totalWaypoints < 10) return { level: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Challenging', color: 'bg-red-100 text-red-800' };
  };
  
  const difficulty = getDifficulty();
  
  // Get area coverage
  const areas = [...new Set(plaques.map(p => p.area).filter(Boolean))];
  const postcodes = [...new Set(plaques.map(p => p.postcode).filter(Boolean))];
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" size={20} />
          Route Statistics
        </h3>
        
        {/* Main Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <RouteIcon className="text-green-600 mx-auto mb-2" size={20} />
            <div className="text-lg sm:text-2xl font-bold text-green-700">{totalDistance.toFixed(1)}</div>
            <div className="text-xs sm:text-sm text-green-600">Kilometers</div>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <Clock className="text-blue-600 mx-auto mb-2" size={20} />
            <div className="text-lg sm:text-2xl font-bold text-blue-700">{estimatedTime}</div>
            <div className="text-xs sm:text-sm text-blue-600">Minutes</div>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
            <MapPin className="text-purple-600 mx-auto mb-2" size={20} />
            <div className="text-lg sm:text-2xl font-bold text-purple-700">{totalWaypoints}</div>
            <div className="text-xs sm:text-sm text-purple-600">Waypoints</div>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
            <Target className="text-orange-600 mx-auto mb-2" size={20} />
            <div className="text-lg sm:text-2xl font-bold text-orange-700">{estimatedCalories}</div>
            <div className="text-xs sm:text-sm text-orange-600">Calories</div>
          </div>
        </div>
        
        {/* Detailed Stats - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Route Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Route Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Difficulty:</span>
                <Badge className={difficulty.color}>{difficulty.level}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Areas Covered:</span>
                <span className="text-sm font-medium">{areas.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Postcodes:</span>
                <span className="text-sm font-medium">{postcodes.length}</span>
              </div>
            </div>
          </div>
          
          {/* Engagement Stats */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Engagement</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Visibility:</span>
                <Badge variant={route.is_public ? "default" : "secondary"}>
                  {route.is_public ? 'Public' : 'Private'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm font-medium">
                  {new Date(route.created_at?.toDate ? route.created_at.toDate() : route.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick Info */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <h4 className="font-medium text-gray-900">Quick Info</h4>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Average stop distance: <span className="font-medium">
                  {totalWaypoints > 1 ? (totalDistance / (totalWaypoints - 1)).toFixed(2) : '0'} km
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Pace: <span className="font-medium">12 min/km</span>
              </div>
              <div className="text-sm text-gray-600">
                Best for: <span className="font-medium">
                  {estimatedTime < 60 ? 'Quick walk' : estimatedTime < 120 ? 'Leisurely stroll' : 'Half-day adventure'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Areas and Postcodes - Mobile Optimized */}
        {(areas.length > 0 || postcodes.length > 0) && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {areas.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Areas Covered</h4>
                  <div className="flex flex-wrap gap-1">
                    {areas.slice(0, 6).map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                    {areas.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{areas.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {postcodes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Postcodes</h4>
                  <div className="flex flex-wrap gap-1">
                    {postcodes.slice(0, 8).map((postcode, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {postcode}
                      </Badge>
                    ))}
                    {postcodes.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{postcodes.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteStats;