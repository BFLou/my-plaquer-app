// src/components/map/FloatingControls.tsx
import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Route, 
  Loader, 
  Navigation,
  Sliders,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FloatingControlsProps {
  mapStyle: 'street' | 'satellite' | 'terrain';
  onMapStyleChange: (style: 'street' | 'satellite' | 'terrain') => void;
  onFindLocation: () => void;
  isLoadingLocation: boolean;
  routeMode: boolean;
  onToggleRouteMode: () => void;
  routePointsCount: number;
  onClearRoute: () => void;
  distanceFilter: number | null;
  onDistanceFilterChange: (distance: number) => void;
  onClearDistanceFilter: () => void;
  className?: string;
}

const FloatingControls: React.FC<FloatingControlsProps> = ({
  mapStyle,
  onMapStyleChange,
  onFindLocation,
  isLoadingLocation,
  routeMode,
  onToggleRouteMode,
  routePointsCount,
  onClearRoute,
  distanceFilter,
  onDistanceFilterChange,
  onClearDistanceFilter,
  className = ''
}) => {
  const [showDistanceControl, setShowDistanceControl] = useState(false);

  const mapStyleNames = {
    'street': 'Street',
    'satellite': 'Satellite',
    'terrain': 'Terrain'
  };

  const distanceMarkers = [0.5, 1, 2, 3, 5]; // km

  return (
    <TooltipProvider>
      <div className={`absolute bottom-4 right-4 flex flex-col gap-3 z-[999] ${className}`}>
        
        {/* Distance Filter Control (appears when active) */}
        {(distanceFilter || showDistanceControl) && (
          <div className="bg-white rounded-lg shadow-lg p-4 w-64">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Distance Filter</span>
              </div>
              <button
                onClick={() => {
                  onClearDistanceFilter();
                  setShowDistanceControl(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-lg font-semibold text-green-600">
                  {distanceFilter?.toFixed(1) || '1.0'}km
                </span>
              </div>
              
              <div className="px-2">
                <Slider
                  value={[distanceFilter || 1]}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onValueChange={(values) => onDistanceFilterChange(values[0])}
                  className="w-full"
                />
                
                {/* Distance markers */}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  {distanceMarkers.map(marker => (
                    <span key={marker}>{marker}km</span>
                  ))}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 text-center">
                Showing plaques within selected radius
              </div>
            </div>
          </div>
        )}

        {/* Route Mode Panel (appears when in route mode) */}
        {routeMode && (
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 w-64">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Route Planning</span>
              </div>
              <button
                onClick={onToggleRouteMode}
                className="text-orange-600 hover:text-orange-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-xs text-orange-800 mb-2">
              Tap plaques on the map to add them to your route
            </div>
            
            {routePointsCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-900">
                  {routePointsCount} stops added
                </span>
                <button
                  onClick={onClearRoute}
                  className="text-xs text-orange-600 hover:text-orange-800 underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Control Buttons */}
        <div className="flex flex-col gap-2">
          
          {/* My Location Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onFindLocation}
                disabled={isLoadingLocation}
                className="w-12 h-12 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50"
              >
                {isLoadingLocation ? (
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <Navigation className="w-5 h-5 text-gray-700" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Find my location</p>
            </TooltipContent>
          </Tooltip>

          {/* Distance Filter Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDistanceControl(!showDistanceControl)}
                className={`w-12 h-12 rounded-full shadow-lg border-gray-200 ${
                  distanceFilter || showDistanceControl 
                    ? 'bg-green-100 border-green-300 text-green-700' 
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Sliders className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Distance filter</p>
            </TooltipContent>
          </Tooltip>

          {/* Map Style Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-12 h-12 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50 text-gray-700"
                    >
                      <Layers className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Map style</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="left" className="w-36">
              {Object.entries(mapStyleNames).map(([key, name]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onMapStyleChange(key as any)}
                  className={mapStyle === key ? 'bg-blue-50 text-blue-700' : ''}
                >
                  {name}
                  {mapStyle === key && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Route Planning Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleRouteMode}
                className={`w-12 h-12 rounded-full shadow-lg border-gray-200 ${
                  routeMode 
                    ? 'bg-orange-100 border-orange-300 text-orange-700' 
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Route className="w-5 h-5" />
                {routePointsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {routePointsCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{routeMode ? 'Exit route planning' : 'Plan walking route'}</p>
            </TooltipContent>
          </Tooltip>

        </div>
      </div>
    </TooltipProvider>
  );
};

export default FloatingControls;