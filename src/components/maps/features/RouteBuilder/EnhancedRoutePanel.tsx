// src/components/maps/features/RouteBuilder/EnhancedRoutePanel.tsx - FIXED: Using SaveRouteDialog
import React, { useState, useCallback, useMemo } from 'react';
import { 
  X, 
  Download, 
  Route, 
  GripVertical, 
  Save,
  Navigation,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { toast } from 'sonner';
import SaveRouteDialog, { SaveRouteData } from '@/components/routes/SaveRouteDialog';

interface EnhancedRoutePanelProps {
  points: Plaque[];
  onRemove: (id: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
  onClose: () => void;
  className?: string;
  onRouteAction?: (routeData: any) => void;
}

export const EnhancedRoutePanel: React.FC<EnhancedRoutePanelProps> = ({
  points,
  onRemove,
  onReorder,
  onClear,
  onClose,
  className = '',
  onRouteAction
}) => {
  const mobile = isMobile();
  const safeArea = useSafeArea();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Swipe gesture for mobile
  const { handleTouchStart, handleTouchEnd } = useSwipeGesture({
    onSwipe: (direction) => {
      if (mobile) {
        if (direction === 'down' && !isCollapsed) {
          setIsCollapsed(true);
          triggerHapticFeedback('light');
        } else if (direction === 'up' && isCollapsed) {
          setIsCollapsed(false);
          triggerHapticFeedback('light');
        }
      }
    },
    threshold: 50
  });

  // Calculate simple route stats
  const routeStats = useMemo(() => {
    if (points.length < 2) return null;
    
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      if (start.latitude && start.longitude && end.latitude && end.longitude) {
        const startLat = typeof start.latitude === 'string' ? parseFloat(start.latitude) : start.latitude;
        const startLng = typeof start.longitude === 'string' ? parseFloat(start.longitude) : start.longitude;
        const endLat = typeof end.latitude === 'string' ? parseFloat(end.latitude) : end.latitude;
        const endLng = typeof end.longitude === 'string' ? parseFloat(end.longitude) : end.longitude;
        
        // Haversine distance
        const R = 6371000;
        const dLat = (endLat - startLat) * Math.PI / 180;
        const dLng = (endLng - startLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        totalDistance += R * c * 1.4; // Walking factor
      }
    }
    
    const totalDuration = totalDistance / 1.39; // 5 km/h walking speed
    return { distance: totalDistance, duration: totalDuration };
  }, [points]);

  // Format display values
  const formattedDistance = routeStats ? 
    (routeStats.distance < 1000 ? 
      `${Math.round(routeStats.distance)}m` : 
      `${(routeStats.distance / 1000).toFixed(1)}km`) : '0m';
      
  const formattedDuration = routeStats ? 
    (routeStats.duration < 3600 ? 
      `${Math.round(routeStats.duration / 60)}min` : 
      `${Math.floor(routeStats.duration / 3600)}h ${Math.round((routeStats.duration % 3600) / 60)}min`) : '0min';

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (mobile) triggerHapticFeedback('medium');
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [mobile]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      if (mobile) triggerHapticFeedback('success');
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, mobile, onReorder]);

  const handleRemoveStop = useCallback((id: number) => {
    if (mobile) triggerHapticFeedback('light');
    onRemove(id);
  }, [mobile, onRemove]);

  const handleToggleCollapse = useCallback(() => {
    if (mobile) triggerHapticFeedback('selection');
    setIsCollapsed(!isCollapsed);
  }, [mobile, isCollapsed]);

  const handleExport = useCallback(() => {
    if (points.length < 2) {
      toast.error("Need at least 2 points to export");
      return;
    }
    
    if (mobile) triggerHapticFeedback('success');
    
    const waypoints = points.map((point, index) => `
    <wpt lat="${point.latitude}" lon="${point.longitude}">
      <name>${point.title || `Stop ${index + 1}`}</name>
      <desc>${point.description || point.inscription || ''}</desc>
    </wpt>`).join('');
    
    const gpxContent = `<?xml version="1.0"?>
<gpx version="1.1" creator="Plaque-Explorer-App">
  <metadata>
    <name>London Plaque Walking Route</name>
    <desc>Route with ${points.length} stops - ${formattedDistance} - ${formattedDuration}</desc>
  </metadata>
  ${waypoints}
</gpx>`;
    
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plaque-route-${Date.now()}.gpx`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Route exported as GPX file");
  }, [points, formattedDistance, formattedDuration, mobile]);

  // FIXED: Handle save route using SaveRouteDialog
  const handleSaveRoute = useCallback(() => {
    if (points.length < 2) {
      toast.error('Need at least 2 stops to save route');
      return;
    }
    
    if (mobile) triggerHapticFeedback('medium');
    setShowSaveDialog(true);
  }, [points.length, mobile]);

  // Handle save from dialog
  const handleSaveFromDialog = useCallback(async (data: SaveRouteData) => {
    setIsSaving(true);
    
    try {
      if (mobile) triggerHapticFeedback('success');
      
      const routeData = {
        name: data.name,
        description: data.description,
        points,
        distance: routeStats?.distance || 0,
        duration: routeStats?.duration || 0,
        total_distance: routeStats ? routeStats.distance / 1000 : 0 // Convert to km
      };
      
      // Call the route action handler
      if (onRouteAction) {
        onRouteAction(routeData);
      }
      
      setShowSaveDialog(false);
      toast.success('Route saved successfully!');
      
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [points, routeStats, onRouteAction, mobile]);

  // Panel positioning
  const panelStyle = useMemo(() => {
    if (mobile) {
      return {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: isCollapsed ? 'translateY(calc(100% - 60px))' : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        paddingBottom: safeArea.bottom
      };
    } else {
      return {
        position: 'fixed' as const,
        right: 16,
        top: 80,
        bottom: 80,
        width: '300px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 1000
      };
    }
  }, [mobile, isCollapsed, safeArea.bottom]);

  // Empty state
  if (points.length === 0) {
    return (
 <div style={panelStyle} className={className}>
        <div className="bg-white rounded-t-xl md:rounded-xl shadow-xl border border-gray-200">
          <div className="p-6 text-center">
            <div className="mb-4">
              <Route className="mx-auto mb-3 text-gray-400" size={48} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
              Plan Your Route
            </h3>
            <p className="text-base text-gray-600 mb-6 leading-relaxed max-w-sm mx-auto">
              Click plaques on the map to add them to your route
            </p>
            <MobileButton
              onClick={onClose}
              variant="outline"
              className="w-full font-medium"
              touchOptimized={mobile}
            >
              Exit Route Mode
            </MobileButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={panelStyle} className={className}>
        <div 
          className="bg-white rounded-t-xl md:rounded-xl shadow-xl border border-gray-200 flex flex-col h-full max-h-[70vh] md:max-h-none"
          onTouchStart={mobile ? handleTouchStart : undefined}
          onTouchEnd={mobile ? handleTouchEnd : undefined}
        >
          {/* Header */}
          <div 
            className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl cursor-pointer"
            onClick={mobile ? handleToggleCollapse : undefined}
          >
            {mobile && (
              <div className="flex justify-center mb-2">
                <div className="w-8 h-1 bg-gray-300 rounded-full" />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Route size={16} className="text-green-600" />
                </div>
                
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Route
                    <Badge variant="secondary" className="text-xs">
                      {points.length} stops
                    </Badge>
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Navigation size={10} />
                      {formattedDistance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formattedDuration}
                    </span>
                    <span className="text-amber-600">~estimated</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {mobile && (
                  <MobileButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCollapse();
                    }}
                    className="h-8 w-8 p-0"
                  >
                    {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </MobileButton>
                )}
                
                <MobileButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                  touchOptimized={mobile}
                >
                  <X size={16} />
                </MobileButton>
              </div>
            </div>
          </div>

          {/* Route Stops - Only show when expanded */}
          {!isCollapsed && (
            <>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 space-y-2">
                  {points.map((point, index) => {
                    const isStart = index === 0;
                    const isEnd = index === points.length - 1;
                    const isDragTarget = dragOverIndex === index;
                    const isBeingDragged = draggedIndex === index;
                    
                    return (
                      <div key={point.id} className="relative">
                        {/* Route line connector */}
                        {index < points.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-300 z-0" />
                        )}
                        
                        {/* Stop card */}
                        <div
                          className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-all relative z-10 ${
                            isDragTarget ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          } ${
                            isBeingDragged ? 'opacity-50 scale-95' : 'hover:border-gray-300'
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          {/* Drag handle */}
                          <GripVertical size={16} className="text-gray-400 cursor-move flex-shrink-0" />
                          
                          {/* Route marker */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                            isStart ? 'bg-green-500' : 
                            isEnd ? 'bg-red-500' : 
                            'bg-blue-500'
                          }`}>
                            {isStart ? 'A' : isEnd ? 'B' : String.fromCharCode(65 + index)}
                          </div>
                          
                          {/* Stop info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {point.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {point.location || point.address}
                            </div>
                          </div>
                          
                          {/* Remove button */}
                          <MobileButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStop(point.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 flex-shrink-0"
                            touchOptimized={mobile}
                          >
                            <Trash2 size={14} />
                          </MobileButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <MobileButton
                    variant="default"
                    size="sm"
                    onClick={handleSaveRoute}
                    className="bg-green-600 hover:bg-green-700"
                    touchOptimized={mobile}
                    disabled={points.length < 2}
                  >
                    <Save size={14} className="mr-1" />
                    Save Route
                  </MobileButton>
                  
                  <MobileButton
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    touchOptimized={mobile}
                    disabled={points.length < 2}
                  >
                    <Download size={14} className="mr-1" />
                    Export GPX
                  </MobileButton>
                </div>
                
                <MobileButton
                  variant="outline"
                  onClick={onClear}
                  className="w-full text-red-600 hover:bg-red-50"
                  touchOptimized={mobile}
                >
                  <Trash2 size={14} className="mr-2" />
                  Clear Route
                </MobileButton>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save Route Dialog */}
      <SaveRouteDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveFromDialog}
        routePoints={points}
        routeDistance={routeStats ? routeStats.distance / 1000 : 0}
        isSaving={isSaving}
        useImperial={false}
      />
    </>
  );
};

export default EnhancedRoutePanel;