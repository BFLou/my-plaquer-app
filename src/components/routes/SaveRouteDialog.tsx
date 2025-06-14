import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MobileInput } from '@/components/ui/mobile-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  isSaving = false,
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
      const startLocation =
        routePoints[0]?.address || routePoints[0]?.location || 'Start';
      const endLocation =
        routePoints[routePoints.length - 1]?.address ||
        routePoints[routePoints.length - 1]?.location ||
        'End';

      // Extract area names for cleaner default names
      const getAreaName = (location: string) => {
        if (!location) return '';
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
      description: description.trim(),
    });
  };

  const isFormValid = name.trim().length > 0 && routePoints.length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-auto mx-auto">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Route size={20} className="text-green-600 flex-shrink-0" />
            <span className="truncate">Save Walking Route</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Save your walking route to access it later and share with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Summary - Mobile Optimized */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-green-900 text-base sm:text-lg">
                Route Summary
              </h3>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 text-xs sm:text-sm"
              >
                {routePoints.length} stops
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="flex items-center gap-2 text-green-700">
                <MapPin size={16} className="flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  {formatDistance(routeDistance)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <Clock size={16} className="flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  {formatWalkingTime(routeDistance)}
                </span>
              </div>
            </div>

            {/* Route stops preview - Mobile Optimized */}
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="text-sm text-green-600 mb-2 font-medium">
                Route stops:
              </div>
              <div className="max-h-32 overflow-y-auto text-sm text-green-700 space-y-1">
                {routePoints.map((point, index) => (
                  <div key={point.id} className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 min-w-[24px] text-center">
                      {index + 1}
                    </span>
                    <span className="break-words flex-1 leading-relaxed text-xs sm:text-sm">
                      {point.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields - Mobile Optimized */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="route-name" className="text-sm font-medium">
                Route Name *
              </Label>
              <MobileInput
                id="route-name"
                placeholder="Enter a name for your route"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                maxLength={100}
                className="h-12"
              />
              <div className="text-xs text-gray-500 text-right">
                {name.length}/100 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="route-description"
                className="text-sm font-medium"
              >
                Description (optional)
              </Label>
              <Textarea
                id="route-description"
                placeholder="Add notes about your route, highlights, or recommendations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={4}
                maxLength={500}
                className="resize-none text-base"
                style={{ fontSize: '16px' }} // Prevent iOS zoom
              />
              <div className="text-xs text-gray-500 text-right">
                {description.length}/500 characters
              </div>
            </div>
          </div>

          {/* Privacy Notice - Mobile Optimized */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">🔒</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-blue-900 text-sm sm:text-base mb-1">
                  Private Route
                </div>
                <div className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                  Your route will be saved privately to your account. Only you
                  can access it. You can export it as GPX or share the details
                  manually if needed.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto order-2 sm:order-1 h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="w-full sm:w-auto min-w-[120px] order-1 sm:order-2 h-12"
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
