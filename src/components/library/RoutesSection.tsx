// src/components/library/RoutesSection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Route as RouteIcon, 
  Plus, 
  ArrowRight, 
  MapPin,
  Clock,
  Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from '@/utils/timeUtils';

interface RoutesSectionProps {
  routes: any[];
  onViewAll: () => void;
  onCreateNew: () => void;
}

const RoutesSection: React.FC<RoutesSectionProps> = ({
  routes,
  onViewAll,
  onCreateNew
}) => {
  const navigate = useNavigate();

  // Get recent routes (up to 4)
  const recentRoutes = [...routes]
    .sort((a, b) => {
      const dateA = a.updated_at?.toDate ? a.updated_at.toDate() : new Date(a.updated_at);
      const dateB = b.updated_at?.toDate ? b.updated_at.toDate() : new Date(b.updated_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 4);

  const handleRouteClick = (routeId: string) => {
    navigate(`/library/routes/${routeId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <RouteIcon className="text-green-500" size={24} />
          <div>
            <h2 className="text-xl font-bold">Routes</h2>
            <p className="text-sm text-gray-500">
              {routes.length} route{routes.length !== 1 ? 's' : ''} planned • {routes.reduce((sum, r) => sum + r.total_distance, 0).toFixed(1)} km total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCreateNew}
            className="gap-1"
          >
            <Plus size={16} />
            Plan Route
          </Button>
          {routes.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewAll}
              className="gap-1"
            >
              View All
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <RouteIcon className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Routes Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create walking routes to explore multiple plaques in one trip
          </p>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus size={16} />
            Plan Your First Route
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRoutes.map(route => (
            <div 
              key={route.id}
              className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-all group bg-gradient-to-r from-green-50 to-white"
              onClick={() => handleRouteClick(route.id)}
            >
              <div className="flex items-start gap-3">
                <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RouteIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors mb-1 truncate">
                    {route.name}
                  </h3>
                  {route.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {route.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>{route.points.length} stops</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RouteIcon size={12} />
                      <span>{route.total_distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>~{Math.ceil(route.total_distance * 12)} min</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {route.is_public && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Public
                        </Badge>
                      )}
                      {route.views && route.views > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs flex items-center gap-1">
                          <Eye size={10} />
                          {route.views}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(route.updated_at || route.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {routes.length > 4 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={onViewAll} className="gap-2">
            View All {routes.length} Routes
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoutesSection;