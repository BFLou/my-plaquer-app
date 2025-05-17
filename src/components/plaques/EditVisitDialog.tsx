// src/components/plaques/EditVisitDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Star, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Plaque } from '@/types/plaque';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { toast } from 'sonner';

interface EditVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plaque: Plaque | null;
  visitId: string | null;
  onVisitUpdated: () => void;
  onVisitDeleted?: () => void;
}

const EditVisitDialog: React.FC<EditVisitDialogProps> = ({
  isOpen,
  onClose,
  plaque,
  visitId,
  onVisitUpdated,
  onVisitDeleted,
}) => {
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { updateVisit, removeVisit, visits } = useVisitedPlaques();

  useEffect(() => {
    if (isOpen && visitId) {
      const visitData = visits.find((v) => v.id === visitId);
      if (visitData) {
        if (visitData.visited_at) {
          const date = visitData.visited_at.toDate
            ? visitData.visited_at.toDate()
            : new Date(visitData.visited_at);
          setVisitDate(date);
        }
        setNotes(visitData.notes || '');
        setRating(visitData.rating || 0);
      }
    }
  }, [isOpen, visitId, visits]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setVisitDate(date);
      setShowDatePicker(false);
    }
  };

  const handleSetRating = (value: number) => {
    setRating((prev) => (prev === value ? 0 : value));
  };

  const handleSave = async () => {
    if (!visitId) return;
    setIsLoading(true);
    try {
      await updateVisit(visitId, {
        visitedAt: visitDate.toISOString(),
        notes,
        rating,
      });
      toast.success('Visit updated successfully');
      onVisitUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Failed to update visit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!visitId) return;
    setIsLoading(true);
    try {
      await removeVisit(visitId);
      toast.success('Visit record deleted');
      onVisitDeleted ? onVisitDeleted() : onVisitUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('Failed to delete visit');
    } finally {
      setIsLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  if (!plaque) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Visit - {plaque.title}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Visit Date:</label>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(visitDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={visitDate}
                  onSelect={handleDateChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes:</label>
            <Textarea
              placeholder="What did you find interesting?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your rating:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className={`px-2 ${
                    rating >= value ? 'text-amber-500' : 'text-gray-300'
                  }`}
                  onClick={() => handleSetRating(value)}
                >
                  <Star
                    size={20}
                    className={rating >= value ? 'fill-amber-500' : ''}
                  />
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            disabled={isLoading}
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this visit? This cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Visit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default EditVisitDialog;
