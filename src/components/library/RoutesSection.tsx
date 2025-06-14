// src/components/library/RoutesSection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route as RouteIcon,
  Plus,
  ArrowRight,
  MapPin,
  Clock,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '@/utils/timeUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RoutesSectionProps {
  routes: any[];
  onViewAll: () => void;
  onCreateNew: () => void;
}

const RoutesSection: React.FC<RoutesSectionProps> = ({
  routes,
  onViewAll,
  onCreateNew,
}) => {
  const navigate = useNavigate();

  // Get recent routes (up to 4)
  const recentRoutes = [...routes]
    .sort((a, b) => {
      const dateA = a.updated_at?.toDate
        ? a.updated_at.toDate()
        : new Date(a.updated_at);
      const dateB = b.updated_at?.toDate
        ? b.updated_at.toDate()
        : new Date(b.updated_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 4);

  const handleRouteClick = (routeId: string) => {
    navigate(`/library/routes/${routeId}`);
  };

  // Calculate total distance for summary
  const totalDistance = routes.reduce(
    (sum, route) => sum + (route.total_distance || 0),
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <RouteIcon className="text-green-500 flex-shrink-0" size={20} />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold">Routes</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {routes.length} route{routes.length !== 1 ? 's' : ''} planned
              {totalDistance > 0 && (
                <span className="hidden sm:inline">
                  {' '}
                  • {totalDistance.toFixed(1)} km total
                </span>
              )}
            </p>
            {/* Mobile: Show total distance on separate line */}
            {totalDistance > 0 && (
              <p className="text-xs text-gray-400 sm:hidden">
                {totalDistance.toFixed(1)} km total distance
              </p>
            )}
          </div>
        </div>

        {/* Action buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNew}
            className="gap-1 h-8 sm:h-10 text-xs sm:text-sm min-w-[80px] sm:min-w-0"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Plan Route</span>
            <span className="xs:hidden">Plan</span>
          </Button>

          {routes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAll}
              className="gap-1 h-8 sm:h-10 text-xs sm:text-sm min-w-[70px] sm:min-w-0"
            >
              <span className="hidden xs:inline">View All</span>
              <span className="xs:hidden">All</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
          <RouteIcon className="mx-auto text-gray-300 mb-3" size={40} />
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">
            No Routes Yet
          </h3>
          <p className="text-sm text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto px-4">
            Create walking routes to explore multiple plaques in one trip
          </p>
          <Button onClick={onCreateNew} className="gap-2 h-10 sm:h-12">
            <Plus size={16} />
            Plan Your First Route
          </Button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Routes Grid - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {recentRoutes.map((route) => (
              <div
                key={route.id}
                className="border rounded-lg p-3 sm:p-4 hover:shadow-md cursor-pointer transition-all group bg-gradient-to-r from-green-50 to-white"
                onClick={() => handleRouteClick(route.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-600 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RouteIcon size={16} className="sm:w-5 sm:h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors line-clamp-2 text-sm sm:text-base flex-1">
                        {route.name}
                      </h3>

                      {/* Mobile menu - only show on small screens */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity sm:hidden flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRouteClick(route.id);
                            }}
                          >
                            <Eye size={14} className="mr-2" />
                            View Route
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {route.description && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                        {route.description}
                      </p>
                    )}

                    {/* Route stats - Mobile Optimized */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{route.points?.length || 0} stops</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RouteIcon size={12} />
                        <span>{(route.total_distance || 0).toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>
                          ~{Math.ceil((route.total_distance || 0) * 12)} min
                        </span>
                      </div>
                    </div>

                    {/* Footer - Mobile Optimized */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {route.is_public && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 text-xs"
                          >
                            Public
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 truncate max-w-[100px] sm:max-w-none">
                        {formatTimeAgo(route.updated_at || route.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button - Mobile Optimized */}
          {routes.length > 4 && (
            <div className="pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={onViewAll}
                className="w-full gap-2 h-10 sm:h-12 text-sm sm:text-base"
              >
                View All {routes.length} Routes
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoutesSection;
