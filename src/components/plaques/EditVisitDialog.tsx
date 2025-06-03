// src/components/plaques/EditVisitDialog.tsx - Mobile optimized
import React, { useState, useEffect } from 'react';
import { MobileDialog } from '@/components/ui/mobile-dialog';
import { MobileButton } from '@/components/ui/mobile-button';
import { MobileTextarea } from '@/components/ui/mobile-textarea';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Plaque } from '@/types/plaque';
import { useVisitedPlaques } from '@/hooks/useVisitedPlaques';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import { toast } from 'sonner';
import { triggerHapticFeedback } from '@/utils/mobileUtils';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { updateVisit, removeVisit, visits } = useVisitedPlaques();
  const { isKeyboardOpen, keyboardHeight } = useKeyboardDetection();

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
      }
    }
  }, [isOpen, visitId, visits]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      triggerHapticFeedback('selection');
      setVisitDate(date);
      setShowDatePicker(false);
    }
  };

  const handleSave = async () => {
    if (!visitId) return;
    
    setIsLoading(true);
    triggerHapticFeedback('light');
    
    try {
      await updateVisit(visitId, {
        visitedAt: visitDate.toISOString(),
        notes,
      });
      
      triggerHapticFeedback('success');
      toast.success('Visit updated successfully');
      onVisitUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating visit:', error);
      triggerHapticFeedback('error');
      toast.error('Failed to update visit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!visitId) return;
    
    setIsLoading(true);
    triggerHapticFeedback('light');
    
    try {
      await removeVisit(visitId);
      triggerHapticFeedback('success');
      toast.success('Visit record deleted');
      onVisitDeleted ? onVisitDeleted() : onVisitUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting visit:', error);
      triggerHapticFeedback('error');
      toast.error('Failed to delete visit');
    } finally {
      setIsLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleDeleteClick = () => {
    triggerHapticFeedback('warning');
    setIsDeleteConfirmOpen(true);
  };

  if (!plaque) return null;

  return (
    <>
      <MobileDialog
        isOpen={isOpen}
        onClose={onClose}
        title={`Edit Visit - ${plaque.title}`}
        size="md"
        className={isKeyboardOpen ? `mb-[${keyboardHeight}px]` : ''}
        footer={
          <div className="flex flex-col sm:flex-row justify-between gap-3 w-full">
            <MobileButton
              variant="outline"
              onClick={handleDeleteClick}
              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 flex-1 sm:flex-initial"
              disabled={isLoading}
            >
              <Trash2 size={18} className="mr-2" />
              Delete
            </MobileButton>

            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <MobileButton 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </MobileButton>
              <MobileButton 
                onClick={handleSave} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </MobileButton>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Date Selection - Mobile optimized */}
          <div className="space-y-3">
            <label className="text-base font-medium block">Visit Date:</label>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <MobileButton
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-12"
                  touchOptimized={true}
                >
                  <CalendarIcon className="mr-3 h-5 w-5" />
                  <span className="text-base">{format(visitDate, 'PPP')}</span>
                </MobileButton>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0" 
                align="start"
                side="bottom"
                sideOffset={8}
              >
                <Calendar
                  mode="single"
                  selected={visitDate}
                  onSelect={handleDateChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                  initialFocus
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes - Mobile optimized */}
          <div className="space-y-3">
            <label className="text-base font-medium block">Notes:</label>
            <MobileTextarea
              placeholder="What did you find interesting about this visit?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
              preventZoom={true}
            />
            <div className="text-sm text-gray-500">
              {notes.length}/500 characters
            </div>
          </div>
        </div>
      </MobileDialog>

      {/* Delete Confirmation Dialog - Mobile optimized */}
      <MobileDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Confirm Deletion"
        size="sm"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <MobileButton
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </MobileButton>
            <MobileButton
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Deleting...' : 'Delete Visit'}
            </MobileButton>
          </div>
        }
      >
        <div className="py-4">
          <p className="text-base text-gray-700 leading-relaxed">
            Are you sure you want to delete this visit record? This action cannot be undone.
          </p>
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Visit Date:</strong> {format(visitDate, 'PPP')}
            </p>
            {notes && (
              <p className="text-sm text-red-800 mt-1">
                <strong>Notes:</strong> {notes.substring(0, 100)}{notes.length > 100 ? '...' : ''}
              </p>
            )}
          </div>
        </div>
      </MobileDialog>
    </>
  );
};

export default EditVisitDialog;