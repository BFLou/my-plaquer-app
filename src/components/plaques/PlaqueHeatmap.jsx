import React, { useEffect, useState } from 'react';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer';
import { Flame } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";

const PlaqueHeatmap = ({ 
  plaques = [],
  visible = false,
  onToggle,
  className = ""
}) => {
  const [intensity, setIntensity] = useState(30);
  const [radius, setRadius] = useState(20);
  const [isOpen, setIsOpen] = useState(false);
  
  // Convert plaques to heatmap points
  const points = plaques
    .filter(plaque => plaque.latitude && plaque.longitude)
    .map(plaque => {
      const lat = parseFloat(plaque.latitude);
      const lng = parseFloat(plaque.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return null;
      
      // Add intensity based on plaque properties
      let weight = 1;
      
      // Give more weight to visited plaques
      if (plaque.visited) {
        weight += 0.5;
      }
      
      // Give more weight to favorites
      if (plaque.isFavorite) {
        weight += 0.8;
      }
      
      return [lat, lng, weight];
    })
    .filter(Boolean);
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle(!visible);
    }
  };
  
  return (
    <div className={className}>
      {/* Control Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 w-8 p-0 ${visible ? 'bg-orange-50 text-orange-600' : ''}`}
            title="Heatmap options"
            onClick={handleToggle}
          >
            <Flame size={16} />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm">Heatmap Options</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium">Intensity</label>
                  <span className="text-xs text-gray-500">{intensity}</span>
                </div>
                <Slider
                  value={[intensity]} 
                  min={10}
                  max={50}
                  step={1}
                  onValueChange={(value) => setIntensity(value[0])}
                  disabled={!visible}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium">Radius</label>
                  <span className="text-xs text-gray-500">{radius}</span>
                </div>
                <Slider
                  value={[radius]} 
                  min={10}
                  max={40}
                  step={1}
                  onValueChange={(value) => setRadius(value[0])}
                  disabled={!visible}
                />
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-600 mb-1">Heat Map Colors</p>
              <div className="flex h-6 rounded-md overflow-hidden">
                <div className="flex-1 bg-green-500"></div>
                <div className="flex-1 bg-yellow-500"></div>
                <div className="flex-1 bg-orange-500"></div>
                <div className="flex-1 bg-red-500"></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Showing density of historical plaques</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* This would be used within your map component */}
      {visible && points.length > 0 && (
        <div className="heatmap-container">
          {/* Note: In a real implementation, you would use this component within your Leaflet map */}
          {/* For demonstration purposes only */}
          <div className="text-xs text-center mt-2">
            Heatmap active with {points.length} points
            <br />
            <span className="text-gray-500">Intensity: {intensity}, Radius: {radius}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaqueHeatmap;