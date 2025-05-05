import React from 'react';
import { Plaque } from '@/types/plaque';
import { X, Save, Download, ChevronUp, ChevronDown, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="absolute top-16 right-4 bottom-16 z-10 w-80 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Route Builder</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X size={14} />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Click on plaques and use "Add to Route" to build your route
        </p>
      </div>
      
      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 180px)' }}>
        <h4 className="font-medium mb-3">Route Points</h4>
        
        {routePoints.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-md text-center">
            <p className="text-gray-500">No plaques added to route yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Click on plaques on the map and select "Add to Route" to add them here
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {routePoints.length} {routePoints.length === 1 ? 'stop' : 'stops'} in your route
            </p>
            
            <div className="space-y-2">
              {routePoints.map((plaque, index) => (
                <div 
                  key={plaque.id}
                  className="flex items-center gap-2 border p-2 rounded-md bg-white"
                >
                  <Badge 
                    variant="secondary" 
                    className="w-6 h-6 p-0 flex items-center justify-center shrink-0"
                  >
                    {index + 1}
                  </Badge>
                  
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-sm truncate">{plaque.title}</p>
                    <p className="text-xs text-gray-500 truncate">{plaque.location || plaque.address || 'No location'}</p>
                  </div>
                  
                  <div className="flex flex-col shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => movePointDown(index)}
                      disabled={index === routePoints.length - 1}
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onRemovePoint(plaque)}
                    title="Remove from route"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2 mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onClose}
            disabled={routePoints.length === 0}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onExportRoute}
            disabled={routePoints.length < 2}
          >
            <Download size={16} className="mr-1" />
            Export
          </Button>
        </div>
        <Button 
          variant="default" 
          size="sm"
          className="w-full flex items-center justify-center gap-1"
          onClick={onSaveRoute}
          disabled={routePoints.length < 2}
        >
          <Save size={16} />
          Save Route
        </Button>
      </div>
    </div>
  );
};

export default RoutePanel;