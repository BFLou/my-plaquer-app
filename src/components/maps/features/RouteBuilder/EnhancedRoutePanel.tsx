// src/components/maps/features/RouteBuilder/EnhancedRoutePanel.tsx - MOBILE OPTIMIZED
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  Route, 
  GripVertical, 
  ChevronDown, 
  ChevronUp,
  Clock,
  MapPin,
  AlertCircle,
  Save,
  Loader
} from 'lucide-react';
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from '@/components/ui/badge';
import { Plaque } from '@/types/plaque';
import { 
  calculateMultiWaypointRoute, 
  formatDistance, 
  formatDuration,
  RouteSegment 
} from '@/services/WalkingDistanceService';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useRoutes } from '@/hooks/useRoutes';
import { toast } from 'sonner';
import SaveRouteDialog from '@/components/routes/SaveRouteDialog';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

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
  const { user } = useAuth();
  const { requireAuthForRoute } = useAuthGate();
  const { createRoute } = useRoutes ? useRoutes() : { createRoute: null };
  
  // Mobile detection and responsive setup
  const mobile = isMobile();
  const safeArea = useSafeArea();
  
  // State management
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Route calculation state
  const [routeData, setRouteData] = useState<{
    totalDistance: number;
    totalDuration: number;
    segments: RouteSegment[];
    error?: string;
  } | null>(null);
  
  // Swipe gesture for mobile collapse/expand
  const { handleTouchStart, handleTouchEnd } = useSwipeGesture({
    onSwipe: (direction) => {
      if (mobile) {
        if (direction === 'up' && isCollapsed) {
          setIsCollapsed(false);
          triggerHapticFeedback('light');
        } else if (direction === 'down' && !isCollapsed) {
          setIsCollapsed(true);
          triggerHapticFeedback('light');
        }
      }
    },
    threshold: 50
  });
  
  // Calculate walking route when points change
  useEffect(() => {
    if (points.length >= 2) {
      setIsCalculating(true);
      calculateMultiWaypointRoute(points)
        .then(setRouteData)
        .catch(error => {
          console.error('Error calculating route:', error);
          setRouteData({
            totalDistance: 0,
            totalDuration: 0,
            segments: [],
            error: 'Failed to calculate route'
          });
        })
        .finally(() => setIsCalculating(false));
    } else {
      setRouteData(null);
    }
  }, [points]);
  
  // Fallback to straight-line calculation if no route data
  const fallbackStats = useMemo(() => {
    if (points.length < 2) return { distance: 0, duration: 0 };
    
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      if (start.latitude && start.longitude && end.latitude && end.longitude) {
        const startLat = parseFloat(start.latitude as string);
        const startLng = parseFloat(start.longitude as string);
        const endLat = parseFloat(end.latitude as string);
        const endLng = parseFloat(end.longitude as string);
        
        // Haversine distance * walking factor
        const R = 6371000;
        const dLat = (endLat - startLat) * Math.PI / 180;
        const dLng = (endLng - startLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        totalDistance += distance * 1.4; // Walking factor
      }
    }
    
    return {
      distance: totalDistance,
      duration: totalDistance / 1.39 // 5 km/h walking speed
    };
  }, [points]);
  
  // Use route data if available, otherwise fallback
  const displayStats = routeData ? {
    distance: routeData.totalDistance,
    duration: routeData.totalDuration,
    hasRealRoutes: true,
    error: routeData.error
  } : {
    distance: fallbackStats.distance,
    duration: fallbackStats.duration,
    hasRealRoutes: false,
    error: undefined
  };
  
  // Mobile drag handlers with haptic feedback
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (mobile) {
      triggerHapticFeedback('medium');
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      if (mobile) {
        triggerHapticFeedback('success');
      }
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };
  
  // Handle save route with auth gate integration
  const handleSaveRoute = async (data: { name: string; description: string }) => {
    if (points.length < 2) {
      toast.error("A route must have at least 2 stops");
      return;
    }

    const routeData = {
      name: data.name,
      description: data.description,
      points: points,
      distance: displayStats.distance / 1000 // Convert to km
    };

    const saveAction = async () => {
      try {
        setIsSaving(true);
        
        if (createRoute) {
          await createRoute(
            routeData.name,
            routeData.description,
            routeData.points,
            routeData.distance
          );
          toast.success("Route saved successfully!");
        } else {
          // Fallback if useRoutes hook is not available
          console.warn("createRoute function not available from useRoutes hook");
          
          // Save to localStorage as fallback
          const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
          savedRoutes.push({ ...routeData, id: Date.now(), created: new Date().toISOString() });
          localStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
          
          toast.success("Route saved locally");
        }
        
        setShowSaveDialog(false);
      } catch (error) {
        console.error("Error saving route:", error);
        toast.error("Failed to save route. Please try again.");
      } finally {
        setIsSaving(false);
      }
    };

    requireAuthForRoute(routeData, saveAction);
  };
  
  const handleExport = () => {
    if (points.length < 2) {
      toast.error("Need at least 2 points to export");
      return;
    }
    
    if (mobile) {
      triggerHapticFeedback('success');
    }
    
    const waypoints = points.map((point, index) => `
    <wpt lat="${point.latitude}" lon="${point.longitude}">
      <name>${point.title || `Stop ${index + 1}`}</name>
      <desc>${point.description || point.inscription || ''}</desc>
    </wpt>`).join('');
    
    const routeXml = routeData?.segments.length ? `
    <trk>
      <name>Walking Route</name>
      <trkseg>
        ${routeData.segments.map(segment => 
          segment.route.geometry.map(coord => 
            `<trkpt lat="${coord[0]}" lon="${coord[1]}"></trkpt>`
          ).join('')
        ).join('')}
      </trkseg>
    </trk>` : '';
    
    const gpxContent = `<?xml version="1.0"?>
<gpx version="1.1" creator="My-plaquer-App">
  <metadata>
    <name>Walking Route</name>
    <desc>Route with ${points.length} stops - ${formatDistance(displayStats.distance)} - ${formatDuration(displayStats.duration)}</desc>
  </metadata>
  ${waypoints}
  ${routeXml}
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
  
  const handleToggleCollapsed = () => {
    if (mobile) {
      triggerHapticFeedback('selection');
    }
    setIsCollapsed(!isCollapsed);
  };
  
  const handleRemovePoint = (id: number) => {
    if (mobile) {
      triggerHapticFeedback('light');
    }
    onRemove(id);
  };
  
  const handleClearRoute = () => {
    if (mobile) {
      triggerHapticFeedback('medium');
    }
    onClear();
  };
  
  // Mobile responsive dimensions
  const panelWidth = mobile ? '100%' : 'min(90vw, 400px)';
  const panelHeight = mobile ? 
    isCollapsed ? 'auto' : 'min(50vh, 400px)' : 
    'min(85vh, 600px)';
  
  if (points.length === 0) {
    return (
      <div 
        className={`bg-white rounded-lg shadow-lg ${mobile ? 'p-3' : 'p-4'} z-40 ${className}`}
        style={{ 
          width: panelWidth,
          marginBottom: mobile ? safeArea.bottom : undefined 
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`${mobile ? 'text-base' : 'text-sm'} font-medium flex items-center gap-2`}>
            <Route size={16} className="text-green-600" />
            Route Planner
          </h3>
          <MobileButton variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X size={16} />
          </MobileButton>
        </div>
        
        <div className="text-center py-8">
          <Route className="mx-auto text-gray-300 mb-3" size={32} />
          <p className={`${mobile ? 'text-base' : 'text-sm'} text-gray-500 mb-2`}>
            Click on plaques to build your route
          </p>
          <p className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-400`}>
            Routes will show real walking distances
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-lg flex flex-col overflow-hidden ${className}`}
        style={{
          width: panelWidth,
          height: panelHeight,
          maxHeight: mobile ? '60vh' : 'min(85vh, 600px)',
          minWidth: mobile ? 'auto' : '280px',
          marginBottom: mobile ? safeArea.bottom : undefined
        }}
        onTouchStart={mobile ? handleTouchStart : undefined}
        onTouchEnd={mobile ? handleTouchEnd : undefined}
      >
        {/* Header with mobile-optimized touch area */}
        <div 
          className={`flex justify-between items-center ${mobile ? 'p-3' : 'p-4'} border-b flex-shrink-0 ${
            mobile ? 'bg-gray-50' : ''
          }`}
          onClick={mobile ? handleToggleCollapsed : undefined}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Route size={16} className="text-green-600 flex-shrink-0" />
            <h3 className={`${mobile ? 'text-base' : 'text-sm'} font-medium truncate`}>
              Route Planner
            </h3>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {points.length} stops
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {mobile && (
              <MobileButton 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCollapsed();
                }}
              >
                {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </MobileButton>
            )}
            <MobileButton 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0" 
              onClick={onClose}
            >
              <X size={16} />
            </MobileButton>
          </div>
        </div>
        
        {!isCollapsed && (
          <>
            {/* Route Stats - Mobile optimized */}
            <div className={`${mobile ? 'p-3' : 'p-4'} bg-gradient-to-r from-green-50 to-blue-50 border-b flex-shrink-0`}>
              <div className={`flex justify-between items-center ${mobile ? 'text-base' : 'text-sm'}`}>
                <div className="flex items-center gap-1">
                  <MapPin size={mobile ? 16 : 14} className="text-green-600" />
                  <span className="font-medium">
                    {isCalculating ? (
                      <div className="flex items-center gap-1">
                        <Loader size={12} className="animate-spin" />
                        Calculating...
                      </div>
                    ) : (
                      formatDistance(displayStats.distance)
                    )}
                  </span>
                  {!displayStats.hasRealRoutes && !isCalculating && (
                    <span className="text-xs text-amber-600">(estimated)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={mobile ? 16 : 14} className="text-blue-600" />
                  <span className="font-medium">
                    {isCalculating ? '...' : formatDuration(displayStats.duration)}
                  </span>
                </div>
              </div>
              
              {displayStats.error && (
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                  <AlertCircle size={12} />
                  <span>{displayStats.error}</span>
                </div>
              )}
              
              {displayStats.hasRealRoutes && !isCalculating && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✓ Real walking distances calculated
                </div>
              )}
            </div>
            
            {/* Route Points - Scrollable with mobile optimization */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className={`${mobile ? 'p-3' : 'p-4'} space-y-3`}>
                {points.map((point, index) => {
                  const segmentData = routeData?.segments.find(s => s.from.id === point.id);
                  
                  return (
                    <div key={point.id}>
                      {/* Route Point with mobile-optimized touch targets */}
                      <div 
                        className={`flex items-center gap-3 ${mobile ? 'p-4' : 'p-3'} border rounded-lg hover:bg-gray-50 cursor-move transition-colors ${
                          mobile ? 'active:bg-gray-100' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                      >
                        <GripVertical 
                          size={mobile ? 20 : 16} 
                          className="text-gray-400 touch-manipulation flex-shrink-0" 
                        />
                        
                        <div className={`${mobile ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex items-center justify-center ${mobile ? 'text-base' : 'text-sm'} font-bold text-white flex-shrink-0 ${
                          index === 0 ? 'bg-green-500' : 
                          index === points.length - 1 ? 'bg-red-500' : 
                          'bg-blue-500'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className={`${mobile ? 'text-base' : 'text-sm'} font-medium truncate`}>
                            {point.title}
                          </div>
                          <div className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500 truncate`}>
                            {point.location || point.address}
                          </div>
                        </div>
                        
                        <MobileButton
                          variant="ghost"
                          size="sm"
                          className={`${mobile ? 'h-10 w-10' : 'h-8 w-8'} p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0`}
                          onClick={() => handleRemovePoint(point.id)}
                        >
                          <X size={mobile ? 16 : 14} />
                        </MobileButton>
                      </div>
                      
                      {/* Segment Info - Mobile optimized */}
                      {segmentData && index < points.length - 1 && (
                        <div className={`${mobile ? 'ml-10' : 'ml-8'} mt-2 mb-2 ${mobile ? 'text-sm' : 'text-xs'} text-gray-500 flex items-center gap-2`}>
                          <div className="w-px h-4 bg-gray-300"></div>
                          <span className="bg-gray-100 px-2 py-1 rounded text-nowrap">
                            {formatDistance(segmentData.route.distance)} • {formatDuration(segmentData.route.duration)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Actions - Mobile optimized */}
            <div className={`${mobile ? 'p-3' : 'p-4'} border-t space-y-3 flex-shrink-0`}>
              <div className={`grid ${mobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-2'}`}>
                <MobileButton 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExport} 
                  className={mobile ? 'w-full text-sm' : 'text-xs'}
                  disabled={points.length < 2}
                >
                  <Download size={mobile ? 16 : 12} className="mr-1" />
                  Export GPX
                </MobileButton>
                
                <MobileButton 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearRoute} 
                  className={`${mobile ? 'w-full text-sm' : 'text-xs'} text-red-600 hover:text-red-700`}
                >
                  <X size={mobile ? 16 : 12} className="mr-1" />
                  Clear All
                </MobileButton>
              </div>
              
              <MobileButton 
                size="sm" 
                onClick={() => setShowSaveDialog(true)}
                disabled={points.length < 2}
                className={`w-full ${mobile ? 'text-sm h-12' : 'text-xs'}`}
              >
                <Save size={mobile ? 16 : 12} className="mr-1" />
                {points.length < 2 ? 'Need 2+ Stops to Save' : 'Save Route'}
              </MobileButton>
              
              {points.length >= 2 && (
                <p className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500 text-center`}>
                  Save your route to access it later and share with others
                </p>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Save Route Dialog - Mobile optimized */}
      <SaveRouteDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveRoute}
        routePoints={points}
        routeDistance={displayStats.distance / 1000}
        useImperial={false}
        isSaving={isSaving}
      />
    </>
  );
};

export default EnhancedRoutePanel;