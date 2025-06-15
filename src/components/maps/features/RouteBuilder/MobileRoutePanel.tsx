// src/components/maps/features/RouteBuilder/MobileRoutePanel.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  Save,
  Route,
  GripVertical,
  Trash2,
  Navigation,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MobileButton } from '@/components/ui/mobile-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plaque } from '@/types/plaque';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';
import { useSafeArea } from '@/hooks/useSafeArea';
import { toast } from 'sonner';

interface MobileRoutePanelProps {
  points: Plaque[];
  onRemove: (id: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
  onClose: () => void;
  onSave: (routeData: any) => void;
  className?: string;
}

export const MobileRoutePanel: React.FC<MobileRoutePanelProps> = ({
  points,
  onRemove,
  onReorder,
  onClear,
  onClose,
  onSave,
  className = ''
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const safeArea = useSafeArea();
  const mobile = isMobile();

  // Calculate route stats
  const routeStats = useMemo(() => {
    if (points.length < 2) return null;
    
    // Simple distance calculation (you can enhance this)
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      // Use Haversine formula for each segment
      totalDistance += 0.5; // Placeholder - replace with actual calculation
    }
    
    return {
      distance: totalDistance,
      duration: Math.round(totalDistance * 12), // 12 min per km
      stops: points.length
    };
  }, [points]);

  // Handle minimize toggle
  const handleMinimizeToggle = useCallback(() => {
    if (mobile) triggerHapticFeedback('light');
    setIsMinimized(!isMinimized);
  }, [isMinimized, mobile]);

  // Handle save route
  const handleSave = useCallback(() => {
    if (points.length < 2) {
      toast.error('Need at least 2 stops to save route');
      return;
    }

    if (mobile) triggerHapticFeedback('success');
    
    const routeData = {
      name: `Route ${new Date().toLocaleDateString()}`,
      points,
      distance: routeStats?.distance || 0,
      duration: routeStats?.duration || 0
    };
    
    onSave(routeData);
  }, [points, routeStats, onSave, mobile]);

  // Handle drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (mobile) triggerHapticFeedback('medium');
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [mobile]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      if (mobile) triggerHapticFeedback('success');
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  }, [draggedIndex, onReorder, mobile]);

  if (points.length === 0) return null;

  // Calculate position to avoid overlapping with mobile nav
  const panelStyle = {
    bottom: `${80 + safeArea.bottom}px`, // 64px nav + 16px margin + safe area
    maxHeight: isMinimized ? '60px' : '50vh'
  };

  return (
    <div 
      className={`fixed inset-x-4 z-[985] ${className}`}
      style={panelStyle}
    >
      <Card className="bg-white/98 backdrop-blur shadow-2xl border border-gray-200/50">
        {/* Header */}
        <CardHeader 
          className="pb-2 cursor-pointer"
          onClick={handleMinimizeToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Route size={14} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  Route Planning
                  <Badge variant="secondary" className="text-xs h-4 px-1.5">
                    {points.length}
                  </Badge>
                </h3>
                {routeStats && (
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Navigation size={8} />
                      {routeStats.distance.toFixed(1)}km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={8} />
                      {routeStats.duration}min
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMinimizeToggle();
                }}
                className="h-7 w-7 p-0"
              >
                {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </MobileButton>
              
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="h-7 w-7 p-0"
              >
                <X size={14} />
              </MobileButton>
            </div>
          </div>
        </CardHeader>

        {/* Content - Only show when not minimized */}
        {!isMinimized && (
          <CardContent className="pt-0 pb-3">
            {/* Route Points */}
            <div className="max-h-32 overflow-y-auto mb-3 space-y-2">
              {points.map((point, index) => (
                <div
                  key={point.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {/* Drag handle */}
                  <GripVertical size={12} className="text-gray-400 cursor-move" />
                  
                  {/* Route marker */}
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-green-500' : 
                      index === points.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  >
                    {index === 0 ? 'S' : index === points.length - 1 ? 'E' : index + 1}
                  </div>
                  
                  {/* Stop info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">
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
                    onClick={() => onRemove(point.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                    touchOptimized
                  >
                    <Trash2 size={10} />
                  </MobileButton>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <MobileButton
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10"
                onClick={handleSave}
                disabled={points.length < 2}
                touchOptimized
              >
                <Save size={14} className="mr-2" />
                Save Route
              </MobileButton>
              
              <MobileButton
                variant="outline"
                className="h-10 px-3 text-red-600 hover:bg-red-50"
                onClick={onClear}
                touchOptimized
              >
                <Trash2 size={14} />
              </MobileButton>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};