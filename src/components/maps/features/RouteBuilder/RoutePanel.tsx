// src/components/maps/features/RouteBuilder/RoutePanel.tsx
import React, { useState } from 'react';
import { X, Download, Route, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plaque } from '@/types/plaque';
import { calculateDistance, formatDistance } from '../../utils/routeUtils';

interface RoutePanelProps {
  points: Plaque[];
  onRemove: (id: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  points,
  onRemove,
  onReorder,
  onClear,
  onClose
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Calculate total distance
  const totalDistance = React.useMemo(() => {
    if (points.length < 2) return 0;
    
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      distance += calculateDistance(
        parseFloat(start.latitude as string),
        parseFloat(start.longitude as string),
        parseFloat(end.latitude as string),
        parseFloat(end.longitude as string)
      );
    }
    return distance;
  }, [points]);
  
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
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };
  
  const handleExport = () => {
    const gpx = generateGPX(points);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${Date.now()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route size={20} className="text-green-600" />
          <h3 className="font-medium text-gray-900">Route Planning</h3>
          <span className="text-sm text-gray-500">
            {points.length} {points.length === 1 ? 'stop' : 'stops'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          {/* Stats */}
          {points.length >= 2 && (
            <div className="px-4 py-2 bg-blue-50 text-sm">
              <span className="font-medium">Total distance:</span>{' '}
              {formatDistance(totalDistance)} • {' '}
              <span className="font-medium">Est. time:</span>{' '}
              {Math.round(totalDistance * 12)} min
            </div>
          )}
          
          {/* Route Points */}
          <div className="max-h-80 overflow-y-auto p-2">
            {points.length === 0 ? (
              <div className="py-8 px-4 text-center text-gray-500">
                <Route size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click plaques on the map to build your route</p>
              </div>
            ) : (
              <div className="space-y-2">
                {points.map((point, index) => (
                  <div
                    key={point.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100"
                  >
                    <GripVertical size={16} className="text-gray-400" />
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                     ${index === 0 ? 'bg-green-500' : index === points.length - 1 ? 'bg-red-500' : 'bg-blue-500'}
                   `}>
                     {String.fromCharCode(65 + index)}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="text-sm font-medium truncate">{point.title}</div>
                     <div className="text-xs text-gray-500 truncate">{point.location || point.address}</div>
                   </div>
                   <button
                     onClick={() => onRemove(point.id)}
                     className="p-1 hover:bg-gray-200 rounded"
                   >
                     <X size={14} />
                   </button>
                 </div>
               ))}
             </div>
           )}
         </div>
         
         {/* Actions */}
         {points.length > 0 && (
           <div className="p-3 border-t bg-gray-50 flex gap-2">
             <Button
               variant="outline"
               size="sm"
               onClick={handleExport}
               className="flex-1"
             >
               <Download size={14} className="mr-2" />
               Export GPX
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={onClear}
               className="flex-1 text-red-600 hover:text-red-700"
             >
               Clear Route
             </Button>
           </div>
         )}
       </>
     )}
   </div>
 );
};

// Helper function to generate GPX
function generateGPX(points: Plaque[]): string {
 const waypoints = points.map((point, index) => `
   <wpt lat="${point.latitude}" lon="${point.longitude}">
     <name>${point.title || `Point ${index + 1}`}</name>
     <desc>${point.description || point.inscription || ''}</desc>
   </wpt>
 `).join('');
 
 return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Plaque Explorer">
 <metadata>
   <name>Plaque Walking Route</name>
   <time>${new Date().toISOString()}</time>
 </metadata>
 ${waypoints}
</gpx>`;
}