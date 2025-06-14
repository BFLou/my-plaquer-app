// src/components/maps/features/RouteBuilder/EnhancedRoutePanel.tsx - FIXED: All TypeScript errors resolved
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
  Loader,
  ArrowUpDown,
  Zap,
  Search,
  Navigation,
  Share,
  Eye,
  Settings
} from 'lucide-react';
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Plaque } from '@/types/plaque';
import { 
  calculateMultiWaypointRoute, 
  formatDistance, 
  formatDuration,
  RouteSegment 
} from '@/services/WalkingDistanceService';
import { optimizeRoute } from '../../utils/routeUtils';
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
  // New props for enhanced functionality
  allPlaques?: Plaque[];
  onAddPlaque?: (plaque: Plaque) => void;
  onShareRoute?: (routeData: any) => void;
}

export const EnhancedRoutePanel: React.FC<EnhancedRoutePanelProps> = ({
  points,
  onRemove,
  onReorder,
  onClear,
  onClose,
  className = '',
  allPlaques = [],
  onAddPlaque,
  onShareRoute
}) => {
  const { requireAuthForRoute } = useAuthGate();
  const { createRoute } = useRoutes ? useRoutes() : { createRoute: null };
  
  // Mobile detection and responsive setup
  const mobile = isMobile();
  const safeArea = useSafeArea();
  
  // Enhanced state management
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // NEW: Enhanced UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [showDirections, setShowDirections] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Route calculation state with enhanced error handling
  const [routeData, setRouteData] = useState<{
    totalDistance: number;
    totalDuration: number;
    segments: RouteSegment[];
    error?: string;
    isEstimated?: boolean;
  } | null>(null);

  // NEW: Drag and drop visual states
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Enhanced swipe gesture for mobile collapse/expand
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
  
  // Enhanced route calculation with better error handling
  useEffect(() => {
    if (points.length >= 2) {
      setIsCalculating(true);
      calculateMultiWaypointRoute(points)
        .then(result => {
          setRouteData({
            ...result,
            isEstimated: !result.segments || result.segments.length === 0
          });
        })
        .catch(error => {
          console.error('Error calculating route:', error);
          setRouteData({
            totalDistance: 0,
            totalDuration: 0,
            segments: [],
            error: 'Failed to calculate route - using estimated distances',
            isEstimated: true
          });
        })
        .finally(() => setIsCalculating(false));
    } else {
      setRouteData(null);
    }
  }, [points]);

  // Auto-optimize when enabled
  useEffect(() => {
    if (autoOptimize && points.length > 2) {
      const timeoutId = setTimeout(() => {
        handleOptimizeRoute(true); // silent optimization
      }, 1000); // Debounce auto-optimization
      
      return () => clearTimeout(timeoutId);
    }
  }, [points.length]); // Only trigger on point count change, not full points array
  
  // Enhanced fallback stats calculation
  const fallbackStats = useMemo(() => {
    if (points.length < 2) return { distance: 0, duration: 0 };
    
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      if (start.latitude && start.longitude && end.latitude && end.longitude) {
        const startLat = typeof start.latitude === 'string' 
          ? parseFloat(start.latitude) 
          : start.latitude;
        const startLng = typeof start.longitude === 'string' 
          ? parseFloat(start.longitude) 
          : start.longitude;
        const endLat = typeof end.latitude === 'string' 
          ? parseFloat(end.latitude) 
          : end.latitude;
        const endLng = typeof end.longitude === 'string' 
          ? parseFloat(end.longitude) 
          : end.longitude;
        
        // Enhanced Haversine calculation with walking factor
        const R = 6371000;
        const dLat = (endLat - startLat) * Math.PI / 180;
        const dLng = (endLng - startLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        totalDistance += distance * 1.4; // Walking factor for realistic estimates
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
    hasRealRoutes: !routeData.isEstimated,
    error: routeData.error,
    isEstimated: routeData.isEstimated
  } : {
    distance: fallbackStats.distance,
    duration: fallbackStats.duration,
    hasRealRoutes: false,
    error: undefined,
    isEstimated: true
  };

  // NEW: Filter plaques for search
  const filteredPlaques = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return allPlaques
      .filter(plaque => 
        !points.find(p => p.id === plaque.id) && // Not already in route
        (
          plaque.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plaque.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plaque.profession?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      .slice(0, 5); // Limit results
  }, [searchQuery, allPlaques, points]);
  
  // Enhanced drag handlers with visual feedback
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (mobile) {
      triggerHapticFeedback('medium');
    }
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create ghost image
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `
      <div style="
        background: white;
        border-radius: 8px;
        padding: 8px 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        max-width: 200px;
      ">
        📍 ${points[index].title}
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      if (mobile) {
        triggerHapticFeedback('success');
      }
      onReorder(draggedIndex, dropIndex);
      toast.success('Route reordered');
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };
  
  // NEW: Enhanced route optimization
  const handleOptimizeRoute = async (silent = false) => {
    if (points.length < 3) {
      if (!silent) {
        toast.error("Need at least 3 stops to optimize");
      }
      return;
    }

    setIsOptimizing(true);
    if (mobile && !silent) {
      triggerHapticFeedback('medium');
    }
    
    try {
      const optimizedPoints = optimizeRoute(points);
      
      // Apply the optimization by reordering points
      for (let i = 0; i < optimizedPoints.length; i++) {
        const currentIndex = points.findIndex(p => p.id === optimizedPoints[i].id);
        if (currentIndex !== i && currentIndex !== -1) {
          onReorder(currentIndex, i);
        }
      }
      
      if (!silent) {
        toast.success("Route optimized for shorter walking distance");
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      if (!silent) {
        toast.error("Failed to optimize route");
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  // NEW: Swap start and end points
  const handleSwapStartEnd = () => {
    if (points.length < 2) return;
    
    if (mobile) {
      triggerHapticFeedback('medium');
    }
    
    onReorder(0, points.length - 1);
    toast.success("Start and end points swapped");
  };

  // NEW: Add plaque from search
  const handleAddFromSearch = (plaque: Plaque) => {
    if (onAddPlaque) {
      onAddPlaque(plaque);
      setSearchQuery('');
      if (mobile) {
        triggerHapticFeedback('success');
      }
      toast.success(`Added "${plaque.title}" to route`);
    }
  };

  // Enhanced save route handler
  const handleSaveRoute = async (data: { name: string; description: string; isPublic?: boolean }) => {
    if (points.length < 2) {
      toast.error("A route must have at least 2 stops");
      return;
    }

    const routeData = {
      name: data.name,
      description: data.description,
      points: points,
      distance: displayStats.distance / 1000,
      isPublic: data.isPublic || false
    };

    const saveAction = async () => {
      try {
        setIsSaving(true);
        
        if (createRoute) {
          const savedRoute = await createRoute(
            routeData.name,
            routeData.description,
            routeData.points,
            routeData.distance
          );
          
          toast.success("Route saved successfully!");
          
          // Generate shareable link if public
          if (data.isPublic && savedRoute) {
            const shareUrl = `${window.location.origin}/routes/${savedRoute.id}`;
            if (onShareRoute) {
              onShareRoute({ ...savedRoute, shareUrl });
            }
          }
        } else {
          // Fallback to localStorage
          const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
          const newRoute = { 
            ...routeData, 
            id: Date.now(), 
            created: new Date().toISOString() 
          };
          savedRoutes.push(newRoute);
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
  
  // Enhanced export with better format options
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
      <type>${index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'waypoint'}</type>
    </wpt>`).join('');
    
    const routeXml = routeData?.segments.length ? `
    <trk>
      <name>Walking Route - ${displayStats.hasRealRoutes ? 'Calculated' : 'Estimated'}</name>
      <trkseg>
        ${routeData.segments.map(segment => 
          segment.route.geometry.map(coord => 
            `<trkpt lat="${coord[0]}" lon="${coord[1]}"></trkpt>`
          ).join('')
        ).join('')}
      </trkseg>
    </trk>` : '';
    
    const gpxContent = `<?xml version="1.0"?>
<gpx version="1.1" creator="Plaque-Explorer-App">
  <metadata>
    <name>London Plaque Walking Route</name>
    <desc>Route with ${points.length} stops - ${formatDistance(displayStats.distance)} - ${formatDuration(displayStats.duration)}${displayStats.isEstimated ? ' (estimated)' : ''}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  ${waypoints}
  ${routeXml}
</gpx>`;
    
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plaque-route-${Date.now()}.gpx`;
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
  const panelWidth = mobile ? '100%' : 'min(90vw, 420px)';
  const panelHeight = mobile ? 
    isCollapsed ? 'auto' : 'min(60vh, 500px)' : 
    'min(85vh, 650px)';
  
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
        
        {/* Enhanced empty state with search */}
        <div className="text-center py-6">
          <Route className="mx-auto text-gray-300 mb-3" size={32} />
          <p className={`${mobile ? 'text-base' : 'text-sm'} text-gray-500 mb-2`}>
            Start building your route
          </p>
          <p className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-400 mb-4`}>
            Click plaques on the map or search below
          </p>
          
          {/* Search for plaques */}
          {allPlaques.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-2 p-2 border rounded-lg">
                <Search size={16} className="text-gray-400" />
                <Input
                  placeholder="Search plaques to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 p-0 focus:ring-0"
                />
              </div>
              
              {/* Search results */}
              {filteredPlaques.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredPlaques.map(plaque => (
                    <button
                      key={plaque.id}
                      onClick={() => handleAddFromSearch(plaque)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-sm">{plaque.title}</div>
                      <div className="text-xs text-gray-500">{plaque.location}</div>
                      {plaque.profession && (
                        <div className="text-xs text-blue-600 mt-1">{plaque.profession}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
          maxHeight: mobile ? '70vh' : 'min(85vh, 650px)',
          minWidth: mobile ? 'auto' : '320px',
          marginBottom: mobile ? safeArea.bottom : undefined
        }}
        onTouchStart={mobile ? handleTouchStart : undefined}
        onTouchEnd={mobile ? handleTouchEnd : undefined}
      >
        {/* Enhanced header with more actions */}
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
            {displayStats.isEstimated && (
              <Badge variant="outline" className="text-xs flex-shrink-0 text-amber-600 border-amber-200">
                Estimated
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!mobile && points.length > 2 && (
              <MobileButton 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={() => handleOptimizeRoute()}
                disabled={isOptimizing}
                title="Optimize route"
              >
                {isOptimizing ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
              </MobileButton>
            )}
            {!mobile && points.length >= 2 && (
              <MobileButton 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={handleSwapStartEnd}
                title="Swap start/end"
              >
                <ArrowUpDown size={14} />
              </MobileButton>
            )}
            {mobile && (
              <MobileButton 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={(e: React.MouseEvent) => {
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
            {/* Enhanced route stats with status indicators */}
            <div className={`${mobile ? 'p-3' : 'p-4'} bg-gradient-to-r from-green-50 to-blue-50 border-b flex-shrink-0`}>
              <div className={`flex justify-between items-center ${mobile ? 'text-base' : 'text-sm'} mb-2`}>
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
              
              {/* Status indicators */}
              <div className="flex flex-wrap gap-2 text-xs">
                {displayStats.error && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle size={12} />
                    <span>{displayStats.error}</span>
                  </div>
                )}
                
                {displayStats.hasRealRoutes && !isCalculating && (
                  <div className="text-green-600 font-medium">
                    ✓ Real walking routes calculated
                  </div>
                )}

                {routeData?.segments && routeData.segments.length > 0 && (
                  <MobileButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDirections(!showDirections)}
                    className="h-5 px-2 text-xs"
                  >
                    <Navigation size={10} className="mr-1" />
                    {showDirections ? 'Hide' : 'Show'} Directions
                  </MobileButton>
                )}
              </div>
            </div>

            {/* Enhanced quick actions bar */}
            {mobile && (
              <div className="p-3 border-b bg-gray-50 flex gap-2 flex-shrink-0">
                {points.length > 2 && (
                  <MobileButton 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOptimizeRoute()}
                    disabled={isOptimizing}
                    className="flex-1 text-xs"
                  >
                    {isOptimizing ? <Loader size={12} className="animate-spin mr-1" /> : <Zap size={12} className="mr-1" />}
                    Optimize
                  </MobileButton>
                )}
                {points.length >= 2 && (
                  <MobileButton 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSwapStartEnd}
                    className="flex-1 text-xs"
                  >
                    <ArrowUpDown size={12} className="mr-1" />
                    Reverse
                  </MobileButton>
                )}
                <MobileButton 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs"
                >
                  <Settings size={12} />
                </MobileButton>
              </div>
            )}

            {/* Advanced settings panel */}
            {showAdvanced && (
              <div className="p-3 border-b bg-gray-50 space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-optimize" className="text-sm font-medium">
                    Auto-optimize route
                  </Label>
                  <Switch
                    id="auto-optimize"
                    checked={autoOptimize}
                    onCheckedChange={setAutoOptimize}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Automatically reorder stops for optimal walking distance when adding new points
                </p>
              </div>
            )}

            {/* Turn-by-turn directions (collapsible) */}
            {showDirections && routeData?.segments && (
              <Collapsible open={showDirections} onOpenChange={setShowDirections}>
                <CollapsibleContent>
                  <div className="p-3 border-b bg-blue-50 max-h-32 overflow-y-auto flex-shrink-0">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Navigation size={14} />
                      Walking Directions
                    </h4>
                    <div className="space-y-1 text-xs">
                      {routeData.segments.map((segment, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 font-medium">{index + 1}.</span>
                          <span>
                            Walk {formatDistance(segment.route.distance)} to {segment.to.title}
                            {segment.route.duration && (
                              <span className="text-gray-500 ml-1">
                                (~{formatDuration(segment.route.duration)})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Route Points - Scrollable with enhanced drag and drop */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className={`${mobile ? 'p-3' : 'p-4'} space-y-3`}>
                {points.map((point, index) => {
                  const segmentData = routeData?.segments.find(s => s.from.id === point.id);
                  const isStart = index === 0;
                  const isEnd = index === points.length - 1;
                  const isDragTarget = dragOverIndex === index;
                  const isBeingDragged = draggedIndex === index;
                  
                  return (
                    <div key={point.id}>
                      {/* Enhanced Route Point with better visual feedback */}
                      <div 
                        className={`flex items-center gap-3 ${mobile ? 'p-4' : 'p-3'} border rounded-lg transition-all duration-200 cursor-move ${
                          isDragTarget ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        } ${
                          isBeingDragged ? 'opacity-50 scale-95' : 'hover:bg-gray-50'
                        } ${
                          mobile ? 'active:bg-gray-100' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <GripVertical 
                          size={mobile ? 20 : 16} 
                          className={`text-gray-400 touch-manipulation flex-shrink-0 ${
                            isDragging ? 'text-blue-500' : ''
                          }`} 
                        />
                        
                        {/* Enhanced route marker with better styling */}
                        <div className={`${mobile ? 'w-12 h-12' : 'w-10 h-10'} rounded-full flex items-center justify-center ${mobile ? 'text-base' : 'text-sm'} font-bold text-white flex-shrink-0 relative ${
                          isStart ? 'bg-green-500' : 
                          isEnd ? 'bg-red-500' : 
                          'bg-blue-500'
                        }`}>
                          {isStart ? (
                            <span className="text-xs font-bold">START</span>
                          ) : isEnd ? (
                            <span className="text-xs font-bold">END</span>
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                          
                          {/* Visual indicator for optimized order */}
                          {autoOptimize && !isStart && !isEnd && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Zap size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className={`${mobile ? 'text-base' : 'text-sm'} font-medium truncate`}>
                            {point.title}
                          </div>
                          <div className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500 truncate`}>
                            {point.location || point.address}
                          </div>
                          {point.profession && (
                            <div className={`${mobile ? 'text-xs' : 'text-xs'} text-blue-600 truncate mt-1`}>
                              {point.profession}
                            </div>
                          )}
                        </div>
                        
                        {/* Enhanced remove button with confirmation for important points */}
                        <MobileButton
                          variant="ghost"
                          size="sm"
                          className={`${mobile ? 'h-10 w-10' : 'h-8 w-8'} p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0`}
                          onClick={() => {
                            if ((isStart || isEnd) && points.length > 2) {
                              // Show confirmation for start/end points
                              if (confirm(`Remove ${isStart ? 'start' : 'end'} point "${point.title}"?`)) {
                                handleRemovePoint(point.id);
                              }
                            } else {
                              handleRemovePoint(point.id);
                            }
                          }}
                          title={`Remove ${point.title}`}
                        >
                          <X size={mobile ? 16 : 14} />
                        </MobileButton>
                      </div>
                      
                      {/* Enhanced segment info with walking instructions */}
                      {segmentData && index < points.length - 1 && (
                        <div className={`${mobile ? 'ml-12' : 'ml-10'} mt-2 mb-2`}>
                          <div className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500 flex items-center gap-2`}>
                            <div className="w-px h-6 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                              <div className="bg-gray-100 px-2 py-1 rounded text-nowrap flex items-center gap-1">
                                <Navigation size={10} />
                                {formatDistance(segmentData.route.distance)} • {formatDuration(segmentData.route.duration)}
                              </div>
                              {/* Instructions removed: Property does not exist on WalkingRoute */}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Add point section for easy route building */}
                {allPlaques.length > 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Search size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Add another stop</span>
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="Search plaques..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-sm"
                      />
                      
                      {/* Enhanced search results with better UX */}
                      {filteredPlaques.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          {filteredPlaques.map(plaque => (
                            <button
                              key={plaque.id}
                              onClick={() => handleAddFromSearch(plaque)}
                              className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{plaque.title}</div>
                                  <div className="text-xs text-gray-500 truncate">{plaque.location}</div>
                                  {plaque.profession && (
                                    <div className="text-xs text-blue-600 mt-1 truncate">{plaque.profession}</div>
                                  )}
                                </div>
                                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">+</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Enhanced Actions with better organization */}
            <div className={`${mobile ? 'p-3' : 'p-4'} border-t space-y-3 flex-shrink-0`}>
              {/* Primary actions */}
              <div className={`grid ${mobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-2'}`}>
                <MobileButton 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExport} 
                  className={mobile ? 'w-full text-sm' : 'text-xs'}
                  disabled={points.length < 2}
                  title="Export route as GPX file for GPS devices"
                >
                  <Download size={mobile ? 16 : 12} className="mr-1" />
                  Export GPX
                </MobileButton>
                
                {onShareRoute && (
                  <MobileButton 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const routeData = {
                        points,
                        distance: displayStats.distance,
                        duration: displayStats.duration
                      };
                      onShareRoute(routeData);
                    }}
                    className={mobile ? 'w-full text-sm' : 'text-xs'}
                    disabled={points.length < 2}
                  >
                    <Share size={mobile ? 16 : 12} className="mr-1" />
                    Share Route
                  </MobileButton>
                )}
                
                {!onShareRoute && (
                  <MobileButton 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearRoute} 
                    className={`${mobile ? 'w-full text-sm' : 'text-xs'} text-red-600 hover:text-red-700`}
                  >
                    <X size={mobile ? 16 : 12} className="mr-1" />
                    Clear All
                  </MobileButton>
                )}
              </div>
              
              {/* Save button - prominent placement */}
              <MobileButton 
                size="sm" 
                onClick={() => setShowSaveDialog(true)}
                disabled={points.length < 2 || isSaving}
                className={`w-full ${mobile ? 'text-sm h-12' : 'text-xs'} bg-green-600 hover:bg-green-700`}
              >
                {isSaving ? (
                  <Loader size={mobile ? 16 : 12} className="animate-spin mr-1" />
                ) : (
                  <Save size={mobile ? 16 : 12} className="mr-1" />
                )}
                {points.length < 2 ? 'Need 2+ Stops to Save' : isSaving ? 'Saving...' : 'Save Route'}
              </MobileButton>
              
              {/* Secondary actions */}
              {onShareRoute && (
                <div className="flex gap-2">
                  <MobileButton 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearRoute} 
                    className={`flex-1 ${mobile ? 'text-sm' : 'text-xs'} text-red-600 hover:text-red-700`}
                  >
                    <X size={mobile ? 16 : 12} className="mr-1" />
                    Clear All
                  </MobileButton>
                  
                  <MobileButton 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Open route in map view
                      window.open(`/map?route=${encodeURIComponent(JSON.stringify(points.map(p => p.id)))}`, '_blank');
                    }}
                    className={`flex-1 ${mobile ? 'text-sm' : 'text-xs'}`}
                    disabled={points.length < 2}
                  >
                    <Eye size={mobile ? 16 : 12} className="mr-1" />
                    View on Map
                  </MobileButton>
                </div>
              )}
              
              {/* Help text */}
              {points.length >= 2 && (
                <p className={`${mobile ? 'text-sm' : 'text-xs'} text-gray-500 text-center`}>
                  {displayStats.hasRealRoutes ? 
                    '✓ Real walking routes calculated with turn-by-turn directions' :
                    '⚠️ Estimated distances - actual routes may vary'
                  }
                </p>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Enhanced Save Route Dialog with public sharing option */}
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