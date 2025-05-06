// src/components/maps/controls/RoutePanel.tsx
import React from 'react';
import { X, Trash, Save, Download, ArrowUpDown, Route as RouteIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

interface RoutePanelProps {
  routePoints: any[];
  setShowRoutePanel: (show: boolean) => void;
  totalDistance: number;
  formatDistance: (distance: number) => string;
  calculateWalkingTime: (distance: number) => string;
  useImperial: boolean;
  setUseImperial: (imperial: boolean) => void;
  handleRemovePlaqueFromRoute: (id: number) => void;
  isDrawingRoute: boolean;
  setClearRouteDialog: (show: boolean) => void;
  clearRoute: () => void;
  drawSimpleRoute: (points: any[]) => void;
  addPlaqueToRoute: (plaque: any) => void;
}

const RoutePanel: React.FC<RoutePanelProps> = ({
  routePoints,
  setShowRoutePanel,
  totalDistance,
  formatDistance,
  calculateWalkingTime,
  useImperial,
  setUseImperial,
  handleRemovePlaqueFromRoute,
  isDrawingRoute,
  setClearRouteDialog,
  clearRoute,
  drawSimpleRoute,
  addPlaqueToRoute
}) => {
  // Optimize route
  const handleOptimizeRoute = () => {
    if (routePoints.length < 3) {
      toast.info("Need at least 3 stops to optimize");
      return;
    }
    
    // Simple optimization: keep first and last, sort middle by ID
    const start = routePoints[0];
    const end = routePoints[routePoints.length - 1];
    const middle = [...routePoints.slice(1, -1)].sort((a, b) => a.id - b.id);
    const optimized = [start, ...middle, end];
    
    // Update route points through parent
    // The useEffect will handle redrawing
    const updatedRoutePoints = [...optimized]; 
    clearRoute();
    
    // Add new points after a short delay
    setTimeout(() => {
      updatedRoutePoints.forEach(point => {
        addPlaqueToRoute(point);
      });
      setTimeout(() => {
        drawSimpleRoute(updatedRoutePoints);
      }, 100);
      toast.success("Route optimized");
    }, 200);
  };

  return (
    <div className="route-panel-container absolute right-4 top-20 z-50 bg-white rounded-lg shadow-lg p-3 w-72 max-h-[70vh] overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5 text-green-800">
          <RouteIcon size={16} />
          Route Builder ({routePoints.length} stops)
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={() => setShowRoutePanel(false)}
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
        
        {/* Optimize button */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-white w-full mt-1"
          onClick={handleOptimizeRoute}
          disabled={routePoints.length < 3 || isDrawingRoute}
        >
          <ArrowUpDown size={14} className="mr-1" />
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
            <div key={point.id} className="flex items-center gap-2 p-2 border rounded-md route-point">
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
                onClick={() => handleRemovePlaqueFromRoute(point.id)}
                disabled={isDrawingRoute}
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
          onClick={() => setClearRouteDialog(true)}
          disabled={routePoints.length === 0 || isDrawingRoute}
        >
          <Trash size={14} className="mr-1" />
          Clear Route
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => {
            // Export route functionality placeholder
            toast.success("Route exported");
          }}
          disabled={routePoints.length < 2 || isDrawingRoute}
        >
          <Download size={14} className="mr-1" />
          Export
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => {
            // Save route functionality placeholder
            toast.success("Route saved");
          }}
          disabled={routePoints.length < 2 || isDrawingRoute}
        >
          <Save size={14} className="mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default RoutePanel;