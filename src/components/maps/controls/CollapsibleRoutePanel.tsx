// src/components/maps/controls/CollapsibleRoutePanel.tsx
import React, { useState } from 'react';
import { 
  Route as RouteIcon, 
  X, 
  Save, 
  Download, 
  GripVertical,
  Trash2,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings,
  User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plaque } from '@/types/plaque';
import { calculateDistance } from '../utils/routeUtils';
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/useAuth';
import { useRoutes } from '@/hooks/useRoutes';
import SaveRouteDialog, { SaveRouteData } from '../../routes/SaveRouteDialog';
import { toast } from 'sonner';

interface CollapsibleRoutePanelProps {
  routePoints: Plaque[];
  removePlaqueFromRoute: (id: number) => void;
  clearRoute: () => void;
  exportRoute: () => void;
  useImperial: boolean;
  setUseImperial: (value: boolean) => void;
  onClose: () => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  className?: string;
  formatDistance?: (distance: number) => string;
  formatWalkingTime?: (distance: number) => string;
}

const CollapsibleRoutePanel: React.FC<CollapsibleRoutePanelProps> = ({
  routePoints,
  removePlaqueFromRoute,
  clearRoute,
  exportRoute,
  useImperial,
  setUseImperial,
  onClose,
  onMoveUp,
  onMoveDown,
  onReorder,
  className = '',
  formatDistance,
  formatWalkingTime
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { user } = useAuth();
  const { createRoute } = useRoutes();
  
  // Calculate route statistics
  const totalDistance = React.useMemo(() => {
    if (routePoints.length < 2) return 0;
    
    let distance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const start = routePoints[i];
      const end = routePoints[i + 1];
      
      if (start.latitude && start.longitude && end.latitude && end.longitude) {
        const startLat = parseFloat(start.latitude as string);
        const startLng = parseFloat(start.longitude as string);
        const endLat = parseFloat(end.latitude as string);
        const endLng = parseFloat(end.longitude as string);
        
        if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
          distance += calculateDistance(startLat, startLng, endLat, endLng);
        }
      }
    }
    return distance;
  }, [routePoints]);
  
  const getFormattedDistance = () => {
    return formatDistance ? formatDistance(totalDistance) : `${totalDistance.toFixed(1)} km`;
  };
  
  const getFormattedTime = () => {
    return formatWalkingTime ? formatWalkingTime(totalDistance) : `${Math.round(totalDistance * 12)} min`;
  };

  // Handle save route - simplified to match Firebase rules
  const handleSaveRoute = async (data: SaveRouteData) => {
    if (!user) {
      toast.error("Please sign in to save routes");
      return;
    }
    
    if (routePoints.length < 2) {
      toast.error("A route must have at least 2 stops");
      return;
    }

    try {
      setIsSaving(true);
      
      await createRoute(
        data.name,
        data.description,
        routePoints,
        totalDistance,
        data.isPublic
      );
      
      toast.success("Route saved successfully!");
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleExportGPX = () => {
    if (routePoints.length < 2) {
      toast.error("Need at least 2 points to export");
      return;
    }
    
    const waypoints = routePoints.map((point, index) => `
    <wpt lat="${point.latitude}" lon="${point.longitude}">
      <name>${point.title || `Stop ${index + 1}`}</name>
      <desc>${point.description || point.inscription || ''}</desc>
    </wpt>`).join('');
    
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Plaquer App" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Walking Route</name>
    <desc>Route with ${routePoints.length} stops - ${getFormattedDistance()} - ${getFormattedTime()}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  ${waypoints}
</gpx>`;
    
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `route-${Date.now()}.gpx`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Route exported as GPX file");
  };
  
  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex && onReorder) {
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };
  
  const getStopLabel = (index: number, total: number) => {
    if (index === 0) return 'A';
    if (index === total - 1) return 'B';
    return String.fromCharCode(65 + index);
  };
  
  const getStopColor = (index: number, total: number) => {
    if (index === 0) return 'bg-green-500';
    if (index === total - 1) return 'bg-red-500';
    return 'bg-blue-500';
  };

  // Empty state
  if (routePoints.length === 0) {
    return (
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white shadow-lg z-[1000] transition-all duration-300 ease-in-out",
        "w-80 transform translate-x-0",
        className
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <RouteIcon size={20} className="text-green-600" />
              <h3 className="font-semibold text-gray-900">Route Planner</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          
          {/* Empty state content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <RouteIcon className="text-gray-400" size={24} />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Start Planning Your Route</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Click on any plaque marker on the map to add it as a stop on your walking route.
              </p>
              {!user && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <User size={14} />
                    <span>Sign in to save and share your routes</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white shadow-lg z-[1000] transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-80",
        className
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <RouteIcon size={20} className="text-green-600" />
                <h3 className="font-semibold text-gray-900">Route Planner</h3>
                <Badge variant="secondary" className="text-xs">
                  {routePoints.length}
                </Badge>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </Button>
              {!isCollapsed && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>
          
          {/* Collapsed state */}
          {isCollapsed && (
            <div className="flex-1 flex flex-col items-center p-2 space-y-3">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-600 mb-1">{routePoints.length}</div>
                <div className="text-xs text-gray-500">stops</div>
              </div>
              
              <div className="flex flex-col space-y-1">
                {routePoints.slice(0, 3).map((_, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      getStopColor(index, routePoints.length)
                    )}
                  >
                    {getStopLabel(index, routePoints.length)}
                  </div>
                ))}
                {routePoints.length > 3 && (
                  <div className="text-xs text-gray-400 text-center">+{routePoints.length - 3}</div>
                )}
              </div>
            </div>
          )}
          
          {/* Expanded content */}
          {!isCollapsed && (
            <>
              {/* Route Stats */}
              <div className="p-4 bg-green-50 border-b">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-green-600" />
                    <span className="font-medium">{getFormattedDistance()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-600" />
                    <span className="font-medium">{getFormattedTime()}</span>
                  </div>
                </div>
              </div>
              
              {/* Quick actions */}
              <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Settings size={12} />
                    Settings
                  </Button>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={handleExportGPX} className="h-7 px-2" title="Export GPX">
                      <Download size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearRoute} className="h-7 px-2 text-red-600" title="Clear Route">
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
                
                {/* Settings panel */}
                {showSettings && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="units" className="text-xs">
                        Units: {useImperial ? 'Miles' : 'Kilometers'}
                      </Label>
                      <Switch
                        id="units"
                        checked={useImperial}
                        onCheckedChange={setUseImperial}
                        size="sm"
                      />
                    </div>
                    
                    {!user && (
                      <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>Sign in to save routes</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Route Points - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {routePoints.map((point, index) => (
                    <div 
                      key={point.id} 
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-move group"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <GripVertical size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                        getStopColor(index, routePoints.length)
                      )}>
                        {getStopLabel(index, routePoints.length)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{point.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {point.location || point.address}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600"
                        onClick={() => removePlaqueFromRoute(point.id)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Save Action */}
              <div className="p-4 border-t">
                {user ? (
                  <Button 
                    size="sm" 
                    onClick={() => setShowSaveDialog(true)}
                    className="w-full"
                    disabled={routePoints.length < 2}
                  >
                    <Save size={14} className="mr-2" />
                    Save Route
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">Sign in to save your route</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {/* Handle sign in navigation */}}
                      className="w-full"
                    >
                      <User size={14} className="mr-2" />
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save Route Dialog */}
      <SaveRouteDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveRoute}
        routePoints={routePoints}
        routeDistance={totalDistance}
        useImperial={useImperial}
        isSaving={isSaving}
      />
    </>
  );
};

export default CollapsibleRoutePanel;