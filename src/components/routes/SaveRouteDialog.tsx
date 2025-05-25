// src/components/routes/SaveRouteDialog.tsx
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Save, 
  MapPin, 
  Clock, 
  Route as RouteIcon,
  Globe,
  Lock
} from 'lucide-react';
import { Plaque } from '@/types/plaque';

interface SaveRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveRouteData) => Promise<void>;
  routePoints: Plaque[];
  routeDistance: number;
  useImperial: boolean;
  isSaving?: boolean;
  initialData?: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  };
}

export interface SaveRouteData {
  name: string;
  description: string;
  isPublic: boolean;
}

const SaveRouteDialog: React.FC<SaveRouteDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  routePoints,
  routeDistance,
  useImperial,
  isSaving = false,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || `Walking Route - ${new Date().toLocaleDateString()}`,
    description: initialData?.description || '',
    isPublic: initialData?.isPublic || false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate estimated walking time (12 minutes per km + 2 minutes per stop)
  const estimatedDuration = React.useMemo(() => {
    const baseMinutes = routeDistance * 12;
    const stopTime = routePoints.length * 2;
    return Math.round(baseMinutes + stopTime);
  }, [routeDistance, routePoints.length]);

  // Format distance
  const formatDistance = (km: number) => {
    if (useImperial) {
      const miles = km * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${km.toFixed(1)} km`;
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Route name is required';
    }
    
    if (formData.name.length > 100) {
      newErrors.name = 'Route name must be less than 100 characters';
    }
    
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  // Get stop label (A, B, C, etc.)
  const getStopLabel = (index: number, total: number) => {
    if (index === 0) return 'A';
    if (index === total - 1) return 'B';
    return String.fromCharCode(65 + index);
  };

  // Get stop color
  const getStopColor = (index: number, total: number) => {
    if (index === 0) return 'bg-green-500';
    if (index === total - 1) return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save size={20} className="text-green-600" />
            Save Walking Route
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Route Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <RouteIcon size={16} />
              Route Summary
            </h3>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-600" />
                <span className="font-medium">{formatDistance(routeDistance)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-600" />
                <span className="font-medium">{formatDuration(estimatedDuration)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {routePoints.length} stops
                </Badge>
              </div>
            </div>
          </div>

          {/* Route Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Route Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter a memorable name for your route"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-xs">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what makes this route special..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Optional - help others discover your route</span>
              <span>{formData.description.length}/500</span>
            </div>
            {errors.description && (
              <p className="text-red-500 text-xs">{errors.description}</p>
            )}
          </div>

          {/* Visibility Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Visibility</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {formData.isPublic ? (
                  <Globe size={16} className="text-blue-600" />
                ) : (
                  <Lock size={16} className="text-gray-600" />
                )}
                <div>
                  <Label htmlFor="visibility" className="text-sm font-medium">
                    {formData.isPublic ? 'Public Route' : 'Private Route'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {formData.isPublic 
                      ? 'Others can discover and view this route' 
                      : 'Only you can see this route'
                    }
                  </p>
                </div>
              </div>
              <Switch
                id="visibility"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
          </div>

          {/* Route Stops Preview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Route Stops</h3>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {routePoints.map((point, index) => (
                <div key={point.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getStopColor(index, routePoints.length)}`}>
                    {getStopLabel(index, routePoints.length)}
                  </div>
                  <div className="flex-1 truncate">{point.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Saving...
              </>
            ) : (
              <>
                <Save size={14} className="mr-2" />
                Save Route
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveRouteDialog;