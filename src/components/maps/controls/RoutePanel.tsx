// src/components/maps/controls/RoutePanel.tsx - Updated to work with CollapsibleRoutePanel
import React from 'react';
import { X, Route as RouteIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plaque } from '@/types/plaque';
import CollapsibleRoutePanel from './CollapsibleRoutePanel';

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
  // Additional props for compatibility
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
  formatDistance,
  calculateWalkingTime,
  formatWalkingTime
}) => {
  // Use the new CollapsibleRoutePanel component
  return (
    <CollapsibleRoutePanel
      routePoints={routePoints}
      removePlaqueFromRoute={removePlaqueFromRoute}
      clearRoute={clearRoute}
      exportRoute={exportRoute}
      useImperial={useImperial}
      setUseImperial={setUseImperial}
      onClose={onClose}
      onMoveUp={moveRoutePointUp}
      onMoveDown={moveRoutePointDown}
      onReorder={onReorder}
      onSave={onSaveRoute}
      formatDistance={formatDistance}
      formatWalkingTime={formatWalkingTime || calculateWalkingTime}
    />
  );
};

export default RoutePanel;