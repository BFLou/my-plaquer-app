// src/components/maps/controls/RoutePanel.tsx - Updated
import React from 'react';
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
  onReorder
}) => {
  return (
    <RouteBuilder
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
      className="route-planner"
    />
  );
};

export default RoutePanel;