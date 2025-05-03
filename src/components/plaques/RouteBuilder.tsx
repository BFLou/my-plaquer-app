import React, { useState, useEffect } from 'react';
import { Plaque } from '@/types/plaque';
import { MapPin, Route, Trash, Clock, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type RouteBuilderProps = {
  plaques: Plaque[];
  onDrawRoute: (plaquesToRoute: Plaque[]) => void;
  onClearRoute: () => void;
  className?: string;
};

export const RouteBuilder: React.FC<RouteBuilderProps> = ({
  plaques,
  onDrawRoute,
  onClearRoute,
  className = ''
}) => {
  const [selectedPlaques, setSelectedPlaques] = useState<Plaque[]>([]);
  const [routeName, setRouteName] = useState<string>('My Plaque Tour');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [showTips, setShowTips] = useState<boolean>(true);

  // Calculate estimated time when route changes
  useEffect(() => {
    if (selectedPlaques.length < 2) {
      setEstimatedTime('');
      return;
    }

    // Simple calculation: approx. 20 min per plaque + 10 min walking between each
    const plaquesTime = selectedPlaques.length * 20; // minutes per plaque
    const walkingTime = (selectedPlaques.length - 1) * 10; // minutes between plaques
    const totalMinutes = plaquesTime + walkingTime;
    
    // Format time
    if (totalMinutes < 60) {
      setEstimatedTime(`${totalMinutes} min`);
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      setEstimatedTime(`${hours} hr${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min` : ''}`);
    }
  }, [selectedPlaques]);

  // Add plaque to route
  const addToRoute = (plaque: Plaque) => {
    if (!selectedPlaques.some(p => p.id === plaque.id)) {
      setSelectedPlaques(prev => [...prev, plaque]);
    }
  };

  // Remove plaque from route
  const removeFromRoute = (plaqueId: number) => {
    setSelectedPlaques(prev => prev.filter(p => p.id !== plaqueId));
  };

  // Reorder plaques (move up)
  const movePlaqueUp = (index: number) => {
    if (index <= 0) return;
    
    const newOrder = [...selectedPlaques];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    
    setSelectedPlaques(newOrder);
  };

  // Reorder plaques (move down)
  const movePlaqueDown = (index: number) => {
    if (index >= selectedPlaques.length - 1) return;
    
    const newOrder = [...selectedPlaques];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    setSelectedPlaques(newOrder);
  };

  // Generate and draw the route
  const generateRoute = () => {
    onDrawRoute(selectedPlaques);
  };

  // Clear the route
  const clearRoute = () => {
    setSelectedPlaques([]);
    onClearRoute();
  };

  // Render available plaques
  const renderAvailablePlaques = () => {
    const availablePlaques = plaques.filter(
      plaque => !selectedPlaques.some(selected => selected.id === plaque.id)
    );

    if (availablePlaques.length === 0) {
      return <p className="text-gray-500 text-sm text-center py-4">All plaques added to route</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
        {availablePlaques.map(plaque => (
          <div 
            key={plaque.id} 
            className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => addToRoute(plaque)}
          >
            <div className="w-8 h-8 bg-gray-100 rounded-md shrink-0 flex items-center justify-center">
              <MapPin size={16} className="text-gray-600" />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{plaque.title}</p>
              <p className="text-xs text-gray-500 truncate">{plaque.location}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <Route size={18} className="text-blue-600" />
          Route Builder
        </h3>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowTips(!showTips)}
            className="h-8 w-8 p-0"
          >
            <Info size={16} />
          </Button>
        </div>
      </div>

      {/* Tips section */}
      {showTips && (
        <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm">
          <p className="text-blue-700">
            <span className="font-medium">Tips:</span> Add plaques from the map, 
            then reorder them for your ideal walking route. Click "Generate Route" when ready!
          </p>
        </div>
      )}

      {/* Route name input */}
      <div className="mb-4">
        <Input
          placeholder="Route Name"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          className="font-medium"
        />
      </div>

      {/* Selected plaques */}
      {selectedPlaques.length > 0 ? (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Your Route ({selectedPlaques.length} stops)</h4>
            {estimatedTime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock size={12} /> {estimatedTime}
              </Badge>
            )}
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {selectedPlaques.map((plaque, index) => (
              <div 
                key={plaque.id} 
                className="flex items-center gap-2 p-2 border rounded-md bg-white"
              >
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-medium text-sm truncate">{plaque.title}</p>
                  <p className="text-xs text-gray-500 truncate">{plaque.location}</p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => movePlaqueUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => movePlaqueDown(index)}
                    disabled={index === selectedPlaques.length - 1}
                  >
                    ↓
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-red-500"
                    onClick={() => removeFromRoute(plaque.id)}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md mb-4 text-center">
          <p className="text-gray-500">Add plaques from the map to create your route</p>
        </div>
      )}

      {/* Available plaques */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Available Plaques</h4>
        {renderAvailablePlaques()}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-end mt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={clearRoute}
          disabled={selectedPlaques.length === 0}
        >
          Clear
        </Button>
        <Button 
          size="sm"
          onClick={generateRoute}
          disabled={selectedPlaques.length < 2}
        >
          Generate Route
        </Button>
      </div>
    </Card>
  );
};

export default RouteBuilder;