// src/components/maps/controls/RoutePanel.tsx
import React from 'react';
import { Plaque } from '@/types/plaque';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import RouteBuilder from "../../plaques/RouteBuider";

interface RoutePanelProps {
  routePoints: Plaque[];
  removePlaqueFromRoute: (id: number) => void;
  clearRoute: () => void;
  exportRoute: () => void;
  formatDistance: (distance: number) => string;
  calculateWalkingTime: (distance: number) => string;
  optimizeRoute: () => void;
  useImperial: boolean;
  setUseImperial: (value: boolean) => void;
  useRoadRouting: boolean;
  setUseRoadRouting: (value: boolean) => void;
  onClose: () => void;
  onSaveRoute?: (routeData: any) => void;
  moveRoutePointUp?: (index: number) => void;
  moveRoutePointDown?: (index: number) => void;
}

/**
 * RoutePanel Component
 * Wrapper around RouteBuilder for use in the map
 */
const RoutePanel: React.FC<RoutePanelProps> = ({
  routePoints,
  removePlaqueFromRoute,
  clearRoute,
  exportRoute,
  formatDistance,
  calculateWalkingTime,
  optimizeRoute,
  useImperial,
  setUseImperial,
  useRoadRouting,
  setUseRoadRouting,
  onClose,
  onSaveRoute,
  moveRoutePointUp,
  moveRoutePointDown
}) => {
  return (
    <div className="absolute right-4 top-20 z-50">
      <RouteBuilder
        routePoints={routePoints}
        removePlaqueFromRoute={removePlaqueFromRoute}
        clearRoute={clearRoute}
        exportRoute={exportRoute}
        useImperial={useImperial}
        setUseImperial={setUseImperial}
        useRoadRouting={useRoadRouting}
        setUseRoadRouting={setUseRoadRouting}
        onClose={onClose}
        onMoveUp={moveRoutePointUp}
        onMoveDown={moveRoutePointDown}
        onOptimize={optimizeRoute}
        onSave={onSaveRoute}
      />
    </div>
  );
};

export default RoutePanel;