// src/components/plaques/RouteBuilder.tsx
import React from 'react';
import { Plaque } from '@/types/plaque';
import { ChevronUp, ChevronDown, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RouteBuilderProps = {
  routePoints: Plaque[];
  onRemovePoint: (plaque: Plaque) => void;
  onReorderPoints: (points: Plaque[]) => void;
  className?: string;
};

const RouteBuilder: React.FC<RouteBuilderProps> = ({
  routePoints,
  onRemovePoint,
  onReorderPoints,
  className = ''
}) => {
  // Move plaque point up in the route order
  const movePointUp = (index: number) => {
    if (index <= 0) return; // Already at the top
    
    const newPoints = [...routePoints];
    // Swap with previous item
    [newPoints[index-1], newPoints[index]] = [newPoints[index], newPoints[index-1]];
    
    onReorderPoints(newPoints);
  };
  
  // Move plaque point down in the route order
  const movePointDown = (index: number) => {
    if (index >= routePoints.length - 1) return; // Already at the bottom
    
    const newPoints = [...routePoints];
    // Swap with next item
    [newPoints[index], newPoints[index+1]] = [newPoints[index+1], newPoints[index]];
    
    onReorderPoints(newPoints);
  };

  // Handle plaque removal
  const handleRemovePoint = (plaque: Plaque) => {
    onRemovePoint(plaque);
  };

  return (
    <div className={className}>
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
                    onClick={() => movePointUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ChevronUp size={16} />
                  </Button>
                  
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
                  onClick={() => handleRemovePoint(plaque)}
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
  );
};

export default RouteBuilder;