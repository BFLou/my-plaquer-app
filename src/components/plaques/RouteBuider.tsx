// src/components/plaques/RouteBuilder.tsx
import React, { useState, useEffect } from 'react';
import { 
  Trash, 
  Save, 
  Download, 
  Route as RouteIcon,
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
  Share2,
  Check,
  Globe
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plaque } from '@/types/plaque';
import { calculateRouteDistance, formatDistance, calculateWalkingTime } from '../maps/utils/routeUtils';
import { saveRouteToFirebase } from '@/services/RouteService';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RouteBuilderProps {
  routePoints: Plaque[];
  removePlaqueFromRoute: (id: number) => void;
  clearRoute: () => void;
  exportRoute: () => void;
  onRouteUpdated?: (route: any) => void;
  useImperial: boolean;
  setUseImperial: (value: boolean) => void;
  useRoadRouting: boolean;
  setUseRoadRouting: (value: boolean) => void;
  onClose: () => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onOptimize?: () => void;
  onSave?: (routeData: any) => void;
  className?: string;
}

/**
 * RouteBuilder Component
 * Displays and manages route details, points, and actions
 * Handles saving to Firebase
 */
const RouteBuilder: React.FC<RouteBuilderProps> = ({
  routePoints,
  removePlaqueFromRoute,
  clearRoute,
  exportRoute,
  onRouteUpdated,
  useImperial,
  setUseImperial,
  useRoadRouting,
  setUseRoadRouting,
  onClose,
  onMoveUp,
  onMoveDown,
  onOptimize,
  onSave,
  className = ''
}) => {
  // Auth state for Firebase
  const { user } = useAuth();
  
  // Local state
  const [routeDistance, setRouteDistance] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Calculate the total route distance
  useEffect(() => {
    if (routePoints.length >= 2) {
      const distance = calculateRouteDistance(routePoints);
      setRouteDistance(distance);
    } else {
      setRouteDistance(0);
    }
  }, [routePoints]);
  
  // Set default route name when opening the save dialog
  const handleOpenSaveDialog = () => {
    if (routePoints.length < 2) {
      toast.error("Add at least two plaques to save a route");
      return;
    }
    
    // Generate a default name based on the route points
    const now = new Date();
    const defaultName = `Route (${routePoints.length} stops) - ${now.toLocaleDateString()}`;
    setRouteName(defaultName);
    
    // Generate a default description
    const stops = routePoints.map(p => p.title).join(', ');
    setRouteDescription(`A ${formatDistance(routeDistance, useImperial)} route visiting: ${stops}`);
    
    setSaveDialogOpen(true);
  };
  
  // Handle saving the route to Firebase
  const handleSaveRoute = async () => {
    if (!user) {
      toast.error("You must be logged in to save routes");
      return;
    }
    
    if (routePoints.length < 2) {
      toast.error("A route must have at least two plaques");
      return;
    }
    
    if (!routeName.trim()) {
      toast.error("Please provide a name for your route");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const savedRoute = await saveRouteToFirebase(
        routeName,
        routePoints,
        routeDistance,
        user.uid,
        routeDescription,
        isPublic
      );
      
      if (savedRoute) {
        // Close the dialog
        setSaveDialogOpen(false);
        
        // Clear form state
        setRouteName('');
        setRouteDescription('');
        setIsPublic(false);
        
        // Call the onSave callback with the saved route data
        if (onSave) {
          onSave(savedRoute);
        }
        
        toast.success('Route saved successfully to your account');
      }
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle moving points up/down
  const handleMoveUp = (index: number) => {
    if (onMoveUp) onMoveUp(index);
  };
  
  const handleMoveDown = (index: number) => {
    if (onMoveDown) onMoveDown(index);
  };
  
  // Handle route optimization
  const handleOptimize = () => {
    if (onOptimize) onOptimize();
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-3 w-72 max-h-[70vh] overflow-auto ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5 text-green-800">
          <RouteIcon size={16} />
          Route Builder ({routePoints.length} stops)
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={onClose}
        >
          <X size={14} />
        </Button>
      </div>
      
      {/* Route stats with unit toggle */}
      <div className="bg-green-50 p-2 rounded-md mb-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-green-700">
            <div className="font-medium">Distance: {formatDistance(routeDistance, useImperial)}</div>
            <div>Walking time: ~{calculateWalkingTime(routeDistance, useImperial)}</div>
          </div>
          
          {/* Units toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs">
                  <span className={!useImperial ? "font-medium" : ""}>km</span>
                  <Switch 
                    checked={useImperial}
                    onCheckedChange={setUseImperial}
                    size="sm"
                  />
                  <span className={useImperial ? "font-medium" : ""}>mi</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Change distance units</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Route type toggle */}
        <div className="flex items-center justify-between mt-2 mb-1 text-xs text-green-700">
          <span>Route type:</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span className={!useRoadRouting ? "font-medium" : ""}>Direct</span>
                  <Switch 
                    checked={useRoadRouting}
                    onCheckedChange={setUseRoadRouting}
                    size="sm"
                  />
                  <span className={useRoadRouting ? "font-medium" : ""}>Road</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Toggle between direct lines and road-based routes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Optimize button */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-white w-full mt-1"
          onClick={handleOptimize}
          disabled={routePoints.length < 3}
        >
          <RefreshCw size={14} className="mr-1" />
          Optimize Route
        </Button>
      </div>
      
      {/* Route stops list */}
      <div className="space-y-2 my-3">
        {routePoints.length === 0 ? (
          <div className="text-center text-sm text-gray-500 p-4">
            Click on plaques to add them to your route
          </div>
        ) : (
          routePoints.map((point, index) => (
            <div key={point.id} className="flex items-center gap-2 p-2 border rounded-md">
              <Badge className={`h-6 w-6 flex-shrink-0 items-center justify-center p-0 ${
                index === 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : 
                index === routePoints.length - 1 ? "bg-red-100 text-red-800 hover:bg-red-200" :
                "bg-green-100 text-green-800 hover:bg-green-200"
              }`}>
                {index === 0 ? "S" : index === routePoints.length - 1 ? "E" : index + 1}
              </Badge>
              <div className="flex-grow truncate text-sm">{point.title}</div>
              <div className="flex gap-1">
                {index > 0 && index < routePoints.length - 1 && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100" 
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100" 
                      onClick={() => handleMoveDown(index)}
                      disabled={index === routePoints.length - 1}
                    >
                      <ArrowDown size={14} />
                    </Button>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" 
                  onClick={() => removePlaqueFromRoute(point.id)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={clearRoute}
          disabled={routePoints.length === 0}
        >
          <Trash size={14} className="mr-1" />
          Clear
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={exportRoute}
          disabled={routePoints.length < 2}
        >
          <Download size={14} className="mr-1" />
          Export
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={handleOpenSaveDialog}
          disabled={routePoints.length < 2 || !user}
          title={!user ? "Login to save routes" : ""}
        >
          <Save size={14} className="mr-1" />
          Save
        </Button>
      </div>
      
      {/* Save Route Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Route</DialogTitle>
            <DialogDescription>
              Enter a name and description for your walking route.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="route-name">Route Name</Label>
              <Input 
                id="route-name" 
                value={routeName} 
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="My Walking Route"
                className="col-span-3"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="route-description">Description (optional)</Label>
              <Textarea 
                id="route-description" 
                value={routeDescription} 
                onChange={(e) => setRouteDescription(e.target.value)}
                placeholder="Describe your route..."
                className="col-span-3 h-20"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public-route" className="flex items-center gap-1.5">
                  <Globe size={14} className="text-blue-500" />
                  Make Public
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow other users to view this route
                </p>
              </div>
              <Switch 
                id="public-route" 
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                <RouteIcon size={16} />
                Route Summary
              </h4>
              <div className="mt-2 text-xs text-amber-700">
                <p><span className="font-medium">Total Stops:</span> {routePoints.length}</p>
                <p><span className="font-medium">Distance:</span> {formatDistance(routeDistance, useImperial)}</p>
                <p><span className="font-medium">Walking Time:</span> ~{calculateWalkingTime(routeDistance, useImperial)}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleSaveRoute}
              disabled={!routeName.trim() || isSaving}
              className="gap-1"
            >
              {isSaving ? 
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Saving... 
                </> : 
                <>
                  <Check size={16} />
                  Save Route
                </>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RouteBuilder;