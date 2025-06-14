// src/components/routes/EditRouteForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Save, X } from 'lucide-react';
import { RouteData } from '@/hooks/useRoutes';

interface EditRouteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  route: RouteData | null;
  isSaving: boolean;
}

const EditRouteForm: React.FC<EditRouteFormProps> = ({
  isOpen,
  onClose,
  onSave,
  route,
  isSaving,
}) => {
  const [routeName, setRouteName] = useState('');
  const [description, setDescription] = useState('');

  // Populate form when route changes
  useEffect(() => {
    if (route) {
      setRouteName(route.name || '');
      setDescription(route.description || '');
    }
  }, [route]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRouteName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!routeName.trim()) {
      return;
    }

    await onSave({
      name: routeName.trim(),
      description: description.trim(),
    });
  };

  const handleCancel = () => {
    if (route) {
      setRouteName(route.name || '');
      setDescription(route.description || '');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Route</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="route-name">Route Name *</Label>
            <Input
              id="route-name"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Enter route name"
              required
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-description">Description</Label>
            <Textarea
              id="route-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your route (optional)"
              rows={3}
              disabled={isSaving}
            />
          </div>

          {route && (
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-2">
                Route Details
              </h4>
              <div className="text-xs text-amber-700 space-y-1">
                <p>
                  <span className="font-medium">Stops:</span>{' '}
                  {route.points.length}
                </p>
                <p>
                  <span className="font-medium">Distance:</span>{' '}
                  {route.total_distance.toFixed(1)} km
                </p>
                <p>
                  <span className="font-medium">Est. Walking Time:</span> ~
                  {Math.ceil(route.total_distance * 12)} minutes
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={!routeName.trim() || isSaving}>
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent mr-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRouteForm;
