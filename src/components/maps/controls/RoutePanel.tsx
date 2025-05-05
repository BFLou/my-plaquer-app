import React from 'react';
import { Plaque } from '@/types/plaque';
import { X, Save, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import RouteBuilder from './RouteBuilder';

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
        <RouteBuilder 
          routePoints={routePoints}
          onRemovePoint={onRemovePoint}
          onReorderPoints={onReorderPoints}
        />
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