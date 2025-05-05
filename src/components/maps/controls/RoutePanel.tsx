// src/components/maps/controls/RoutePanel.tsx
import React, { useState } from 'react';
import { Plaque } from '@/types/plaque';
import { X, Save, Download, ArrowUp, ArrowDown, Trash, Route, Info, MapPin, MoreHorizontal, Clock, Maximize } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateRouteDistance } from '../utils/routeUtils';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RoutePanelProps = {
  routePoints: Plaque[];
  onRemovePoint: (plaque: Plaque) => void;
  onReorderPoints: (points: Plaque[]) => void;
  onExportRoute: () => void;
  onSaveRoute: () => void;
  onClose: () => void;
};

const RoutePanel: React.FC<RoutePanelProps> = ({
  routePoints,
  onRemovePoint,
  onReorderPoints,
  onExportRoute,
  onSaveRoute,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<string>("stops");
  const [expanded, setExpanded] = useState<boolean>(false);
  
  // Estimate total distance of the route
  const totalDistance = calculateRouteDistance(routePoints);
  
  // Estimate walking time in minutes (assuming 5km/h walking speed)
  const walkingTime = Math.ceil(totalDistance * 12); // 12 minutes per km
  
  // Move plaque point up in the order
  const movePointUp = (index: number) => {
    if (index <= 0) return; // Already at the top
    
    const newPoints = [...routePoints];
    // Swap with previous item
    [newPoints[index-1], newPoints[index]] = [newPoints[index], newPoints[index-1]];
    
    onReorderPoints(newPoints);
  };
  
  // Move plaque point down in the order
  const movePointDown = (index: number) => {
    if (index >= routePoints.length - 1) return; // Already at the bottom
    
    const newPoints = [...routePoints];
    // Swap with next item
    [newPoints[index], newPoints[index+1]] = [newPoints[index+1], newPoints[index]];
    
    onReorderPoints(newPoints);
  };

  // Optimize route - simple version
  const optimizeRoute = () => {
    // In a real implementation, this would use a proper algorithm
    // For demo, just sort by ID which could simulate a spatial organization
    const newPoints = [...routePoints].sort((a, b) => a.id - b.id);
    onReorderPoints(newPoints);
  };

  return (
    <div 
      className={`absolute ${expanded ? 'inset-4' : 'top-16 right-4 bottom-16 w-80'} 
                  z-10 bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300`}
    >
      <div className="p-4 border-b bg-green-50">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium flex items-center gap-1.5 text-green-800">
            <Route size={16} />
            Route Builder
          </h3>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-green-700 hover:text-green-800 hover:bg-green-100"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "Collapse panel" : "Expand panel"}
            >
              <Maximize size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-green-700 hover:text-green-800 hover:bg-green-100"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </div>
        </div>
        
        {routePoints.length > 0 && (
          <div className="flex gap-3 mt-2 text-xs text-green-700">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{routePoints.length} stops</span>
            </div>
            <div className="flex items-center gap-1">
              <Route size={14} />
              <span>{totalDistance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>~{walkingTime} min</span>
            </div>
          </div>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="stops" className="flex-1">
            Stops
          </TabsTrigger>
          <TabsTrigger value="info" className="flex-1">
            Info
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="overflow-y-auto" style={{ maxHeight: expanded ? 'calc(100% - 180px)' : 'calc(100% - 160px)' }}>
        {activeTab === "stops" && (
          <div className="p-4">
            {routePoints.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-md text-center">
                <p className="text-gray-500">No plaques added to route yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Click on plaques on the map and select "Add to Route" to add them here
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-gray-600">
                    {routePoints.length} {routePoints.length === 1 ? 'stop' : 'stops'} in your route
                  </p>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs"
                          onClick={optimizeRoute}
                        >
                          Optimize
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rearrange stops for shortest route</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="space-y-2">
                  {routePoints.map((plaque, index) => (
                    <div 
                      key={plaque.id}
                      className="flex items-center gap-2 border p-2 rounded-md bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Badge 
                        variant="secondary" 
                        className="w-6 h-6 p-0 flex items-center justify-center shrink-0 bg-green-50 text-green-700 border-green-200"
                      >
                        {index + 1}
                      </Badge>
                      
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate">{plaque.title}</p>
                        <p className="text-xs text-gray-500 truncate">{plaque.location || plaque.address || 'No location'}</p>
                      </div>
                      
                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => movePointUp(index)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ArrowUp size={16} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => movePointDown(index)}
                          disabled={index === routePoints.length - 1}
                          title="Move down"
                        >
                          <ArrowDown size={16} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => onRemovePoint(plaque)}
                          title="Remove from route"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        {activeTab === "info" && (
          <div className="p-4">
            <h4 className="font-medium text-sm mb-3">Route Information</h4>
            
            {routePoints.length < 2 ? (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-500 text-sm">Add at least 2 stops to create a route</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="font-medium">{totalDistance.toFixed(1)} km</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Walking Time</p>
                      <p className="font-medium">~{walkingTime} min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Stops</p>
                      <p className="font-medium">{routePoints.length}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Route Details</h5>
                  <div className="text-xs space-y-1">
                    <p>• Start at: <span className="font-medium">{routePoints[0].title}</span></p>
                    {routePoints.length > 2 && (
                      <p>• Through: <span className="font-medium">{routePoints.length - 2} stops</span></p>
                    )}
                    <p>• End at: <span className="font-medium">{routePoints[routePoints.length - 1].title}</span></p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p className="mb-1"><Info size={14} className="inline-block mr-1" /> Tips:</p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>Drag points to reorder your route</li>
                    <li>Use "Optimize" to arrange by shortest path</li>
                    <li>Export your route to use in other apps</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2 mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                className="flex-1 gap-1"
                disabled={routePoints.length < 2}
              >
                <Save size={16} className="mr-1" />
                Save Route
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onSaveRoute}>
                <Save size={16} className="mr-2" />
                <span>Save Route</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportRoute}>
                <Download size={16} className="mr-2" />
                <span>Export GeoJSON</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default RoutePanel;