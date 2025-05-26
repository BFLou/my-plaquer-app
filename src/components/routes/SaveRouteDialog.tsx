// src/components/routes/SaveRouteDialog.tsx - FIXED: Removed public/private option
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Route } from 'lucide-react';
import { Plaque } from '@/types/plaque';

export interface SaveRouteData {
  name: string;
  description: string;
}

interface SaveRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveRouteData) => void;
  routePoints: Plaque[];
  routeDistance: number;
  useImperial?: boolean;
  isSaving?: boolean;
}

const SaveRouteDialog: React.FC<SaveRouteDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  routePoints,
  routeDistance,
  useImperial = false,
  isSaving = false
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  // Generate default name based on route
  React.useEffect(() => {
    if (isOpen && routePoints.length > 0 && !name) {
      const startLocation = routePoints[0]?.address || routePoints[0]?.location || 'Start';
      const endLocation = routePoints[routePoints.length - 1]?.address || routePoints[routePoints.length - 1]?.location || 'End';
      
      // Extract area names for cleaner default names
      const getAreaName = (location: string) => {
        if (!location) return '';
        // Try to extract the area/district name (usually the first part before comma)
        const parts = location.split(',');
        return parts[0].trim();
      };
      
      const startArea = getAreaName(startLocation);
      const endArea = getAreaName(endLocation);
      
      if (routePoints.length === 2) {
        setName(`${startArea} to ${endArea}`);
      } else {
        setName(`${startArea} Walking Tour (${routePoints.length} stops)`);
      }
    }
  }, [isOpen, routePoints, name]);

  const formatDistance = (km: number) => {
    if (useImperial) {
      const miles = km * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${km.toFixed(1)} km`;
  };

  const formatWalkingTime = (km: number) => {
    const minutes = useImperial 
      ? Math.round(km * 0.621371 * 20) // 20 minutes per mile
      : Math.round(km * 12); // 12 minutes per km
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim()
    });
  };

  const isFormValid = name.trim().length > 0 && routePoints.length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] z-[1100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route size={20} className="text-green-600" />
            Save Walking Route
          </DialogTitle>
          <DialogDescription>
            Save your walking route to access it later and share with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-green-900">Route Summary</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {routePoints.length} stops
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <MapPin size={16} />
                <span className="font-medium">{formatDistance(routeDistance)}</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <Clock size={16} />
                <span className="font-medium">{formatWalkingTime(routeDistance)}</span>
              </div>
            </div>

            {/* Route stops preview */}
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="text-xs text-green-600 mb-2">Route stops:</div>
              <div className="max-h-20 overflow-y-auto text-xs text-green-700">
                {routePoints.map((point, index) => (
                  <div key={point.id} className="flex items-center gap-2 mb-1">
                    <span className="font-mono w-4">{index + 1}.</span>
                    <span className="truncate">{point.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="route-name">Route Name *</Label>
              <Input
                id="route-name"
                placeholder="Enter a name for your route"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                maxLength={100}
              />
              <div className="text-xs text-gray-500 text-right">
                {name.length}/100 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="route-description">Description (optional)</Label>
              <Textarea
                id="route-description"
                placeholder="Add notes about your route, highlights, or recommendations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {description.length}/500 characters
              </div>
            </div>
          </div>

          {/* REMOVED: Public/Private toggle - Everything is private by default */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">🔒</span>
              </div>
              <div>
                <div className="font-medium text-blue-900 text-sm">Private Route</div>
                <div className="text-blue-700 text-xs">
                  Your route will be saved privately to your account. Only you can access it.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-b-transparent border-white animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Route'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveRouteDialog;