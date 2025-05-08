// src/components/maps/controls/RoutePanel.tsx
import React from 'react';
import { Plaque } from '@/types/plaque';
import { 
  X, 
  Trash, 
  Save, 
  Download, 
  Route
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface RoutePanelProps {
  routePoints: Plaque[];
  removePlaqueFromRoute: (id: number) => void;
  clearRoute: () => void;
  exportRoute: () => void;
  saveRoute: () => void;
  formatDistance: (distance: number) => string;
  calculateWalkingTime: (distance: number) => string;
  optimizeRoute: () => void;
  useImperial: boolean;
  setUseImperial: (value: boolean) => void;
  useRoadRouting: boolean;
  setUseRoadRouting: (value: boolean) => void;
  onClose: () => void;
}

/**
 * RoutePanel Component
 * Displays and manages route details, points, and actions
 */
const RoutePanel: React.FC<RoutePanelProps> = ({
  routePoints,
  removePlaqueFromRoute,
  clearRoute,
  exportRoute,
  saveRoute,
  formatDistance,
  calculateWalkingTime,
  optimizeRoute,
  useImperial,
  setUseImperial,
  useRoadRouting,
  setUseRoadRouting,
  onClose
}) => {
  // Calculate the total route distance
  const calculateTotalDistance = () => {
    if (routePoints.length < 2) return 0;
    
    let totalDistance = 0;
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const start = routePoints[i];
      const end = routePoints[i + 1];
      
      if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) continue;
      
      const startLat = parseFloat(start.latitude);
      const startLng = parseFloat(start.longitude);
      const endLat = parseFloat(end.latitude);
      const endLng = parseFloat(end.longitude);
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) continue;
      
      // Simplified Haversine formula for distance calculation
      const R = 6371; // Earth radius in km
      const dLat = (endLat - startLat) * Math.PI / 180;
      const dLon = (endLng - startLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    return totalDistance;
  };
  
  const totalDistance = calculateTotalDistance();
  
  return (
    <div className="absolute right-4 top-20 z-50 bg-white rounded-lg shadow-lg p-3 w-72 max-h-[70vh] overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5 text-green-800">
          <Route size={16} />
          Route Builder ({routePoints.length} stops)
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={onClose}
        >
          <X size={14} />
        </Button>
      </div>
      
      {/* Route stats with unit toggle */}
      <div className="bg-green-50 p-2 rounded-md mb-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-green-700">
            <div className="font-medium">Distance: {formatDistance(totalDistance)}</div>
            <div>Walking time: ~{calculateWalkingTime(totalDistance)}</div>
          </div>
          
          {/* Units toggle */}
          <div className="flex items-center gap-1 text-xs">
            <span className={!useImperial ? "font-medium" : ""}>km</span>
            <Switch 
              checked={useImperial}
              onCheckedChange={setUseImperial}
              size="sm"
            />
            <span className={useImperial ? "font-medium" : ""}>mi</span>
          </div>
        </div>
        
        {/* Route type toggle */}
        <div className="flex items-center justify-between mt-2 mb-1 text-xs text-green-700">
          <span>Route type:</span>
          <div className="flex items-center gap-1">
            <span className={!useRoadRouting ? "font-medium" : ""}>Direct</span>
            <Switch 
              checked={useRoadRouting}
              onCheckedChange={setUseRoadRouting}
              size="sm"
            />
            <span className={useRoadRouting ? "font-medium" : ""}>Road</span>
          </div>
        </div>
        
        {/* Optimize button */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-white w-full mt-1"
          onClick={optimizeRoute}
          disabled={routePoints.length < 3}
        >
          Optimize Route
        </Button>
      </div>
      
      {/* Route stops list */}
      <div className="space-y-2 my-3">
        {routePoints.length === 0 ? (
          <div className="text-center text-sm text-gray-500 p-4">
            Click on plaques to add them to your route
          </div>
        ) : (
          routePoints.map((point, index) => (
            <div key={point.id} className="flex items-center gap-2 p-2 border rounded-md">
              <Badge className={`h-6 w-6 flex-shrink-0 items-center justify-center p-0 ${
                index === 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : 
                index === routePoints.length - 1 ? "bg-red-100 text-red-800 hover:bg-red-200" :
                "bg-green-100 text-green-800 hover:bg-green-200"
              }`}>
                {index === 0 ? "S" : index === routePoints.length - 1 ? "E" : index + 1}
              </Badge>
              <div className="flex-grow truncate text-sm">{point.title}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" 
                onClick={() => removePlaqueFromRoute(point.id)}
              >
                <Trash size={14} />
              </Button>
            </div>
          ))
        )}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={clearRoute}
          disabled={routePoints.length === 0}
        >
          <Trash size={14} className="mr-1" />
          Clear
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={exportRoute}
          disabled={routePoints.length < 2}
        >
          <Download size={14} className="mr-1" />
          Export
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={saveRoute}
          disabled={routePoints.length < 2}
        >
          <Save size={14} className="mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default RoutePanel;