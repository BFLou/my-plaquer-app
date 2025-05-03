// src/components/plaques/map/MapControlPanel.tsx
import React from 'react';
import { MapPin, Filter, Navigation } from 'lucide-react';
import { Button } from "@/components/ui/button";

type MapControlPanelProps = {
  onCenterMap: () => void;
  onToggleFilters: () => void;
  onFindMyLocation: () => void;
  filtersVisible: boolean;
  className?: string;
};

export const MapControlPanel: React.FC<MapControlPanelProps> = ({
  onCenterMap,
  onToggleFilters,
  onFindMyLocation,
  filtersVisible,
  className = ''
}) => {
  return (
    <div className={`absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-2 ${className}`}>
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCenterMap}
          className="h-8 w-8 p-0"
          title="Center map on London"
        >
          <MapPin size={16} />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleFilters}
          className={`h-8 w-8 p-0 ${filtersVisible ? 'bg-blue-50 text-blue-600' : ''}`}
          title="Toggle filter panel"
        >
          <Filter size={16} />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onFindMyLocation}
          className="h-8 w-8 p-0"
          title="Find my location"
        >
          <Navigation size={16} />
        </Button>
      </div>
    </div>
  );
};

// Add this line to fix the export error
export default MapControlPanel;