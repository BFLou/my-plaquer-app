// src/components/maps/controls/RoutePanel.tsx - Enhanced with integrated controls
import React from 'react';
import { X, Route as RouteIcon, Badge } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Plaque } from '@/types/plaque';
import RouteBuilder from "../../plaques/RouteBuider";

interface RoutePanelProps {
  routePoints: Plaque[];
  removePlaqueFromRoute: (id: number) => void;
  clearRoute: () => void;
  exportRoute: () => void;
  formatDistance: (distance: number) => string;
  calculateWalkingTime: (distance: number) => string;
  useImperial: boolean;
  setUseImperial: (value: boolean) => void;
  onClose: () => void;
  onSaveRoute?: (routeData: any) => void;
  moveRoutePointUp?: (index: number) => void;
  moveRoutePointDown?: (index: number) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  // Additional props for integrated controls
  isRoutingMode?: boolean;
  routeDistance?: number;
  formatWalkingTime?: (distance: number) => string;
}

const RoutePanel: React.FC<RoutePanelProps> = ({
  routePoints,
  removePlaqueFromRoute,
  clearRoute,
  exportRoute,
  useImperial,
  setUseImperial,
  onClose,
  onSaveRoute,
  moveRoutePointUp,
  moveRoutePointDown,
  onReorder,
  isRoutingMode = true,
  routeDistance = 0,
  formatDistance,
  formatWalkingTime
}) => {
  // Calculate route distance if not provided
  const calculateRouteDistance = () => {
    if (!routePoints || routePoints.length < 2) return 0;
    
    let total = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const start = routePoints[i];
      const end = routePoints[i + 1];
      
      if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
      
      const startLat = parseFloat(start.latitude);
      const startLng = parseFloat(start.longitude);
      const endLat = parseFloat(end.latitude);
      const endLng = parseFloat(end.longitude);
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth radius in km
      const dLat = (endLat - startLat) * Math.PI / 180;
      const dLon = (endLng - startLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      total += R * c;
    }
    
    return total;
  };

  const actualDistance = routeDistance || calculateRouteDistance();

  return (
    <div className="route-planner">
      {/* Enhanced Header with Status */}
      <div className="route-planner-header">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-full">
              <RouteIcon size={16} className="text-white" />
            </div>
            <div>
              <h3 className="route-planner-title">Walking Route Planner</h3>
              <p className="text-xs text-green-600 font-medium">Active - Click plaques to add stops</p>
            </div>
          </div>
          {routePoints.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                {routePoints.length} {routePoints.length === 1 ? 'stop' : 'stops'}
              </div>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="route-panel-close ml-2"
          title="Exit Route Planning"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Route Statistics - Always visible when there are points */}
      {routePoints.length > 0 && (
        <div className="route-stats">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                Distance: {formatDistance ? formatDistance(actualDistance) : `${actualDistance.toFixed(1)} km`}
              </span>
              <span>
                Walking time: {formatWalkingTime ? formatWalkingTime(actualDistance) : `${Math.round(actualDistance * 12)} min`}
              </span>
            </div>
            <div className="text-xs opacity-75">
              Route optimized for walking
            </div>
          </div>
        </div>
      )}

      {/* Route Content */}
      <div className="route-planner-content">
        {routePoints.length === 0 ? (
          <div className="route-empty-state">
            <div className="route-empty-state-icon">🗺️</div>
            <div className="route-empty-state-text">
              <p className="font-medium mb-1">Start planning your route</p>
              <p>Click on any plaque marker on the map to add it as a stop on your walking route.</p>
            </div>
          </div>
        ) : (
          <RouteBuilder
            routePoints={routePoints}
            removePlaqueFromRoute={removePlaqueFromRoute}
            clearRoute={clearRoute}
            exportRoute={exportRoute}
            useImperial={useImperial}
            setUseImperial={setUseImperial}
            onClose={() => {}} // Don't close from inner component
            onMoveUp={moveRoutePointUp}
            onMoveDown={moveRoutePointDown}
            onReorder={onReorder}
            onSave={onSaveRoute}
            className="route-builder-embedded"
            showHeader={false} // Don't show duplicate header
            showStats={false} // Don't show duplicate stats
          />
        )}
      </div>

      {/* Action Buttons - Always show exit button */}
      <div className="route-actions">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Exit Route Planning
        </Button>
        
        {routePoints.length >= 2 && onSaveRoute && (
          <Button
            variant="default"
            onClick={() => onSaveRoute({
              name: `Walking Route - ${new Date().toLocaleDateString()}`,
              points: routePoints,
              distance: actualDistance,
              created: new Date().toISOString()
            })}
            className="flex-1"
          >
            Save Route
          </Button>
        )}
      </div>
    </div>
  );
};

export default RoutePanel;