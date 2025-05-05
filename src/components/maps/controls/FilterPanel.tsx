import React from 'react';
import { X, CornerDownLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

type FilterPanelProps = {
  maxDistance: number;
  setMaxDistance: (distance: number) => void;
  filteredPlaquesCount: number;
  applyFilter: () => void;
  closeFilters: () => void;
  resetFilters: () => void;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  maxDistance, 
  setMaxDistance, 
  filteredPlaquesCount,
  applyFilter,
  closeFilters,
  resetFilters
}) => {
  return (
    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-10 w-64">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Distance Filter</h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={resetFilters}
            title="Reset filters"
          >
            <CornerDownLeft size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={closeFilters}
          >
            <X size={14} />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Range: {maxDistance} km</span>
          <Badge variant="outline" className="text-xs">
            {filteredPlaquesCount} plaques
          </Badge>
        </div>
        
        <Slider
          value={[maxDistance]}
          min={0.5}
          max={5}
          step={0.5}
          onValueChange={(values) => setMaxDistance(values[0])}
          className="w-full"
        />
        
        <Button 
          size="sm" 
          className="w-full"
          onClick={applyFilter}
        >
          Apply Filter
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;