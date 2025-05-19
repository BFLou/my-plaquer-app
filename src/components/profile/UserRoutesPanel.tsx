// src/components/profile/UserRoutesPanel.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, ChevronRight, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RoutePoint {
  plaque_id: number;
  order: number;
}

interface RouteData {
  id: string;
  name: string;
  description?: string;
  points: RoutePoint[];
  total_distance: number;
  created_at: any;
  updated_at: any;
  user_id: string;
}

interface UserRoutesPanelProps {
  routes: RouteData[];
  showAll?: () => void;
}

const UserRoutesPanel: React.FC<UserRoutesPanelProps> = ({
  routes,
  showAll
}) => {
  const navigate = useNavigate();

  // Format distance nicely
  const formatDistance = (distance: number, useImperial: boolean = false) => {
    if (useImperial) {
      const miles = distance * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${distance.toFixed(1)} km`;
  };

  return (
    <div className="bg-white shadow-sm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Route className="text-green-500" size={18} />
          Saved Routes
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/discover?view=map')}
          className="gap-1"
        >
          <Plus size={14} />
          Create
        </Button>
      </div>
      
      {routes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Route className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-600">No routes yet</h4>
          <p className="text-gray-500 mb-4">Create walking routes from the map</p>
          <Button 
            onClick={() => navigate('/discover?view=map')}
            size="sm"
          >
            Open Map
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map(route => (
            <div 
              key={route.id}
              className="border rounded-lg p-3 hover:border-green-300 hover:bg-green-50/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/routes/${route.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-500 w-10 h-10 flex items-center justify-center rounded-lg">
                  <Route size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{route.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {route.points.length} stops
                    </span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-1.5">
                      {formatDistance(route.total_distance)}
                    </Badge>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          ))}
          
          {showAll && routes.length > 0 && (
            <Button
              variant="ghost"
              className="w-full justify-center text-sm text-gray-600 hover:text-green-600"
              onClick={showAll}
            >
              View All Routes
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRoutesPanel;