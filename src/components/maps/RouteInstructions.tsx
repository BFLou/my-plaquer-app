// src/components/maps/RouteInstructions.tsx - New component for walking directions
import React, { useState } from 'react';
import { 
  Navigation, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  type: 'turn' | 'straight' | 'arrive';
}

interface RouteInstructionsProps {
  steps: RouteStep[];
  totalDistance: number;
  totalDuration: number;
  useImperial: boolean;
  className?: string;
}

const RouteInstructions: React.FC<RouteInstructionsProps> = ({
  steps,
  totalDistance,
  totalDuration,
  useImperial,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatDistance = (meters: number) => {
    if (useImperial) {
      const feet = meters * 3.28084;
      if (feet < 1000) return `${Math.round(feet)} ft`;
      const miles = feet / 5280;
      return `${miles.toFixed(1)} mi`;
    } else {
      if (meters < 1000) return `${Math.round(meters)} m`;
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  if (steps.length === 0) return null;
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Summary Header */}
      <div 
        className="p-4 border-b cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Navigation size={16} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-sm">Walking Directions</div>
              <div className="text-xs text-gray-500">
                {formatDistance(totalDistance)} • {formatDuration(totalDuration)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {steps.length} steps
            </Badge>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>
      
      {/* Detailed Steps */}
      {isExpanded && (
        <div className="max-h-80 overflow-y-auto">
          {steps.map((step, index) => (
            <div key={index} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 mb-1">
                    {step.instruction}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatDistance(step.distance)}</span>
                    <span>•</span>
                    <span>{formatDuration(step.duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RouteInstructions;