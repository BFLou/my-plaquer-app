// src/components/routes/SaveRouteDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, RouteIcon } from 'lucide-react';
import { Plaque } from '@/types/plaque';
import { formatDistance, calculateWalkingTime } from '../maps/utils/routeUtils';

interface SaveRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
  }) => Promise<void>;
  routePoints: Plaque[];
  routeDistance: number;
  useImperial: boolean;
  isSaving: boolean;
}

const SaveRouteDialog: React.FC<SaveRouteDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  routePoints,
  routeDistance,
  useImperial,
  isSaving
}) => {
  // Generate default name
  const now = new Date();
  const defaultName = `Route (${routePoints.length} stops) - ${now.toLocaleDateString()}`;
  
  // State
  const [routeName, setRouteName] = useState(defaultName);
  const [description, setDescription] = useState('');
  
  // Handle save
  const handleSave = async () => {
    await onSave({
      name: routeName,
      description
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your route..."
              className="col-span-3 h-20"
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
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
  );
};

export default SaveRouteDialog;