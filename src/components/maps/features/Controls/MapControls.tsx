// src/components/maps/features/Controls/MapControls.tsx
import React from 'react';
import { Route, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MapControlsProps {
  routeMode: boolean;
  onToggleRoute: () => void;
  onResetView: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  routeMode,
  onToggleRoute,
  onResetView
}) => {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={routeMode ? 'default' : 'outline'}
              size="icon"
              onClick={onToggleRoute}
              className="shadow-lg"
            >
              <Route size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{routeMode ? 'Exit route planning' : 'Plan a route'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onResetView}
              className="shadow-lg"
            >
              <RotateCcw size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Reset view</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};