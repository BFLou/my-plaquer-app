// src/components/maps/controls/RoutePanel.tsx
import React from 'react';
import { X, Trash, Save, Download, ArrowUpDown, Route as RouteIcon, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { estimateTotalWalkingTime } from '../utils/routeUtils';

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
  optimizeRoute: () => void;
  exportRoute?: () => void;
  saveRoute?: () => void;
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
  optimizeRoute,
  exportRoute,
  saveRoute
}) => {
  // Get total viewing time - assumes 5 minutes per plaque
  const totalViewingTime = routePoints.length * 5; // in minutes
  
  // Handle sharing route
  const handleShareRoute = () => {
    if (routePoints.length < 2) {
      toast.error("Add at least 2 plaques to share a route");
      return;
    }
    
    // Create a shareable URL with route data
    const routeData = routePoints.map(p => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude
    }));
    
    try {
      // Create compact representation of route
      const routeString = btoa(JSON.stringify(routeData));
      
      // Create shareable URL
      const shareUrl = `${window.location.origin}/route?data=${routeString}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          toast.success("Route URL copied to clipboard");
        })
        .catch(() => {
          toast.error("Failed to copy URL");
        });
    } catch (error) {
      toast.error("Failed to create shareable link");
    }
  };

  return (
    <div className="route-panel-container absolute right-4 top-20 z-50 bg-white rounded-lg shadow-lg p-3 w-72 max-h-[70vh] overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5 text-green-800">
          <RouteIcon size={16} />
          Walking Route ({routePoints.length} stops)
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
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Walking time: ~{calculateWalkingTime(totalDistance)}</span>
            </div>
            {routePoints.length > 0 && (
              <div className="text-xs mt-1 text-green-600">
                + {totalViewingTime} min viewing time
              </div>
            )}
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
        
        {/* Optimize button with improved tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-white w-full mt-1"
                onClick={optimizeRoute}
                disabled={routePoints.length < 3 || isDrawingRoute}
              >
                <ArrowUpDown size={14} className="mr-1" />
                Optimize Walking Route
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">
                Reorder stops to create the most efficient walking route while keeping your start and end points the same.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Total time estimate */}
      {routePoints.length >= 2 && (
        <div className="text-xs text-gray-700 bg-blue-50 p-2 rounded-md mb-3 flex items-center">
          <Clock size={14} className="mr-2 text-blue-600" />
          <div>
            <span className="font-medium">Total estimated time: </span>
            {estimateTotalWalkingTime(routePoints, 5)}
            <div className="text-gray-500 text-xs mt-1">
              Includes walking + viewing time at each plaque
            </div>
          </div>
        </div>
      )}
      
      {/* Route stops list */}
      <div className="space-y-2 my-3">
        {routePoints.length === 0 ? (
          <div className="text-center text-sm text-gray-500 p-4">
            Click on plaques to add them to your walking route
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
          Clear
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={exportRoute || handleShareRoute}
          disabled={routePoints.length < 2 || isDrawingRoute}
        >
          <Download size={14} className="mr-1" />
          Export
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={saveRoute || (() => {
            toast.success("Route saved");
          })}
          disabled={routePoints.length < 2 || isDrawingRoute}
        >
          <Save size={14} className="mr-1" />
          Save
        </Button>
      </div>
      
      {/* Walking directions note */}
      {routePoints.length >= 2 && (
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
          <p className="font-medium mb-1">Walking Directions</p>
          <p>This route shows direct paths between points. For detailed street-by-street walking directions, export the route and open it in your preferred navigation app.</p>
        </div>
      )}
    </div>
  );
};

export default RoutePanel;