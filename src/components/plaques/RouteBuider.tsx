// src/components/plaques/RouteBuider.tsx - Mobile-friendly with reordering
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
  MoreVertical
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoutes } from '@/hooks/useRoutes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plaque } from '@/types/plaque';
import SaveRouteDialog from '../routes/SaveRouteDialog';
import { calculateDistance } from '../maps/utils/routeUtils';

interface RouteBuilderProps {
  routePoints: Plaque[];
  removePlaqueFromRoute: (id: number) => void;
  clearRoute: () => void;
  exportRoute: () => void;
  useImperial: boolean;
  setUseImperial: (value: boolean) => void;
  onClose: () => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onSave?: (routeData: any) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  className?: string;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({
  routePoints,
  removePlaqueFromRoute,
  clearRoute,
  exportRoute,
  useImperial,
  setUseImperial,
  onClose,
  onMoveUp,
  onMoveDown,
  onSave,
  onReorder,
  className = ''
}) => {
  const { user } = useAuth();
  const { createRoute } = useRoutes();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
  
  const formatDistance = (km: number) => {
    if (useImperial) {
      const miles = km * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${km.toFixed(1)} km`;
  };
  
  const formatWalkingTime = (km: number) => {
    const minutes = useImperial 
      ? Math.round(km * 0.621371 * 20)
      : Math.round(km * 12);
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };
  
  const handleSaveRoute = async (data: { name: string; description: string }) => {
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
      
      const savedRoute = await createRoute(
        data.name,
        routePoints,
        totalDistance,
        data.description,
        false
      );
      
      if (savedRoute) {
        toast.success("Route saved successfully!");
        setShowSaveDialog(false);
      }
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
    
    const gpxContent = `<?xml version="1.0"?>
<gpx version="1.1" creator="Plaquer App">
  <metadata>
    <name>Walking Route</name>
    <desc>Route with ${routePoints.length} stops - ${formatDistance(totalDistance)} - ${formatWalkingTime(totalDistance)}</desc>
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
    return String.fromCharCode(65 + index); // A, B, C, etc.
  };
  
  const getStopColor = (index: number, total: number) => {
    if (index === 0) return 'bg-green-500';
    if (index === total - 1) return 'bg-red-500';
    return 'bg-blue-500';
  };
  
  if (routePoints.length === 0) {
    return (
      <div className={`fixed left-4 top-20 bg-white rounded-lg shadow-lg p-4 w-80 sm:w-96 z-40 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <RouteIcon size={16} className="text-green-600" />
            Route Planner
          </h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        
        <div className="text-center py-8">
          <RouteIcon className="mx-auto text-gray-300 mb-3" size={32} />
          <p className="text-sm text-gray-500">Click on plaques to build your route</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className={`fixed left-4 top-20 bg-white rounded-lg shadow-lg w-80 sm:w-96 z-40 max-h-[calc(100vh-120px)] flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <RouteIcon size={16} className="text-green-600" />
            <h3 className="text-sm font-medium">Route Planner</h3>
            <Badge variant="secondary" className="text-xs">
              {routePoints.length} stops
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? '▼' : '▲'}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>
        
        {!isCollapsed && (
          <>
            {/* Route Stats */}
            <div className="p-4 bg-green-50 border-b">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-green-600" />
                  <span className="font-medium">{formatDistance(totalDistance)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-green-600" />
                  <span className="font-medium">{formatWalkingTime(totalDistance)}</span>
                </div>
              </div>
            </div>
            
            {/* Settings */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <Label htmlFor="units" className="text-sm">Units: {useImperial ? 'Miles' : 'Kilometers'}</Label>
                <Switch
                  id="units"
                  checked={useImperial}
                  onCheckedChange={setUseImperial}
                  size="sm"
                />
              </div>
            </div>
            
            {/* Route Points - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {routePoints.map((point, index) => (
                  <div 
                    key={point.id} 
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <GripVertical size={16} className="text-gray-400 touch-manipulation" />
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${getStopColor(index, routePoints.length)}`}>
                      {getStopLabel(index, routePoints.length)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{point.title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {point.location || point.address}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onMoveUp && index > 0 && (
                          <DropdownMenuItem onClick={() => onMoveUp(index)}>
                            Move Up
                          </DropdownMenuItem>
                        )}
                        {onMoveDown && index < routePoints.length - 1 && (
                          <DropdownMenuItem onClick={() => onMoveDown(index)}>
                            Move Down
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => removePlaqueFromRoute(point.id)}
                          className="text-red-600"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 border-t space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleExportGPX} className="text-xs">
                  <Download size={12} className="mr-1" />
                  Export
                </Button>
                
                <Button variant="outline" size="sm" onClick={clearRoute} className="text-xs">
                  <Trash2 size={12} className="mr-1" />
                  Clear
                </Button>
              </div>
              
              <Button 
                size="sm" 
                onClick={() => setShowSaveDialog(true)}
                disabled={!user}
                className="w-full text-xs"
              >
                <Save size={12} className="mr-1" />
                Save Route
              </Button>
            </div>
          </>
        )}
      </div>
      
      {/* Save Dialog */}
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

export default RouteBuilder;